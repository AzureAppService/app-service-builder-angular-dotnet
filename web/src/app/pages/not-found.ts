import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <p class="eyebrow">Client-side fallback</p>
    <h1>Page not found</h1>
    <p>Angular handled this unmatched frontend route.</p>
    <a routerLink="/">Return home</a>
  `,
})
export class NotFound {}

