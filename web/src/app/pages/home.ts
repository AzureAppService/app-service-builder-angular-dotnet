import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';

type ApiStatus = {
  status: string;
  app: string;
  timestamp: string;
};

@Component({
  selector: 'app-home',
  template: `
    <section class="hero">
      <p class="eyebrow">Frontend + API</p>
      <h1>Angular and ASP.NET Core full-stack app</h1>
      <p>
        This page is a static Angular build. Its status card calls the ASP.NET Core
        backend through the same hostname and the <code>/api</code> prefix.
      </p>
      <button type="button" (click)="loadStatus()" [disabled]="loading()">
        {{ loading() ? 'Checking API...' : 'Check API status' }}
      </button>
      <button type="button" (click)="checkHealth()" [disabled]="checkingHealth()">
        {{ checkingHealth() ? 'Checking health...' : 'Check API health' }}
      </button>
      <p role="status">{{ health() }}</p>
    </section>
    <section class="status-card" aria-live="polite">
      <h2>Backend status</h2>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      } @else if (status(); as apiStatus) {
        <dl>
          <div><dt>Status</dt><dd>{{ apiStatus.status }}</dd></div>
          <div><dt>Application</dt><dd>{{ apiStatus.app }}</dd></div>
          <div><dt>Timestamp</dt><dd>{{ apiStatus.timestamp }}</dd></div>
        </dl>
      } @else {
        <p>Select the button to verify frontend-to-backend connectivity.</p>
      }
    </section>
    <details>
      <summary>Customize this sample</summary>
      <p>Edit <code>web/src/app/pages/home.ts</code> in your own fork to change this page.
        Edit <code>api/FullstackAngularDotnet.Api/Program.cs</code> to change the API.
        Rebuild, test, commit and redeploy your fork; this page does not edit GitHub.</p>
    </details>
    <p><a href="https://builderapps.azure.com/docs/">App Service Builder documentation</a>
      · <a href="https://angular.dev/overview">Angular documentation</a></p>
  `,
})
export class Home {
  private readonly http = inject(HttpClient);

  protected readonly error = signal('');
  protected readonly loading = signal(false);
  protected readonly status = signal<ApiStatus | null>(null);
  protected readonly health = signal('Health checks show process readiness only, not Azure deployment status.');
  protected readonly checkingHealth = signal(false);

  protected checkHealth(): void {
    this.checkingHealth.set(true);
    this.health.set('Checking /api/health...');
    this.http.get('/api/health', { responseType: 'text', observe: 'response', timeout: 5000 }).subscribe({
      next: (response) => {
        this.health.set(`/api/health · HTTP ${response.status} · ${response.body}. Process readiness only; Azure deployment is not verified.`);
        this.checkingHealth.set(false);
      },
      error: () => {
        this.health.set('API health could not be checked. Confirm the API is reachable and retry.');
        this.checkingHealth.set(false);
      },
    });
  }

  protected loadStatus(): void {
    this.loading.set(true);
    this.error.set('');

    this.http.get<ApiStatus>('/api/status').subscribe({
      next: (status) => {
        this.status.set(status);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('The frontend could not reach the API. Confirm the API is reachable, then check again.');
        this.loading.set(false);
      },
    });
  }
}

