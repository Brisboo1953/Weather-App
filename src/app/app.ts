import { Component } from '@angular/core';
import { WeatherComponent } from './features/weather/weather.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [WeatherComponent],
  templateUrl: './app.html',
})
export class App {}