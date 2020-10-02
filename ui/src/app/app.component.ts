import {Component, OnInit} from '@angular/core';
import {EventHubService} from "./event-hub.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  zones = {
    zone1: false,
    zone2: false,
    zone3: false
  };

  events = [];

  inputField: string;

  constructor(private eventReceiverService: EventHubService) {
  }

  ngOnInit(): void {
    this.eventReceiverService.receive().catch((err) => {
      console.log('Error occurred: ', err);
    });
  }

  addEventToQueue(): void {
    const inputValue = this.inputField;

    if (inputValue) {
      this.events.push(inputValue);
    }
  }

  sendEvents(): void {
    const events = this.events;

    if (events.length) {
      this.eventReceiverService.send(events);
    }
  }
}
