import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { WeatherService, WeatherCurrent, ForecastItem } from '../../core/services/weather';
import { KelvinToCelsiusPipe } from '../../core/pipes/kelvin-to-celsius.pipe';

interface DayForecast {
  dt: number;
  dayName: string;
  tempMax: number;
  tempMin: number;
  weatherId: number;
  description: string;
}

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule, FormsModule, KelvinToCelsiusPipe],
  templateUrl: './weather.component.html',
  styleUrl: './weather.component.css'
})
export class WeatherComponent {
  private weatherService = inject(WeatherService);

  loading = signal(false);
  errorMessage = signal('');
  current = signal<WeatherCurrent | null>(null);
  forecast = signal<DayForecast[]>([]);
  cityQuery = '';

  get recentSearches(): string[] {
    return this.weatherService.getRecentSearches();
  }

  search(city: string = this.cityQuery) {
    const trimmed = city.trim();
    if (!trimmed) return;
    this.cityQuery = trimmed;
    this.loading.set(true);
    this.errorMessage.set('');
    this.current.set(null);
    this.forecast.set([]);

    forkJoin({
      current: this.weatherService.getCurrentWeather(trimmed),
      forecast: this.weatherService.getForecast(trimmed)
    }).subscribe({
      next: ({ current, forecast }) => {
        this.current.set(current);
        this.forecast.set(this.parseForecast(forecast.list));
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.loading.set(false);
      }
    });
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') this.search();
  }

  getWeatherIcon(id: number): string {
    if (id >= 200 && id < 300) return '⛈️';
    if (id >= 300 && id < 400) return '🌦️';
    if (id >= 500 && id < 600) return '🌧️';
    if (id >= 600 && id < 700) return '❄️';
    if (id >= 700 && id < 800) return '🌫️';
    if (id === 800) return '☀️';
    if (id === 801 || id === 802) return '⛅';
    return '☁️';
  }

  getHeroClass(main: string): string {
    const m = main.toLowerCase();
    if (m.includes('cloud')) return 'hero-clouds';
    if (m.includes('rain') || m.includes('drizzle')) return 'hero-rain';
    if (m.includes('snow')) return 'hero-snow';
    if (m.includes('clear')) return 'hero-clear';
    if (m.includes('thunder')) return 'hero-thunder';
    return 'hero-default';
  }

  getWindKph(ms: number): number {
    return Math.round(ms * 3.6);
  }

  private parseForecast(list: ForecastItem[]): DayForecast[] {
    const daily = new Map<string, { temps: number[]; item: ForecastItem }>();
    list.forEach(item => {
      const day = new Date(item.dt * 1000).toDateString();
      if (!daily.has(day)) daily.set(day, { temps: [], item });
      daily.get(day)!.temps.push(item.main.temp);
    });
    return [...daily.values()].slice(1, 6).map(({ temps, item }) => ({
      dt: item.dt,
      dayName: new Date(item.dt * 1000).toLocaleDateString('es', { weekday: 'short' }),
      tempMax: Math.max(...temps),
      tempMin: Math.min(...temps),
      weatherId: item.weather[0].id,
      description: item.weather[0].description
    }));
  }
}