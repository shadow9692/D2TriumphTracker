import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CharacterHomeComponent } from './character-home/character-home.component';
import { HomePageComponent } from './home-page/home-page.component';
import { ManifestResolverService } from './services/manifest-resolver.service';

const routes: Routes = [
  {path: 'home', component: HomePageComponent},
  {path: 'character', component: CharacterHomeComponent, resolve: {resolvedManifest: ManifestResolverService}},
  {path: '', redirectTo: '/home', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
