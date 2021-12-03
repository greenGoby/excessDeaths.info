
export class StateExcessDeathData {
  stateName:string;
  covidDataMerged:boolean = false;
  items:ExcessDeathsDataItem[] = new Array<ExcessDeathsDataItem>();
  mergeCovidData( covidData:StateCovidData ){
    let excessDeathsIndex:number = 0;
    let currentExcessDeathsItem:ExcessDeathsDataItem = this.items[excessDeathsIndex];
    let nextExcessDeathsItem:ExcessDeathsDataItem = null;
    let firstCovidItem:CovidDeathItem = covidData.items[0];
    // find starting excess death item
    if( firstCovidItem.weekEnding.getTime() < currentExcessDeathsItem.weekEnding.getTime() ){
      console.log( "First covid item before first week ending...")
    }
    else {
      console.log("Searching for week ending that matches...")
      let foundFirstItem: boolean = false;
      for (let x = excessDeathsIndex; !foundFirstItem && (x < this.items.length); x++) {
        // console.log("Checking " + firstCovidItem.day + " versus " + this.items[x].weekEnding);
        if (firstCovidItem.weekEnding.getTime() < this.items[x].weekEnding.getTime()) {
          foundFirstItem = true;
          excessDeathsIndex = x - 1;
          currentExcessDeathsItem = this.items[excessDeathsIndex];
          nextExcessDeathsItem = this.items[excessDeathsIndex + 1];
        }
      }
    }
    console.log( "First covid item " + firstCovidItem.weekEnding + " current item " + currentExcessDeathsItem.weekEnding + " next item " + nextExcessDeathsItem.weekEnding );
    // now loop through and put the days on the proper week ending
    for( let covidDataItem of covidData.items ){
      if( currentExcessDeathsItem === null ){
        // skip number as we don't have data
      }
      else if( covidDataItem.weekEnding.getTime() <= nextExcessDeathsItem.weekEnding.getTime() ){
        currentExcessDeathsItem.covidDeaths = currentExcessDeathsItem.covidDeaths + covidDataItem.deaths;
      }
      else {
        excessDeathsIndex = excessDeathsIndex + 1;
        if( excessDeathsIndex === this.items.length ){
          console.log( "Out of data" );
          currentExcessDeathsItem = null;
        }
        else {
          currentExcessDeathsItem = this.items[excessDeathsIndex];
          if (excessDeathsIndex === (this.items.length - 1)) {
            let sevenDaysTime: number = 7 * 24 * 60 * 60 * 1000;
            nextExcessDeathsItem = new ExcessDeathsDataItem();
            nextExcessDeathsItem.weekEnding =
              new Date(currentExcessDeathsItem.weekEnding.getTime() + sevenDaysTime);
            console.log("At last week in excess data " + currentExcessDeathsItem.weekEnding + " next week is " + nextExcessDeathsItem.weekEnding);
          } else {
            nextExcessDeathsItem = this.items[excessDeathsIndex + 1];
          }
          currentExcessDeathsItem.covidDeaths = covidDataItem.deaths;
        }
      }
    }
    this.covidDataMerged = true;
  }
}

export class ExcessDeathsDataItem {
  state:string;
  weekEnding:Date;
  expected:number;
  upperThreshold:number;
  actual:number;
  covidDeaths:number = 0;
  parseFromJson( jsonObject ) {
    this.state = jsonObject.state;
    let dateString:string = jsonObject.week_ending_date;
    dateString = dateString.substring( 0, 10 );
    let parts =dateString.split('-');
    this.weekEnding = new Date(Number( parts[0] ), Number(parts[1] ) - 1, Number( parts[2] ));
    // console.log( "Date after parse " + this.day + " " + this.day.toUTCString() );
    this.expected = Number( jsonObject.average_expected_count );
    this.upperThreshold = Number( jsonObject.upper_bound_threshold );
    this.actual = Number( jsonObject.observed_number );
  }
}

export class ExcessDeathsResponse {
  items:ExcessDeathsDataItem[] = new Array<ExcessDeathsDataItem>();
  parseFromJson( jsonObject ) {
    this.items = new Array<ExcessDeathsDataItem>();
    for( let jsonDeathsItem of jsonObject ){
        let deathsItem:ExcessDeathsDataItem = new ExcessDeathsDataItem();
        deathsItem.parseFromJson( jsonDeathsItem );
        this.items.push(deathsItem);
    }
    this.items.sort( (a:ExcessDeathsDataItem, b:ExcessDeathsDataItem) => {
      return a.weekEnding.getTime() - b.weekEnding.getTime();
    });
  }
}

export class CovidDeathItem {
  weekStarting:Date;
  weekEnding:Date;
  deaths:number;
  parseFromJson( jsonObject ){
    let startDateString:string = jsonObject.start_date.toString();
    let startDateParts:string[] = [
      startDateString.substring( 0, 4 ),
      startDateString.substring( 5, 7 ),
      startDateString.substring( 8, 10 )
    ];
    this.weekStarting = new Date(Number( startDateParts[0] ), Number(startDateParts[1] ) - 1, Number( startDateParts[2] ));

    let endDateString:string = jsonObject.end_date.toString();
    let endDateParts:string[] = [
      endDateString.substring( 0, 4 ),
      endDateString.substring( 5, 7 ),
      endDateString.substring( 8, 10 )
    ];
    this.weekEnding = new Date(Number( endDateParts[0] ), Number(endDateParts[1] ) - 1, Number( endDateParts[2] ));
    this.deaths = Number( jsonObject.covid_19_deaths );
  }
}

export class StateCovidData {
  stateName: string;
  items:CovidDeathItem[] = new Array<CovidDeathItem>();
}

export class CovidDataResponse {
  items:CovidDeathItem[] = new Array<CovidDeathItem>();
  parseFromJson( jsonObject ) {
    this.items = new Array<CovidDeathItem>();
    for( let x=jsonObject.length; x>0; x-- ){
      let jsonDeathsItem = jsonObject[x-1];
      if( jsonDeathsItem.group === "By Week" ){
        let deathsItem:CovidDeathItem = new CovidDeathItem();
        deathsItem.parseFromJson( jsonDeathsItem );
        this.items.push(deathsItem);
      }
    }
    this.items.sort( (a:CovidDeathItem, b:CovidDeathItem) => {
      return a.weekEnding.getTime() - b.weekEnding.getTime();
    });
  }
}




