import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'kelvinToCelsius', standalone: true })
export class KelvinToCelsiusPipe implements PipeTransform {
  transform(kelvin: number): number {
    if (!kelvin) return 0;
    return Math.round(kelvin - 273.15);
  }
}