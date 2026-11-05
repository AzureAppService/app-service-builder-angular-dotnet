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
  `,
})
export class Home {
  private readonly http = inject(HttpClient);

  protected readonly error = signal('');
  protected readonly loading = signal(false);
  protected readonly status = signal<ApiStatus | null>(null);

  protected loadStatus(): void {
    this.loading.set(true);
    this.error.set('');

    this.http.get<ApiStatus>('/api/status').subscribe({
      next: (status) => {
        this.status.set(status);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('The frontend could not reach the API.');
        this.loading.set(false);
      },
    });
  }
}

