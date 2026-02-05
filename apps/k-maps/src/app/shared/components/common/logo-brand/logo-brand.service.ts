import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LogoBrandService {
  private cache = {};

  constructor() {}

  isNotFoundBrand(code: string): boolean {
    if (!code) {
      return true;
    }
    return this.cache[code];
  }

  notFoundBrand(code: string): void {
    this.cache[code] = true;
  }
}
