import { Injectable } from '@angular/core';
import {AsyncSubject, Observable} from "rxjs";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {map, share} from "rxjs/operators";
import {CovidDataResponse, ExcessDeathsResponse} from "../dto/stats";


@Injectable({
  providedIn: 'root'
})
export class DataService {

  static readonly EXCESS_DEATHS_URL:string = "https://data.cdc.gov/resource/xkkf-xrst.json?$limit=50000&$where=week_ending_date > '2020-01-01'&outcome='All causes'&type='Predicted (weighted)'";
  // https://raw.githubusercontent.com/nytimes/covid-19-data/master/us.csv
  // static readonly US_COVID_DATA_URL:string = "https://api.covidtracking.com/v1/us/daily.json";
  static readonly US_COVID_DATA_URL:string = "https://data.cdc.gov/resource/r8kw-7aab.json?$limit=50000&state='United States'";
  static readonly STATE_COVID_DATA_URL:string = "https://data.cdc.gov/resource/r8kw-7aab.json?$limit=50000&state={state}";
  // static readonly STATE_COVID_DATA_URL:string = "https://api.covidtracking.com/v1/states/{state}/daily.json";
  // https://data.cdc.gov/resource/9mfq-cb36.json?$limit=50000&state=NY

  constructor( private httpService:HttpClient) { }

  getExcessDeaths() : Observable<ExcessDeathsResponse> {

    let returnResponse:AsyncSubject<ExcessDeathsResponse> = new AsyncSubject();
    let headers:HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-App-Token': 'Os14pNvQAcLejD8lkd9m8mi8i'
    });
    this.httpService.get(DataService.EXCESS_DEATHS_URL, {headers: headers }).pipe(
      map( (httpResponse : any) => {
        let responseObject:ExcessDeathsResponse = new ExcessDeathsResponse();
        responseObject.parseFromJson(httpResponse);
        return responseObject;
      }
    ), share()).subscribe( (excessDeathsResponse:ExcessDeathsResponse) => {
      returnResponse.next(excessDeathsResponse);
      returnResponse.complete();
    } );
    return returnResponse;
  }

  getUSCovidData() : Observable<CovidDataResponse> {
    let returnResponse:AsyncSubject<CovidDataResponse> = new AsyncSubject();
    let headers:HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-App-Token': 'Os14pNvQAcLejD8lkd9m8mi8i'
    });
    this.httpService.get(DataService.US_COVID_DATA_URL, {headers: headers }).pipe(
      map( (httpResponse : any) => {
          let responseObject:CovidDataResponse = new CovidDataResponse();
          responseObject.parseFromJson(httpResponse);
          return responseObject;
        }
      ), share()).subscribe( (covidDataResponse:CovidDataResponse) => {
      returnResponse.next(covidDataResponse);
      returnResponse.complete();
    } );
    return returnResponse;

  }

  getStateCovidData( stateName:string ) : Observable<CovidDataResponse> {
    let url:string = DataService.STATE_COVID_DATA_URL.replace( '{state}', stateName );
    console.log( "Calling state url " + url );
    let returnResponse:AsyncSubject<CovidDataResponse> = new AsyncSubject();
    let headers:HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-App-Token': 'Os14pNvQAcLejD8lkd9m8mi8i'
    });
    this.httpService.get(url, {headers: headers }).pipe(
      map( (httpResponse : any) => {
          let responseObject:CovidDataResponse = new CovidDataResponse();
          responseObject.parseFromJson(httpResponse);
          return responseObject;
        }
      ), share()).subscribe( (covidDataResponse:CovidDataResponse) => {
      returnResponse.next(covidDataResponse);
      returnResponse.complete();
    } );
    return returnResponse;

  }
}
