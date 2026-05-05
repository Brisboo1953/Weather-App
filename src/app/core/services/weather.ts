import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface WeatherCurrent {
  name: string;
  sys: { country: string };
  main: { temp: number; feels_like: number; humidity: number; pressure: number };
  weather: { id: number; main: string; description: string; icon: string }[];
  wind: { speed: number };
}

export interface ForecastItem {
  dt: number;
  main: { temp: number; temp_min: number; temp_max: number };
  weather: { id: number; main: string; description: string }[];
}

export interface ForecastResponse {
  list: ForecastItem[];
}

@Injectable({ providedIn: 'root' })
export class WeatherService {
  private http = inject(HttpClient);
  private readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';
  private readonly API_KEY = environment.weatherApiKey;

  private cache = new Map<string, any>();
  private cacheOrder: string[] = [];
  private readonly MAX_CACHE = 5;

  getCurrentWeather(city: string): Observable<WeatherCurrent> {
    const key = `current_${city.toLowerCase().trim()}`;
    if (this.cache.has(key)) return of(this.cache.get(key));

    const url = `${this.BASE_URL}/weather?q=${city}&appid=${this.API_KEY}&lang=es`;
    return this.http.get<WeatherCurrent>(url).pipe(
      tap(data => this.saveToCache(key, data, city)),
      catchError(err => this.handleError(err, city))
    );
  }

  getForecast(city: string): Observable<ForecastResponse> {
    const key = `forecast_${city.toLowerCase().trim()}`;
    if (this.cache.has(key)) return of(this.cache.get(key));

    const url = `${this.BASE_URL}/forecast?q=${city}&appid=${this.API_KEY}&lang=es`;
    return this.http.get<ForecastResponse>(url).pipe(
      tap(data => this.saveToCache(key, data, city)),
      catchError(err => this.handleError(err, city))
    );
  }

  getRecentSearches(): string[] {
    return [...this.cacheOrder].reverse();
  }

  private saveToCache(key: string, data: any, city: string) {
    const cityKey = city.toLowerCase().trim();
    if (!this.cacheOrder.includes(cityKey)) {
      if (this.cacheOrder.length >= this.MAX_CACHE) {
        const oldest = this.cacheOrder.shift()!;
        this.cache.delete(`current_${oldest}`);
        this.cache.delete(`forecast_${oldest}`);
      }
      this.cacheOrder.push(cityKey);
    }
    this.cache.set(key, data);
  }

  private handleError(err: HttpErrorResponse, city: string): Observable<never> {
    let message = '';
    if (!navigator.onLine) message = 'Sin conexión a internet.';
    else if (err.status === 404) message = `Ciudad "${city}" no encontrada.`;
    else if (err.status === 401) message = 'API Key inválida o no activada aún.';
    else if (err.status === 429) message = 'Demasiadas solicitudes. Espera un momento.';
    else message = `Error inesperado (${err.status}).`;
    return throwError(() => new Error(message));
  }
}