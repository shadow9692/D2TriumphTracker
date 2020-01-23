import { Injectable } from '@angular/core';
import { flatMap, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';


import { D2ApiService } from './d2-api.service';
import { ManifestService } from './manifest.service';

import { UserInfo, User } from '../models/User';
import { PresentationNode, Children } from '../models/presentationNode';
import { UserTriumphObjective, UserTriumph } from '../models/userTriumph';
import { Objective, Triumph, stateMask } from '../models/triumph';

@Injectable({
  providedIn: 'root'
})
export class TriumphService {

  //#region VariableDeclarations
  public readonly rootTriumphPresentationHash: string = '1024788583';
  public presentationNodeList;
  public fullTriumphList;

  public userInformation: UserInfo;
  //#endregion

  constructor(private d2Api: D2ApiService,
              private manifestService: ManifestService) { }


  buildData(userSearchParameters: UserInfo): Observable<any> {
    this.userInformation = userSearchParameters;
    return this.manifestService.returnManifest().pipe(
      flatMap((success: boolean) => {
        if(success){
          return this.d2Api.searchUser(userSearchParameters);
        }
        else {
          throw("Get Manifest Failed!");
        }
      }),
      flatMap((userData: User) => {
        return this.d2Api.getTriumphsById(userData);
      }),
      map((userTriumphs: any) => {
        this.presentationNodeList = this.createPresentationNodeList(userTriumphs);
        return of(true);
      })
    );
  }

  updateData() {
    if(this.userInformation) {
      return this.buildData(this.userInformation);
    }
    else {
      console.log(`Error updating data. Either:\nNo User found or\nError with manifest.`);
      return of(false);
    }
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

    /*
   * Input: Manifest presentation Definition, user triumph list
   * Output: presentation node dictionary
   * this method modifies the triumph list and fills it with all triumphs
   * updated correctly with all user data, and builds the presentation node
   * dictionary stored as { hash: presentationNode }
   */
  createPresentationNodeList(userTriumphs: any) {
    let presetNodeList = {};
    this.fullTriumphList = {};
    let rootNode: PresentationNode = this.mapPresentationNode(this.manifestService.manifest.DestinyPresentationNodeDefinition[this.rootTriumphPresentationHash]);
    // Root Node
    // Grab root's children (7 main triumph categories)
    for(let category in this.manifestService.manifest.DestinyPresentationNodeDefinition[this.rootTriumphPresentationHash].children.presentationNodes) {
      let categoryHash = this.manifestService.manifest.DestinyPresentationNodeDefinition[this.rootTriumphPresentationHash].children.presentationNodes[category].presentationNodeHash;
      let categoryNode: PresentationNode = this.mapPresentationNode(this.manifestService.manifest.DestinyPresentationNodeDefinition[categoryHash]);
      //console.log(`ENTERING CATEGORY: ${this.manifestService.manifest.DestinyPresentationNodeDefinition[categoryHash].displayProperties.name}`);
      // Grab children of main categories (sub categories)
      for(let subCategory in this.manifestService.manifest.DestinyPresentationNodeDefinition[categoryHash].children.presentationNodes) {
        let subCategoryHash = this.manifestService.manifest.DestinyPresentationNodeDefinition[categoryHash].children.presentationNodes[subCategory].presentationNodeHash;
        let subCategoryNode: PresentationNode = this.mapPresentationNode(this.manifestService.manifest.DestinyPresentationNodeDefinition[subCategoryHash]);
        //console.log(`ENTERING SUB-CATEGORY: ${this.manifestService.manifest.DestinyPresentationNodeDefinition[subCategoryHash].displayProperties.name}`);
        // grab children of sub categories (sections)
        for(let section in this.manifestService.manifest.DestinyPresentationNodeDefinition[subCategoryHash].children.presentationNodes) {
          let sectionHash = this.manifestService.manifest.DestinyPresentationNodeDefinition[subCategoryHash].children.presentationNodes[section].presentationNodeHash;
          let sectionNode: PresentationNode = this.mapPresentationNode(this.manifestService.manifest.DestinyPresentationNodeDefinition[sectionHash]);
          //console.log(`ENTERING SECTION: ${this.manifestService.manifest.DestinyPresentationNodeDefinition[sectionHash].displayProperties.name}`)
          if(this.manifestService.manifest.DestinyPresentationNodeDefinition[sectionHash].displayProperties.name !== 'Classified') {
            // grab children of sub sections (triumphs)
            for(let triumph in this.manifestService.manifest.DestinyPresentationNodeDefinition[sectionHash].children.records) {
              let triumphHash = this.manifestService.manifest.DestinyPresentationNodeDefinition[sectionHash].children.records[triumph].recordHash;
              let triumphGrabbed = this.makeTriumphObject(triumphHash, userTriumphs)
              this.fullTriumphList[triumphHash] = triumphGrabbed;
              sectionNode.children.records.push(triumphHash);
              //console.log(`triumph ${subSubSubIndex}: `, this.this.manifestService.manifest.DestinyRecordDefinition[subSubSubHash]);
            }
          }
          subCategoryNode.children.presentationNodes.push(sectionHash);
          presetNodeList[sectionHash] = sectionNode;
        }
        categoryNode.children.presentationNodes.push(subCategoryHash);
        presetNodeList[subCategoryHash] = subCategoryNode;
      }
      rootNode.children.presentationNodes.push(categoryHash);
      presetNodeList[categoryHash] = categoryNode;
    }
    presetNodeList[this.rootTriumphPresentationHash] = rootNode;
    return presetNodeList;
  }

  /*
   * input: presentation node from D2 manifest
   * output: presentation node object with empty child section.
   * this function maps the data in the manifest to the object
   * definition setup in this application to be used elsewhere.
   */
  mapPresentationNode(presentationNode: any): PresentationNode {
    try{
      let presentNode = new PresentationNode();

      // First we setup the display properties and assign them to our new node
      presentNode.hasIcon = presentationNode.displayProperties.hasIcon;
      presentNode.icon = presentNode.hasIcon ? presentationNode.displayProperties.icon : undefined;
      presentNode.description = presentationNode.displayProperties.description;
      presentNode.name = presentationNode.displayProperties.name;

      // then we grab all the root level properties
      presentNode.rootViewIcon = presentNode.hasIcon ? presentationNode.rootViewIcon : undefined;
      presentNode.scope = presentationNode.scope;
      presentNode.parentNodeHashes = presentationNode.parentNodeHashes;
      presentNode.hash = presentationNode.hash;
      presentNode.objectiveHash = presentationNode.objectiveHash;

      // finally we set up the children arrays to be empty.
      // these will be filled in the other section.
      presentNode.children = new Children();
      presentNode.children.presentationNodes = new Array<string>();
      presentNode.children.records = new Array<string>();

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

  /*
   * Input: hash value for triumph, list of user triumphs
   * Output: full triumph object as defined by this applicaiton
   * this function grabs data from the manifest and the searched user
   * in order to build a triumph object.
   */
  makeTriumphObject(recordNodeHash: string, userTriumphs: any): Triumph {
    let newTriumph: Triumph = new Triumph();
    try {
      newTriumph.name = this.manifestService.manifest.DestinyRecordDefinition[recordNodeHash].displayProperties.name;
      newTriumph.description = this.manifestService.manifest.DestinyRecordDefinition[recordNodeHash].displayProperties.description;
      newTriumph.iconPath = `https://www.bungie.net${this.manifestService.manifest.DestinyRecordDefinition[recordNodeHash].displayProperties.icon}`;
      newTriumph.scoreValue = this.manifestService.manifest.DestinyRecordDefinition[recordNodeHash].completionInfo.ScoreValue;
      newTriumph.hash = recordNodeHash;

      if(this.manifestService.manifest.DestinyRecordDefinition[recordNodeHash].scope) {
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
      console.log(`ERROR on triumph hash: ${recordNodeHash}\nLogging object below: \n`, this.manifestService.manifest.DestinyRecordDefinition[recordNodeHash]);
      console.log(err);
      return newTriumph;
    }
  }

  /*
   * Input: triumph to add data to, hash value for triumph, user profile section
   * Output: updates triumph data based upon user data.
   * this function takes a triumph in and modifies data in it based upon the user profile.
   * this function is only called if the triumph has scope of 0, and is therefore a
   * profile triumph.
   */
  fillProfileTriumphData(triumph: Triumph, recordHash: string, profileTriumphs: any) {
    let userTriumph: UserTriumph = profileTriumphs[recordHash];
    triumph.state = new stateMask(userTriumph.state);

    // The shadowkeep system has introduced a change in the API.
    // Triumphs that can be partially completed multiple times now exist.
    // Due to this, objectives may be empty, and the goals are now located in IntervalInfo
    if(this.manifestService.manifest.DestinyRecordDefinition[recordHash].objectiveHashes.length > 0) {
      console.log(`no error:`, userTriumph);
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
    else {
      console.log(`error on ${recordHash}: user triumph data ->`, userTriumph);
    }
  }

  /*
   * Input: triumph to add data to, hash value for triumph, character profile section
   * Output: updates triumph data based upon user data.
   * this function takes a triumph in and modifies data in it based upon the user characters.
   * this function is only called if the triumph has scope of 1, and is therefore a
   * character triumph.
   */
  fillCharacterTriumphData(triumph: Triumph, recordHash: string, characterTriumphs: any) {
    let charArray = new Array<UserTriumph>();
    //let userTriumph: UserTriumph;
    //console.log(characterTriumphs);
    for(let character in characterTriumphs){
      charArray.push(characterTriumphs[character].records[recordHash]);
    }

    //console.log(charArray);
    // This temporarily grabs data only from the 1st character slot.
    let userTriumph = charArray[0];

    // The shadowkeep system has introduced a change in the API.
    // Triumphs that can be partially completed multiple times now exist.
    // Due to this, objectives may be empty, and the goals are now located in IntervalInfo
    if(this.manifestService.manifest.DestinyRecordDefinition[recordHash].objectiveHashes.length > 0) {
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
    else {
      console.log(`error on ${recordHash}: user triumph data ->`, userTriumph);
    }
  }

  /*
   * Input: a UserTriumphObjective object to be mapped
   * Output: a promise that returns a completed Objective object
   * This function maps a UserTriumphObjective to an Objective
   * the intention is to get all required data both from user data
   * and the Manifest data
   */
  mapObjective(userObjective: UserTriumphObjective): Promise<Objective> {
    return new Promise(
      (resolve, reject) => {
        let newObjective = new Objective();

        try {
          newObjective.allowOvercompletion = this.manifestService.manifest.DestinyObjectiveDefinition[userObjective.objectiveHash].allowOvercompletion;
          newObjective.completionValue = userObjective.completionValue;
          if(!newObjective.allowOvercompletion && (userObjective.progress > userObjective.completionValue)) {
            newObjective.progress = userObjective.completionValue;
          }
          else{
            newObjective.progress = userObjective.progress;
          }
          newObjective.visible = userObjective.visible;
          newObjective.description = this.manifestService.manifest.DestinyObjectiveDefinition[userObjective.objectiveHash].progressDescription;
          resolve(newObjective);
        }
        catch (err) {
          reject(err);
        }
      }
    );
  }

}
