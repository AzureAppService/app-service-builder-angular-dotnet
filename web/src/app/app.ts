import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DocumentationLinks } from './documentation-links';
import { Home } from './pages/home';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, DocumentationLinks],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly showHeaderDocumentation = signal(true);

  protected onRouteActivate(component: unknown): void {
    this.showHeaderDocumentation.set(!(component instanceof Home));
  }
}
