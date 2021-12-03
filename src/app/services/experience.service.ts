import { Injectable } from '@angular/core';
import * as FullStory from '@fullstory/browser';
import {Subject} from 'rxjs';

export class RageEvent {
  eventEndTimeStamp: number;
  eventStartTimeStamp: number;
  eventReplayUrlAtCurrentTime: string;
  eventReplayUrlAtStart: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExperienceService {

  rageHookSubject: Subject<any> = null;

  constructor() {
    FullStory.init({
      orgId: '171GWQ',
      debug: true
    });
  }

  getRageHook( source: any ): Subject<RageEvent> {
    if ( this.rageHookSubject === null ){
      console.log( 'Subscribing to rage hooks ');
      this.rageHookSubject = new Subject<any>();
      source.addEventListener('fullstory/rageclick', (e: any) => {
        // console.log( 'Got rage hook event raw ' + e );
        this.rageHookSubject.next( e.detail );
      });
    }
    return this.rageHookSubject;
  }

  sendCustomEvent( eventType: string, eventProperties: any ): void {
    try {
      FullStory.event(eventType, eventProperties);
    }catch ( error: any ){
      console.error( 'Could not send custom event ' + error );
    }
  }

}
