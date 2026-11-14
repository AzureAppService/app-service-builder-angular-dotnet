import { Component, input } from '@angular/core';

@Component({
  selector: 'app-documentation-links',
  template: `
    <nav class="documentation-links" aria-label="Documentation">
      @if (showLabel()) {
        <span class="documentation-label">
          <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v15"/></svg>
          <span>Documentation</span>
        </span>
      }
      <a href="https://angular.dev/overview">Angular</a>
      <a href="https://learn.microsoft.com/aspnet/core/">ASP.NET Core</a>
      <a href="https://builder.appservice.azure.com/docs/">App Service Builder</a>
    </nav>
  `,
})
export class DocumentationLinks {
  readonly showLabel = input(false);
}
