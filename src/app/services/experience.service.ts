import { Injectable } from '@angular/core';
import * as FullStory from '@fullstory/browser';

@Injectable({
  providedIn: 'root'
})
export class ExperienceService {

  constructor() {
    FullStory.init({ orgId: '171GWQ' } );
  }

}
