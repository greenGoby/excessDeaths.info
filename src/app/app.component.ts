import {Component, HostListener, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {AsyncSubject, Observable, Subject} from "rxjs";
import {debounceTime} from "rxjs/operators";
import {DataService} from "./services/data.service";
import {DatePipe, DecimalPipe, PercentPipe} from "@angular/common";
import {
  CovidDataResponse,
  ExcessDeathsDataItem,
  ExcessDeathsResponse,
  StateCovidData,
  StateExcessDeathData
} from "./dto/stats";
import {State, STATES} from "./dto/states";
import { Options } from '@angular-slider/ngx-slider';

import * as _moment from 'moment';
import {MatDatepicker} from "@angular/material/datepicker";
// tslint:disable-next-line:no-duplicate-imports
// import {default as _rollupMoment, Moment} from 'moment';
import {Moment} from 'moment';
import {MatInput} from "@angular/material/input";
import {FormControl} from "@angular/forms";

const moment =  _moment;

export const MONTH_MAX_DAYS:Array<number> = [
  31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31
];

declare var window:any;
declare var google:any;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'excessDeaths';

  chartsLoaded:boolean = false;
  excessDeathsLoaded:boolean = false;
  covidDataLoaded:boolean = false;

  states = STATES;
  currentState:State = STATES[0];
  stateList:State[] = STATES;
  stateToState:Map<string,State> = new Map<string,State>();
  stateToExcessDeathData:Map<string, StateExcessDeathData> = new Map<string, StateExcessDeathData>();
  currentExcess:number = 0;
  currentCovid:number = 0;
  minDate:Date;
  maxDate:Date;
  stateToCovidDeathData:Map<string, StateCovidData> = new Map<string, StateCovidData>();

  userMinDate:Date;
  userMaxDate:Date;

  currentChart: any;

  monthOptions: Options = {
    floor: 1,
    ceil: 10,
    step: 1,
    showTicks: true,
    showTicksValues: false,
    hideLimitLabels: true,
    hidePointerLabels: true
  };

  // resizing variables
  resizeSubject:Subject<any> = new Subject();
  viewWidth:number = 0;
  viewHeight:number = 0;
  graphWidth:number = 0;
  graphHeight:number = 0;
  static readonly TOP_ROW_ADJUSTMENT:number = 70;
  static readonly ACTION_BAR_ADJUSTMENT:number = 70;

  fromDate = new FormControl(moment());
  toDate = new FormControl(moment());

  constructor( private dataService:DataService,
               private decimalPipe:DecimalPipe,
               private percentPipe:PercentPipe,
               private datePipe:DatePipe ) {

    google.charts.load('current', {'packages':['corechart'], 'callback': ()=> {
      this.chartsLoaded = true;
      this.checkWindowResized();
      }},  );

    for( let state of STATES ){
      this.stateToState.set( state.name, state );
    }
    this.monthOptions.stepsArray = [];

    this.resizeSubject.pipe( debounceTime( 1000 ) ).subscribe( (event) => {
      this.windowResized(event);
    })
  }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
      // event.target.innerWidth;
      this.resizeSubject.next(event);
    }

   ngAfterViewInit() {
    this.dataService.getExcessDeaths().subscribe( (response:ExcessDeathsResponse) => {
      this.stateToExcessDeathData = new Map<string, StateExcessDeathData>();
      for( let item of response.items ){
        let currentStateItem:StateExcessDeathData = null;
        if( this.stateToExcessDeathData.has(item.state) ){
         currentStateItem = this.stateToExcessDeathData.get( item.state );
        }
        else {
          currentStateItem = new StateExcessDeathData();
          currentStateItem.stateName = item.state;
          this.stateToExcessDeathData.set( item.state, currentStateItem );
        }
        currentStateItem.items.push( item );
      }
      this.excessDeathsLoaded = true;
      this.checkWindowResized();
    });
    this.loadState( this.currentState ).subscribe( (stateCovidData:StateCovidData) => {
      this.covidDataLoaded = true;
      this.checkWindowResized();
    });
   }

   checkWindowResized() {
    if( this.chartsLoaded && this.excessDeathsLoaded && this.covidDataLoaded ){
      this.windowResized(null);
    }
   }

   stateChanged() {
     this.loadState( this.currentState ).subscribe( (stateCovidData:StateCovidData) => {
       this.drawVisualization();
     });
   }

    windowResized( event ){
      let width = window.innerWidth;
      let height = window.innerHeight;
      let originalWidth:number = width;
      let originalHeight:number = height;
      console.log( "window resize " + width + " " + height);
      this.viewWidth = originalWidth;
      this.viewHeight = originalHeight - AppComponent.TOP_ROW_ADJUSTMENT;
      this.graphHeight = originalHeight - (AppComponent.TOP_ROW_ADJUSTMENT + AppComponent.ACTION_BAR_ADJUSTMENT);
      this.graphWidth = originalWidth - 10;
      console.log( "view  " + this.viewWidth + " " + this.viewHeight );
      setTimeout( ()=> {
        this.drawVisualization();
      });
    }


  drawVisualization() {

    let excessDeaths:number = 0;
    let covidDeaths:number = 0;
    let minValue:number = 1000000;
    let maxValue:number = 0;

    let data = new google.visualization.DataTable();
    data.addColumn('date', 'Week Ending');
    data.addColumn('number', 'Expected Deaths');
    data.addColumn('number', 'Actual Deaths');
    data.addColumn('number', 'Covid Deaths');

    let stateData:StateExcessDeathData = this.stateToExcessDeathData.get( this.currentState.name );
    if( !stateData.covidDataMerged ){
      stateData.mergeCovidData( this.stateToCovidDeathData.get( this.currentState.name ) );
    }
    let foundMax:boolean = false;
    for( let x=0; !foundMax && (x<stateData.items.length); x++ ){
      let item:ExcessDeathsDataItem = stateData.items[x];
      let allowItem:boolean = true;
      if( this.userMinDate && (this.userMinDate.getTime() > item.weekEnding.getTime()) ){
        allowItem = false;
        // console.log( "Disallowed due to minimum " + item.weekEnding );
      }
      if( allowItem && this.userMaxDate && (this.userMaxDate.getTime() < item.weekEnding.getTime())){
        allowItem = false;
        // console.log( "Disallowed due to maximum " + item.weekEnding + " > " + this.userMaxDate  );
        foundMax = true;
      }
      if( allowItem ){
        let itemArray = [];
        itemArray.push( item.weekEnding );
        itemArray.push( item.expected );
        let itemExcess:number = item.actual - item.expected;
        // itemArray.push( itemExcess );
        itemArray.push( item.actual );
        let currentCovidDeaths = item.expected + item.covidDeaths;
        itemArray.push( currentCovidDeaths );
        minValue = Math.min( item.expected, minValue );
        minValue = Math.min( item.actual, minValue );
        maxValue = Math.max( item.expected, maxValue );
        maxValue = Math.max( item.actual, maxValue );
        maxValue = Math.max( currentCovidDeaths, maxValue );
        if( itemExcess > 0 ){
          excessDeaths = excessDeaths + itemExcess;
        }
        if( item.covidDeaths > 0 ){
          covidDeaths = covidDeaths + item.covidDeaths;
        }
        data.addRow( itemArray );
      }
    }

   this.currentExcess = excessDeaths;
    this.currentCovid = covidDeaths;
    console.log( "Excess: " + this.currentExcess + " Covid: " + this.currentCovid );
    minValue = minValue - (minValue * .05);
    maxValue = maxValue + (maxValue * .05);
    minValue = Math.max( 0, minValue );
    console.log( "Min:" + minValue + " Max:" + maxValue );

    let options = {
      legend: {
        position: 'top',
        alignment: 'center'
      },
      // isStacked: 'true',
      hAxis: {
        title: '',
      },
      vAxis: {
        title: '',
        minValue: minValue,
        maxValue: maxValue,
        // viewWindowMode: 'maximized'
        viewWindow : {
          min: minValue,
          max: maxValue
        }
      },
      series: {
        0: {
          // type: 'area'
          type: 'line'
        },
        1: {
          // type: 'area'
          type: 'line'
        }
      },
      chartArea: {'width': '90%', 'height': '85%'}
    };
    this.currentChart = new google.visualization.ComboChart(document.getElementById('chart_div'));
    this.currentChart.draw(data, options);
    this.minDate = stateData.items[0].weekEnding;
    this.maxDate = stateData.items[stateData.items.length - 1].weekEnding;
    if( !(this.userMinDate) ) {
      this.userMinDate = new Date(this.minDate);
      this.fromDate.setValue( new Date( this.minDate ) );
    }
    if( !(this.userMaxDate) ){
      this.userMaxDate = new Date( this.maxDate );
      this.toDate.setValue( new Date( this.maxDate ) );
    }
  }

  minValueChanged() {
    const ctrlValue = this.fromDate.value;
    this.userMinDate = new Date( ctrlValue );
    console.log( "setting user min date to " + this.userMinDate + " " + ctrlValue );
    this.drawVisualization();
  }

  maxValueChanged() {
    const ctrlValue = this.toDate.value;
    this.userMaxDate = new Date( ctrlValue );
    console.log( "setting user max date to " + this.userMaxDate + " " + ctrlValue );
    this.drawVisualization();
  }

  minMonthHandler(normalizedMonth: Moment, datepicker: MatDatepicker<Moment>) {
    const ctrlValue = this.fromDate.value;
    ctrlValue.month(normalizedMonth.month());
    ctrlValue.day(1);
    this.fromDate.setValue(ctrlValue);
    this.userMinDate = new Date( ctrlValue );
    this.userMinDate.setDate( 1 );
    console.log( "setting min date to " + this.userMinDate + " " + ctrlValue );
    datepicker.close();
    this.drawVisualization();
  }

  maxYearHandler(normalizedYear: Moment) {
    const ctrlValue = this.toDate.value;
    ctrlValue.year(normalizedYear.year());
    this.toDate.setValue(ctrlValue);
    this.userMaxDate = new Date( ctrlValue );
    console.log( "setting max date to " + this.userMaxDate + " " + ctrlValue );
  }

  maxMonthHandler(normalizedMonth: Moment, datepicker: MatDatepicker<Moment>) {
    const ctrlValue = this.toDate.value;
    ctrlValue.month(normalizedMonth.month());
    ctrlValue.day(1);
    this.toDate.setValue(ctrlValue);
    this.userMaxDate = new Date( ctrlValue );
    this.userMaxDate.setDate( MONTH_MAX_DAYS[this.userMaxDate.getMonth()] );
    console.log( "setting max date to " + this.userMaxDate + " " + ctrlValue );
    datepicker.close();
    this.drawVisualization();
  }

  loadState( state:State ) : Observable<StateCovidData> {
    let returnObservable:AsyncSubject<StateCovidData> = new AsyncSubject<StateCovidData>();
    let stateName:string = state.name;
    if( this.stateToCovidDeathData.has(stateName) ){
      returnObservable.next( this.stateToCovidDeathData.get( stateName ) );
      returnObservable.complete();
    }
    else if( stateName == STATES[0].name ){
      this.dataService.getUSCovidData().subscribe( (covidResponse:CovidDataResponse) => {
        let stateCovidData:StateCovidData = new StateCovidData();
        stateCovidData.items = covidResponse.items;
        stateCovidData.stateName = stateName;
        this.stateToCovidDeathData.set( stateName, stateCovidData );
        returnObservable.next( stateCovidData );
        returnObservable.complete();
      } );
    }
    else {
      this.dataService.getStateCovidData( state.name ).subscribe( (covidResponse:CovidDataResponse) => {
        let stateCovidData:StateCovidData = new StateCovidData();
        stateCovidData.items = covidResponse.items;
        stateCovidData.stateName = stateName;
        this.stateToCovidDeathData.set( stateName, stateCovidData );
        returnObservable.next( stateCovidData );
        returnObservable.complete();
      } );

    }
    return returnObservable;
  }



}
