import { Component, OnInit } from '@angular/core';
import { flatMap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';

import { D2ApiService } from '../services/d2-api.service';
import { User, UserInfo } from '../Models/User';
import { Triumph, Objective, stateMask } from '../Models/Triumph';
import { UserTriumph, UserTriumphObjective } from '../Models/UserTriumph';
import { PresentationNode, DisplayProperties, Children } from '../Models/presentationNode';
import { resolve, reject } from 'q';


@Component({
  selector: 'app-character-home',
  templateUrl: './character-home.component.html',
  styles: []
})
export class CharacterHomeComponent implements OnInit {

  //#region Variable_Declarations
  private manifest: any;
  private readonly rootTriumphPresentation: string = '1024788583';
  private userSearchForm: FormGroup;

  private triumph: Triumph;
  private triumphList: Array<Triumph> = new Array<Triumph>();
  private presentationOrganization: PresentationNode;

  private categorySelection = 0;
  private subCategorySelection = 0;
  private sectionSelection = 0;

  platformOptions = [
    {name: 'XBL', value: 1},
    {name: 'PSN', value: 2},
    {name: 'BNet', value: 4}
  ]
  //#endregion

  constructor(private d2Api: D2ApiService,
              private route: ActivatedRoute,
              private formBuilder: FormBuilder) { }

  ngOnInit() {
    let resolvedData: any = this.route.snapshot.data['resolvedManifest'];
    this.manifest = resolvedData;

    this.userSearchForm = this.formBuilder.group({
      platform: [2],
      username: ['shadow9692']
    })
  }

  buildSearchInfo(inputControls): UserInfo {
    return {platform: inputControls.platform.value, username: inputControls.username.value};
  }

  onSearchUser() {
    let userSearchParameters: UserInfo = this.buildSearchInfo(this.userSearchForm.controls);
    this.triumphList.length = 0;
    this.d2Api.searchUser(userSearchParameters)
      .pipe(
        flatMap((userData: User) => {
          return this.d2Api.getTriumphsById(userData);
        })
      ).subscribe(
        (userTriumphs: any) => {
          //console.log(this.manifest.DestinyObjectiveDefinition['3488693772']);
          console.log(userTriumphs);
          //this.testingState(userTriumphs);
          //this.logExampleData(userTriumphs, profileRecordHash, characterRecordhash);
          this.triumphList = this.createPresentationOrganization(this.manifest.DestinyPresentationNodeDefinition, userTriumphs);
        },
        (err: any) => {
          console.error(err);
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

  iDontKnow(data) {
    let hideList = new Array<string>();
    for(let charHash in data.characterRecords.data) {
      let hash = '2032752906';
      console.log(data.characterRecords.data[charHash].records[hash]);
      for(let recordHash in data.characterRecords.data[charHash].records) {
        break;
        let state = data.characterRecords.data[charHash].records[recordHash].state;
        if(!!(state & 16)) hideList.push(recordHash);
      }
    }
  }

  // takes in profile ?components=900 response as input.
  createPresentationOrganization(presentNodes, userTriumphs): Array<Triumph> {
    let tList = new Array<Triumph>();
    let rootNode: PresentationNode = this.mapPresentationNode(presentNodes[this.rootTriumphPresentation]);
    // Root Node
    // Grab root's children (7 main triumph categories)
    for(let category in presentNodes[this.rootTriumphPresentation].children.presentationNodes) {
      let categoryHash = presentNodes[this.rootTriumphPresentation].children.presentationNodes[category].presentationNodeHash;
      let categoryNode: PresentationNode = this.mapPresentationNode(presentNodes[categoryHash]);
      //console.log(`ENTERING CATEGORY: ${presentNodes[categoryHash].displayProperties.name}`);
      // Grab children of main categories (sub categories)
      for(let subCategory in presentNodes[categoryHash].children.presentationNodes) {
        let subCategoryHash = presentNodes[categoryHash].children.presentationNodes[subCategory].presentationNodeHash;
        let subCategoryNode: PresentationNode = this.mapPresentationNode(presentNodes[subCategoryHash]);
        //console.log(`ENTERING SUB-CATEGORY: ${presentNodes[subCategoryHash].displayProperties.name}`);
        // grab children of sub categories (sections)
        for(let section in presentNodes[subCategoryHash].children.presentationNodes) {
          let sectionHash = presentNodes[subCategoryHash].children.presentationNodes[section].presentationNodeHash;
          let sectionNode: PresentationNode = this.mapPresentationNode(presentNodes[sectionHash]);
          //console.log(`ENTERING SECTION: ${presentNodes[subSectionHash].displayProperties.name}`)
          // grab children of sub sections (triumphs)
          for(let triumph in presentNodes[sectionHash].children.records) {
            let triumphHash = presentNodes[sectionHash].children.records[triumph].recordHash;
            let triumphGrabbed = this.makeTriumphObject(triumphHash, userTriumphs)
            tList.push(triumphGrabbed);
            sectionNode.children.records.push(triumphGrabbed);
            //console.log(`triumph ${subSubSubIndex}: `, this.manifest.DestinyRecordDefinition[subSubSubHash]);
          }
          subCategoryNode.children.presentationNodes.push(sectionNode);
        }
        categoryNode.children.presentationNodes.push(subCategoryNode);
      }
      rootNode.children.presentationNodes.push(categoryNode);
    }
    this.presentationOrganization = rootNode;
    //console.log(rootNode);
    return tList;
  }

  mapPresentationNode(presentationNode: any): PresentationNode {
    try{
      let presentNode = new PresentationNode();

      // First we setup the display properties and assign them to our new node
      let display = new DisplayProperties();
      display.hasIcon = presentationNode.displayProperties.hasIcon;
      display.icon = display.hasIcon ? presentationNode.displayProperties.icon : undefined;
      display.description = presentationNode.displayProperties.description;
      display.name = presentationNode.displayProperties.name;
      presentNode.displayProperties = display;

      // then we grab all the root level properties
      presentNode.rootViewIcon = display.hasIcon ? presentationNode.rootViewIcon : undefined;
      presentNode.scope = presentationNode.scope;
      presentNode.parentNodeHashes = presentationNode.parentNodeHashes;
      presentNode.hash = presentationNode.hash;
      presentNode.objectiveHash = presentationNode.objectiveHash;

      // finally we set up the children arrays to be empty.
      // these will be filled in the other section.
      presentNode.children = new Children();
      presentNode.children.presentationNodes = new Array<PresentationNode>();
      presentNode.children.records = new Array<Triumph>();

      /*
       * note, the above COULD be built with a recursive definition.
       * the function signature would have to be a bit different
       * mapPresentationNodes(presentHash: string, listOfNodes: any)
       * this would recursively loop over all the nodes and build the full list of nodes
       * and would call this.makeTriumphObject to create the triumphs
       */

      return presentNode;
    }
    catch(err) {
      console.log(`ERROR: \n`, err);
    }
  }

  buildThing(data: any, hash1: string) {
    // removed from onInit for now
    let i = 0;
    let c = 0;
    for(let hash in data.characterRecords.data[hash1].records){
      let aTriumph: Triumph = this.makeTriumphObject(hash, data.characterRecords.data[hash1]);
      if(aTriumph) this.triumphList.push(aTriumph);
      else ++c;
      ++i;
    }
    console.log(`Triumphs analyzed: ${i}\nErrors found: ${c}\nTotal triumphs displayed: ${this.triumphList.length}`);
  }

  testMethod(data: any) {
    // get all the records lists
    let profileRecords = data.profileRecords.data.records;
    let characterRecords = new Array<any>();
    characterRecords.push(data.characterRecords.data['2305843009263935152'].records);
    characterRecords.push(data.characterRecords.data['2305843009263935153'].records);
    characterRecords.push(data.characterRecords.data['2305843009378434254'].records);
    let uniqueCount = 0;
    let uniqueHashes = new Array<string>();

    console.log(characterRecords[0]['20493479']);

    for(let hash in characterRecords[0]){
      let obj1 = characterRecords[0][hash];
      let obj2 = characterRecords[1][hash];
      if(obj1.state !== obj2.state){
        console.log(`hash mismatch on State: ${hash}`);
        console.log(obj1, obj2);
      }
      if(obj1.objectives.length !== obj2.objectives.length) {
        console.log(`hash mismatch on Objectives Length: ${hash}`);
      }
    }

    for(let i = 0; i < 3; ++i) {
      for(let hash in characterRecords[i]) {
        if(!profileRecords[hash] && !characterRecords[(i+1)%3][hash] && !characterRecords[(i+2)%3][hash]) {
          ++uniqueCount;
          uniqueHashes.push(hash);
        }
      }
    }

    console.log(uniqueCount);

    //do some stuff
  }

  makeTriumphObject(recordNodeHash: string, userTriumphs: any): Triumph {
    let newTriumph: Triumph = new Triumph();
    try {
      newTriumph.name = this.manifest.DestinyRecordDefinition[recordNodeHash].displayProperties.name;
      newTriumph.description = this.manifest.DestinyRecordDefinition[recordNodeHash].displayProperties.description;
      newTriumph.iconPath = `https://www.bungie.net${this.manifest.DestinyRecordDefinition[recordNodeHash].displayProperties.icon}`;
      newTriumph.scoreValue = this.manifest.DestinyRecordDefinition[recordNodeHash].completionInfo.ScoreValue;

      if(this.manifest.DestinyRecordDefinition[recordNodeHash].scope) {
        // this is a character based triumph
        this.fillCharacterTriumphData(newTriumph, recordNodeHash, userTriumphs.characterRecords.data);
      }
      else {
        // this is a profile based triumph
        this.fillProfileTriumphData(newTriumph, recordNodeHash, userTriumphs.profileRecords.data.records);
      }

      //console.log(newTriumph);
      return newTriumph;
    }
    catch(err) {
      console.log(`ERROR on triumph hash: ${recordNodeHash}\nLogging object below: \n`, this.manifest.DestinyRecordDefinition[recordNodeHash]);
      console.log(err);
      return newTriumph;
    }
  }

  fillProfileTriumphData(triumph: Triumph, recordHash: string, profileTriumphs: any) {
    let userTriumph: UserTriumph = profileTriumphs[recordHash];
    triumph.state = new stateMask(userTriumph.state);

    userTriumph.objectives.forEach(userObjective => {
      //#region create Promise
      let objectivePromise = this.mapObjective(userObjective);

      objectivePromise.then(
        (obj: Objective) => {
          triumph.objectives.push(obj);
        },
        (err: Error) => {
          console.log('we\'ve hit an error executing the promise!');
          throw(err);
        }
      );

    });
  }

  fillCharacterTriumphData(triumph: Triumph, recordHash: string, characterTriumphs: any) {
    let charArray = new Array<UserTriumph>();
    //let userTriumph: UserTriumph;
    //console.log(characterTriumphs);
    for(let character in characterTriumphs){
      charArray.push(characterTriumphs[character].records[recordHash]);
    }
    //console.log(charArray);
    let userTriumph = charArray[0];

    userTriumph.objectives.forEach(userObjective => {
      //#region create Promise
      let objectivePromise = this.mapObjective(userObjective);

      objectivePromise.then(
        (obj: Objective) => {
          triumph.objectives.push(obj);
        },
        (err: Error) => {
          console.log('we\'ve hit an error executing the promise!');
          throw(err);
        }
      );
    });
  }

  /*
   * This function maps a UserTriumphObjective to an Objective
   * the intention is to get all required data both from user data
   * and the Manifest data
   * Input: a UserTriumphObjective object to be mapped
   * Output: a promise that returns a completed Objective object
   */
  mapObjective(userObjective: UserTriumphObjective): Promise<Objective> {
    return new Promise(
      (resolve, reject) => {
        let newObjective = new Objective();

        try {
          newObjective.allowOvercompletion = this.manifest.DestinyObjectiveDefinition[userObjective.objectiveHash].allowOvercompletion;
          newObjective.completionValue = userObjective.completionValue;
          if(!newObjective.allowOvercompletion && (userObjective.progress > userObjective.completionValue)) {
            newObjective.progress = userObjective.completionValue;
          }
          else{
            newObjective.progress = userObjective.progress;
          }
          newObjective.visible = userObjective.visible;
          newObjective.description = this.manifest.DestinyObjectiveDefinition[userObjective.objectiveHash].progressDescription;
          resolve(newObjective);
        }
        catch (err) {
          reject(err);
        }
      }
    );
  }

  logExampleData(playerTriumphs, profileTriumphHash, characterTriumphHash) {
    console.log('Example data: ');
    console.log(`manifest data for profile triumph: \n`, this.manifest.DestinyRecordDefinition[profileTriumphHash]);
    console.log(`objectives: `);
    this.manifest.DestinyRecordDefinition[profileTriumphHash].objectiveHashes.forEach(objectiveHash => {
      console.log(this.manifest.DestinyObjectiveDefinition[objectiveHash]);
    });
    let ut: UserTriumph = playerTriumphs.profileRecords.data.records[profileTriumphHash]
    console.log(`user data for profile triumph: \n`, ut);
    console.log(`manifest data for character triumph: \n`, this.manifest.DestinyRecordDefinition[characterTriumphHash]);
    for(let character in playerTriumphs.characterRecords.data) {
      console.log(`user data for character triumph: \n`, playerTriumphs.characterRecords.data[character].records[characterTriumphHash]);
    }
  }

  // Only a visual helper function
  formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
  }

}
