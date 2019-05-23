import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { ManifestService } from './manifest.service';

@Injectable({
  providedIn: 'root'
})
export class ManifestResolverService implements Resolve<any> {

  constructor(private manifestService: ManifestService) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
    return this.manifestService.returnManifest();
  }
}
