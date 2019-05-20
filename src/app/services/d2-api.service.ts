import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';

import { User, UserInfo } from '../Models/User';


@Injectable({
  providedIn: 'root'
})



export class D2ApiService {

  public manifest: any;
  private readonly bungieUrl = 'https://www.bungie.net/Platform';
  private readonly httpOptions = {
    headers: new HttpHeaders({
      'X-API-KEY': 'df0d5a0d48254ad9a9b8d17837efc8d1'
    })
  };

  constructor(private http: HttpClient) { }

  searchUser(userInfo: UserInfo): Observable<User> {
    let apiUrl: string = `${this.bungieUrl}/Destiny2/SearchDestinyPlayer/${userInfo.platform}/${userInfo.username}/`;
    return this.http.get(apiUrl, this.httpOptions)
      .pipe(
        // Do some piping
        map(
          (data: any) => {
            // Edit this later
            // Need to make sure the response is valid
            // Check the error codes and the like.
            let response = data.Response;
            /*
             * parse the "response" data from the api call
             * Grab only the user we searched for, no more than that.
             */
            if (response.length === 0){
              return null;
            }
            else if (response.length > 1) {
              for (const item of response){
                if(item.displayName === userInfo.username){
                  return item;
                }
              }
            }
            else {
              return response[0];
            }
          }
        )
      );
  }

  getTriumphsById(user: User): Observable<any> {
    let apiUrl = `${this.bungieUrl}/Destiny2/${user.membershipType}/Profile/${user.membershipId}/?components=900`;
    return this.http.get(apiUrl, this.httpOptions)
      .pipe(
        map(
          (data: any) => {
            // placeholder
            let response = data.Response;
            //console.log(response);
            // DO STUFF
            try {
              //for(let hash in response.characterRecords.data[''])
              //response = response.profileRecords.data;
            }
            catch (err) {
              response = null;
            }
            finally {
              return response;
            }
          }
        )
      );
  }

  //#region MANIFEST
  getManifestUrl() {
    let apiUrl = `${this.bungieUrl}/Destiny2/Manifest/`;
    return this.http.get(apiUrl, this.httpOptions).pipe(
      map( (data: any) => {
        let response: any;
        try {
          response = data.Response.jsonWorldContentPaths.en;
          //console.log('Got Manifest URL')
          return response;
        }
        catch (err) {
          console.log(`Error getting URL! \n${err}`);
          throw err;
        }
      })
    );
  }

  getManifestJSON(url: string) {
    if(url) {
      let apiUrl = `https://www.bungie.net${url}`;
      return this.http.get(apiUrl);
    }
    else{
      console.log("invalid URL returned.")
    }
  }
  //#endregion

}
