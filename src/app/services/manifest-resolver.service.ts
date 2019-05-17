import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { flatMap, retryWhen, tap, delay } from 'rxjs/operators';
import { D2ApiService } from './d2-api.service';

@Injectable({
  providedIn: 'root'
})
export class ManifestResolverService implements Resolve<any> {

  constructor( private d2api: D2ApiService) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    return this.d2api.getManifestUrl().pipe(
      retryWhen(errors => {
        return errors.pipe(
          tap(() => console.log("error, retrying get manifest...")),
          delay(100)
        )
      }),
      flatMap((url: string) => {
        return this.d2api.getManifestJSON(url);
      })
    );
  }
}
