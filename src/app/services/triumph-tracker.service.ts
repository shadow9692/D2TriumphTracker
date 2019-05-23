import { Injectable } from '@angular/core';
import { Triumph } from '../models/triumph';

@Injectable({
  providedIn: 'root'
})
export class TriumphTrackerService {
  public trackedTriumphList: Array<Triumph>;

  constructor() {
    if(!this.trackedTriumphList) {
      this.trackedTriumphList = new Array<Triumph>();
      console.log("initializing triumph tracker list.")
    }
  }

  addTriumph(triumph: Triumph) {
    let tracked: boolean = this.alreadyTracked(triumph);
    if(!tracked) {
      this.trackedTriumphList.push(triumph);
      return true;
    }
    else {
      console.log("Triumph Already Tracked");
      return false;
    }
  }

  alreadyTracked(triumph: Triumph): boolean {
    let retVal: boolean = false;
    this.trackedTriumphList.forEach(trackedTriumph => {
      if(trackedTriumph.hash === triumph.hash){
        retVal = true;
      }
    })
    return retVal;
  }

  removeTriumph(hashOrIndex) {
    // need to figure out how i'm going to do this AFTER I make the new page.
  }

  updateAllTriumphs() {
    // grab user info
    // update triumph in tracked list based upon scope.
  }

  updateTriumph(hashOrIndex) {
    // need to figure out how i'm going to update 1 triumph
  }
}
