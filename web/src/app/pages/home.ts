import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { DocumentationLinks } from '../documentation-links';

type ApiStatus = {
  status: string;
  app: string;
  timestamp: string;
};

@Component({
  selector: 'app-home',
  imports: [DocumentationLinks],
  template: `
    <section class="hero">
      <div class="framework-rail">
      <div class="ecosystem-logo"><img class="wordmark" src="/brand/angular.png" alt="Angular" width="156" height="52"><span>+</span><img src="/brand/dotnet.svg" alt=".NET" width="52" height="52"></div>
      <p id="api-actions-label" class="eyebrow">Frontend + API</p>
      <h1>Angular and ASP.NET Core full-stack app</h1>
      </div>
      <div class="welcome-copy">
      <p>
        This page is a static Angular build. Its status card calls the ASP.NET Core
        backend through the same hostname and the <code>/api</code> prefix.
      </p>
      <div #responseAnchor class="response-actions" role="group" aria-labelledby="api-actions-label" tabindex="-1">
      <button #statusTrigger class="status-trigger" type="button" popovertarget="api-status-response" popovertargetaction="show" aria-haspopup="dialog" aria-controls="api-status-response" (click)="loadStatus()" [disabled]="loading()">
        {{ loading() ? 'Checking API...' : 'Check API status' }}
      </button>
      <button #healthTrigger class="health-trigger" type="button" popovertarget="api-health-response" popovertargetaction="show" aria-haspopup="dialog" aria-controls="api-health-response" (click)="checkHealth()" [disabled]="checkingHealth()">
        {{ checkingHealth() ? 'Checking health...' : 'Check API health' }}
      </button>
      </div>
      </div>
    </section>
    <section id="api-status-response" class="status-card response-flyout" popover="auto" role="dialog" aria-labelledby="api-status-title" (beforetoggle)="restoreResponseFocus($event, statusTrigger, responseAnchor)">
      <div class="response-heading">
      <h2 id="api-status-title">Backend status</h2>
      <button type="button" class="response-close" popovertarget="api-status-response" popovertargetaction="hide" aria-label="Close API status" autofocus>&times;</button>
      </div>
      <div aria-live="polite" [attr.aria-busy]="loading()">
      @if (loading()) {
        <p>Checking API...</p>
      } @else if (error()) {
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
      </div>
    </section>
    <section id="api-health-response" class="response-flyout" popover="auto" role="dialog" aria-labelledby="api-health-title" (beforetoggle)="restoreResponseFocus($event, healthTrigger, responseAnchor)">
      <div class="response-heading">
        <h2 id="api-health-title">API health</h2>
        <button type="button" class="response-close" popovertarget="api-health-response" popovertargetaction="hide" aria-label="Close API health" autofocus>&times;</button>
      </div>
      <p>Health checks show process readiness only, not Azure deployment status.</p>
      <div role="status" [attr.aria-busy]="checkingHealth()">
      @if (healthResponse(); as response) {
        <p>/api/health · HTTP {{ response.status }} · <code class="health-response-body">{{ response.body }}</code>. Process readiness only; Azure deployment is not verified.</p>
      } @else {
        <p [class.error]="healthFailed()">{{ health() }}</p>
      }
      </div>
    </section>
    <app-documentation-links [showLabel]="true" />
    <details>
      <summary>Customize this sample</summary>
      <div class="customize-cards">
        <div class="customize-card">
          <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H5v18h14V8zM14 3v5h5M8 12h8M8 16h6"/></svg>
          <p>Edit <code>web/src/app/pages/home.ts</code> in your own fork to change this page. </p>
        </div>
        <div class="customize-card">
          <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16M4 12h16M4 19h16M8 3v4M16 10v4M10 17v4"/></svg>
          <p>Edit <code>web/public/brand/family.v1.css</code> for its styles. </p>
        </div>
        <div class="customize-card">
          <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="14" width="18" height="6" rx="1"/><path d="M7 7h.01M7 17h.01M12 7h5M12 17h5"/></svg>
          <p>Edit <code>api/FullstackAngularDotnet.Api/Program.cs</code> to change the API. </p>
        </div>
        <div class="customize-card">
          <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V3M7 8l5-5 5 5M4 14v7h16v-7"/></svg>
          <p>Rebuild, test, commit and redeploy your fork; this page does not edit GitHub.</p>
        </div>
      </div>
    </details>
  `,
})
export class Home {
  private readonly http = inject(HttpClient);

  protected readonly error = signal('');
  protected readonly loading = signal(false);
  protected readonly status = signal<ApiStatus | null>(null);
  protected readonly health = signal('');
  protected readonly checkingHealth = signal(false);
  protected readonly healthResponse = signal<{ status: number; body: string } | null>(null);
  protected readonly healthFailed = signal(false);

  protected restoreResponseFocus(event: Event, trigger: HTMLButtonElement, fallback: HTMLElement): void {
    if (!(event instanceof ToggleEvent) || event.newState !== 'closed') return;
    const popup = event.currentTarget;
    if (!(popup instanceof HTMLElement) || !popup.contains(document.activeElement)) return;

    // Let native popover dismissal finish before choosing a still-focusable return target.
    setTimeout(() => {
      if (!popup.isConnected || popup.matches(':popover-open')) return;
      if (document.activeElement === document.body || popup.contains(document.activeElement)) {
        (trigger.disabled ? fallback : trigger).focus({ preventScroll: true });
      }
    }, 0);
  }

  private formatHealthBody(body: string | null): string {
    if (body === null) return '';
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch (error) {
      if (error instanceof SyntaxError) return body;
      throw error;
    }
  }

  protected checkHealth(): void {
    this.checkingHealth.set(true);
    this.healthResponse.set(null);
    this.healthFailed.set(false);
    this.health.set('Checking /api/health...');
    this.http.get('/api/health', { responseType: 'text', observe: 'response', timeout: 5000 }).subscribe({
      next: (response) => {
        this.healthResponse.set({ status: response.status, body: this.formatHealthBody(response.body) });
        this.health.set(`/api/health · HTTP ${response.status} · ${response.body}. Process readiness only; Azure deployment is not verified.`);
        this.checkingHealth.set(false);
      },
      error: () => {
        this.healthFailed.set(true);
        this.health.set('API health could not be checked. Confirm the API is reachable and retry.');
        this.checkingHealth.set(false);
      },
    });
  }

  protected loadStatus(): void {
    this.loading.set(true);
    this.error.set('');
    this.status.set(null);

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

