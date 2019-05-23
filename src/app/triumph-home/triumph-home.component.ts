import { Component, OnInit } from '@angular/core';
import { flatMap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';

import { D2ApiService } from '../services/d2-api.service';
import { User, UserInfo } from '../models/user';
import { Triumph, Objective, stateMask } from '../models/triumph';
import { UserTriumph, UserTriumphObjective } from '../models/userTriumph';
import { PresentationNode, Children } from '../models/presentationNode';
import { TriumphTrackerService } from '../services/triumph-tracker.service';
import { ManifestService } from '../services/manifest.service';
import { TriumphService } from '../services/triumph.service';


@Component({
  selector: 'app-component-home',
  templateUrl: './triumph-home.component.html',
  styles: []
})
export class TriumphHomeComponent implements OnInit {

  //#region Variable_Declarations
  private manifest: any;
  public userSearchForm: FormGroup;

  public loading: boolean = false;
  public categorySelection: string;
  public subCategorySelection: string;
  public sectionSelection: string;

  platformOptions = [
    {name: 'XBL', value: 1},
    {name: 'PSN', value: 2},
    {name: 'BNet', value: 4}
  ]
  //#endregion

  constructor(private route: ActivatedRoute,
              private formBuilder: FormBuilder,
              public triumphService: TriumphService,
              private d2Api: D2ApiService,
              private manifestService: ManifestService,
              private tracker: TriumphTrackerService) { }

  ngOnInit() {
    let resolvedData: any = this.route.snapshot.data['resolvedManifest'];
    this.manifest = resolvedData;

    this.userSearchForm = this.formBuilder.group({
      platform: [2],
      username: ['shadow9692']
    });
    //this.onSearchUser();
  }

  /*
   * Input: empty
   * Output: empty
   * this function is called upon pressing the user search button on the web-page
   * this will attempt to locate a user in the bungie api and grab all of their triumphs.
   */
  onSearchUser() {
    let userSearchParameters: UserInfo = {
      platform: this.userSearchForm.controls.platform.value,
      username: this.userSearchForm.controls.username.value
    };
    this.loading = true;
    this.categorySelection = undefined;
    this.subCategorySelection = undefined;
    this.sectionSelection = undefined;
    this.triumphService.buildData(userSearchParameters).subscribe(
      (data: any) => {
        if(data) {
          this.loading = false;
        }
      },
      (err: any) => {
        console.log(err);
      }
    );
  }

  testingState(userData: any) {
    let stateArray = new Array<number>();
    for(let profTriumphHash in userData.profileRecords.data.records) {
      let state = userData.profileRecords.data.records[profTriumphHash].state;
      if(!(stateArray.includes(state))) {
        console.log(`new state encountered: ${state}`);
        stateArray.push(state);
      }
    }
    for(let characterHash in userData.characterRecords.data) {
      for(let charTriumphHash in userData.characterRecords.data[characterHash].records) {
        let state = userData.characterRecords.data[characterHash].records[charTriumphHash].state;
        if(!(stateArray.includes(state))) {
          console.log(`new state encountered: ${state}`);
          stateArray.push(state);
        }
      }
    }
    let stateMaskDict = {};
    for(let state of stateArray){
      stateMaskDict[state] = new stateMask(state);
    }
    console.log(stateArray);
    console.log(stateMaskDict);
  }

  setCategory(hash: string) {
    this.categorySelection = hash;
    this.subCategorySelection = this.triumphService.presentationNodeList[hash].children.presentationNodes[0];
    this.sectionSelection = this.triumphService.presentationNodeList[this.subCategorySelection].children.presentationNodes[0];
    console.log(`category has been selected: ${this.categorySelection}`);
    console.log(`sub category has been selected: ${this.subCategorySelection}`);
    console.log(`section has been selected: ${this.sectionSelection}`);
  }

  setSubCategory(hash: string) {
    this.subCategorySelection = hash;
    this.sectionSelection = this.triumphService.presentationNodeList[hash].children.presentationNodes[0];;
    console.log(`sub category has been selected: ${this.subCategorySelection}`);
    console.log(`section has been selected: ${this.sectionSelection}`);
  }

  setSection(hash: string) {
    this.sectionSelection = hash;
    console.log(`section has been selected: ${this.sectionSelection}`);
  }

  trackTriumph(hash: string) {
    this.tracker.addTriumph(this.triumphService.fullTriumphList[hash]) ?
    console.log(`Added triumph ${hash} to tracked list.`) :
    null;
  }


  /*
   * Input: number
   * Output: converted string
   * Only a visual helper function
   * this function takes in a number and will return a formatted string with commas.
   * e.g.: 500132154809 -> 500,132,154,809
   */
  formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  }

}
