import { Component, OnInit } from '@angular/core';
import { D2ApiService } from '../services/d2-api.service';
import { TriumphTrackerService } from '../services/triumph-tracker.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styles: []
})
export class HomePageComponent implements OnInit {

  constructor(private d2api: D2ApiService,
              private tracker: TriumphTrackerService) { }

  ngOnInit() {
  }

}
