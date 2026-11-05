import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product',
  imports: [RouterLink],
  template: `
    <p class="eyebrow">Direct navigation test</p>
    <h1>Widget 1</h1>
    <p>This route verifies that Angular deep links receive the SPA entry point.</p>
    <a routerLink="/">Return home</a>
  `,
})
export class Product {}

