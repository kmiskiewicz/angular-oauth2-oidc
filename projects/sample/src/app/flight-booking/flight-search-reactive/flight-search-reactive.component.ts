import { Component } from '@angular/core';
import { Flight } from '../../entities/flight';
import { FlightService } from '../services/flight.service';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-flight-search-reactive',
  templateUrl: 'flight-search-reactive.component.html',
  providers: [FlightService],
  styleUrls: ['flight-search-reactive.component.css']
})
export class FlightSearchReactiveComponent {
  public flights: Array<Flight> = [];
  public selectedFlight: Flight;

  public filter: FormGroup;

  public formDesc = [];

  constructor(private flightService: FlightService, private fb: FormBuilder) {
    this.formDesc.push({
      label: 'Von',
      name: 'from'
    });

    this.formDesc.push({
      label: 'Nach',
      name: 'to'
    });

    this.filter = fb.group({
      from: [
        'Graz',
        [
          Validators.required,
          Validators.minLength(3),
          (c: AbstractControl): any => {
            if (c.value !== 'Graz' && c.value !== 'Hamburg') {
              return {
                appCity: true
              };
            }
            return {};
          }
        ]
      ],
      to: ['Hamburg']
    });

    this.filter.valueChanges.subscribe(e => {
      console.log('formular geändert', e);
    });

    this.filter.controls.from.valueChanges.subscribe(e => {
      console.log('from geändert', e);
    });
  }

  public select(f: Flight): void {
    this.selectedFlight = f;
  }

  public search(): void {
    const value = this.filter.value;

    this.flightService.find(value.from, value.to);

    // .map(function(resp) { return resp.json() })
  }
}
