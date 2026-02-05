import { Pipe, PipeTransform } from '@angular/core';
import { CountriesHttpService } from '../../../../../../supervision/src/app/business/services/countries-http.service';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';

@Pipe({
  name: 'countryResolver'
})
export class CountryPipe implements PipeTransform {
  constructor(private countriesHttpService: CountriesHttpService) {}

  transform(id: string) {
    if (!id) {
      return of(' ');
    }

    const obs$ = this.countriesHttpService.get(id).pipe(map((c) => c?.names?.default || ' '));
    return obs$;
  }
}
