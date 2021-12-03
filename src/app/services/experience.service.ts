import { Injectable } from '@angular/core';
import * as FullStory from '@fullstory/browser';
import {Subject} from "rxjs";

declare var FS:any;

@Injectable({
  providedIn: 'root'
})
export class ExperienceService {

  rageHookSubject:Subject<any> = null;

  constructor() {
    FullStory.init({ orgId: '171GWQ' } );
  }

  getRageHook( source:any ) : Subject<any> {
    if( this.rageHookSubject === null ){
      console.log( "Subscribing to rage hooks ");
      this.rageHookSubject = new Subject<any>();
      source.addEventListener('fullstory/rageclick', (e:any) => {
        console.log( "Got rage hook event raw " + e );
        this.rageHookSubject.next( e );
      });
    }
    return this.rageHookSubject;
  }

  sendCustomEvent( eventType:string, eventProperties:any ) {
    try {
      FS.event(eventType, eventProperties);
    }catch( error:any ){
      console.error( "Couldn't send custom event " + error );
    }
  }

}
