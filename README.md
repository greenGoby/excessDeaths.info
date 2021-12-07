# Excess Deaths due to Covid-19

## Background

The CDC publishes data about [deaths from all causes](https://www.cdc.gov/nchs/nvss/vsrr/covid19/excess_deaths.htm), including past averages for any given week.  Any deaths for a given week that are far enough above average are considered "excess deaths".  This project takes the excess death data and plots it against the [CDCs Covid data](https://covid.cdc.gov/covid-data-tracker/#datatracker-home) showing deaths per week.  If Covid is causing the excess deaths above normal, then the deaths should line up. You can view the data by the entire United States, or any individual state.  You can also zoom in on any date range using the UI.  You can see the app running live at [excessDeaths.info](http://excessDeaths.info) 

## One time preparation

You need to have [npm](https://www.npmjs.com/) installed, and [Angular CLI](https://github.com/angular/angular-cli) installed.  You can install Angular CLI by using `npm install -g @angular/cli`  

Before building or running for the first time, you need to do an `npm install`

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

