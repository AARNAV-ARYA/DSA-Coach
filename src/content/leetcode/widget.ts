import type { LeetCodeProblemContext } from '@/content/leetcode/types';

const widgetId = 'dsa-coach-leetcode-widget';

export class LeetCodeProblemWidget {
  private readonly host: HTMLDivElement;
  private readonly shadow: ShadowRoot;
  private readonly context: LeetCodeProblemContext;
  private readonly eventController = new AbortController();
  private isOpen = false;

  constructor(context: LeetCodeProblemContext) {
    this.context = context;
    this.host = document.createElement('div');
    this.host.id = widgetId;
    this.host.dataset.dsaCoachWidget = 'true';
    this.shadow = this.host.attachShadow({ mode: 'closed' });
  }

  mount(): void {
    this.shadow.append(this.createStyles(), this.createInterface());
    document.documentElement.append(this.host);
  }

  unmount(): void {
    this.eventController.abort();
    this.host.remove();
  }

  private createInterface(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'dsa-coach-container';

    const panel = document.createElement('section');
    panel.className = 'dsa-coach-panel';
    panel.setAttribute('aria-label', 'DSA Coach problem details');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('role', 'dialog');
    panel.hidden = true;
    panel.innerHTML = `
      <p class="eyebrow">Detected on LeetCode</p>
      <h2>${escapeHtml(this.context.title)}</h2>
      <dl>
        <div><dt>Problem</dt><dd>#${escapeHtml(this.context.problemId)}</dd></div>
        <div><dt>Difficulty</dt><dd class="difficulty ${this.context.difficulty.toLowerCase()}">${escapeHtml(this.context.difficulty)}</dd></div>
      </dl>
      <p class="privacy">Only this problem metadata is detected. Nothing is saved yet.</p>
    `;

    const action = document.createElement('button');
    action.className = 'dsa-coach-action';
    action.setAttribute('aria-controls', 'dsa-coach-problem-panel');
    action.setAttribute('aria-expanded', 'false');
    action.setAttribute('aria-label', 'Open DSA Coach problem details');
    action.type = 'button';
    action.innerHTML = '<span aria-hidden="true">⌁</span>';
    panel.id = 'dsa-coach-problem-panel';

    action.addEventListener(
      'click',
      (event) => {
        event.stopPropagation();
        this.isOpen = !this.isOpen;
        panel.hidden = !this.isOpen;
        action.setAttribute('aria-expanded', String(this.isOpen));
      },
      { signal: this.eventController.signal },
    );
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (this.isOpen && !this.host.contains(event.target as Node)) this.close(panel, action);
      },
      { signal: this.eventController.signal },
    );
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape' && this.isOpen) this.close(panel, action);
      },
      { signal: this.eventController.signal },
    );

    container.append(panel, action);
    return container;
  }

  private close(panel: HTMLElement, action: HTMLButtonElement): void {
    this.isOpen = false;
    panel.hidden = true;
    action.setAttribute('aria-expanded', 'false');
    action.focus();
  }

  private createStyles(): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      .dsa-coach-container { position: fixed; right: 24px; bottom: 24px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .dsa-coach-action { width: 42px; height: 42px; margin-left: auto; display: grid; place-items: center; border: 1px solid rgba(0, 0, 0, .08); border-radius: 14px; background: rgba(255, 255, 255, .92); box-shadow: 0 8px 24px rgba(0, 0, 0, .12), 0 1px 2px rgba(0, 0, 0, .08); color: #1d1d1f; cursor: pointer; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); transition: transform 160ms ease, box-shadow 160ms ease; }
      .dsa-coach-action:hover { transform: translateY(-1px); box-shadow: 0 12px 30px rgba(0, 0, 0, .16), 0 1px 2px rgba(0, 0, 0, .08); }
      .dsa-coach-action:focus-visible { outline: 3px solid #0a84ff; outline-offset: 3px; }
      .dsa-coach-action span { font-size: 25px; font-weight: 500; line-height: 1; transform: rotate(-20deg); }
      .dsa-coach-panel { width: 276px; margin: 0 0 12px; box-sizing: border-box; border: 1px solid rgba(0, 0, 0, .08); border-radius: 18px; background: rgba(255, 255, 255, .96); box-shadow: 0 18px 48px rgba(0, 0, 0, .17); color: #1d1d1f; padding: 18px; backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); }
      .eyebrow { margin: 0 0 7px; color: #6e6e73; font-size: 11px; font-weight: 600; letter-spacing: .03em; text-transform: uppercase; }
      h2 { margin: 0; font-size: 17px; font-weight: 650; letter-spacing: -.02em; line-height: 1.25; }
      dl { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 17px 0 0; padding: 13px 0; border-top: 1px solid #e5e5e7; border-bottom: 1px solid #e5e5e7; }
      dl div { min-width: 0; } dt { margin-bottom: 3px; color: #86868b; font-size: 11px; } dd { margin: 0; font-size: 13px; font-weight: 600; } .difficulty.easy { color: #198754; } .difficulty.medium { color: #b85c00; } .difficulty.hard { color: #d63333; }
      .privacy { margin: 13px 0 0; color: #6e6e73; font-size: 11px; line-height: 1.45; }
      @media (prefers-color-scheme: dark) { .dsa-coach-action, .dsa-coach-panel { border-color: rgba(255,255,255,.12); background: rgba(40,40,42,.94); color: #f5f5f7; } .dsa-coach-panel { box-shadow: 0 18px 48px rgba(0,0,0,.46); } .eyebrow, .privacy, dt { color: #a1a1a6; } dl { border-color: #48484a; } .difficulty.easy { color: #5bd18b; } .difficulty.medium { color: #ff9f0a; } .difficulty.hard { color: #ff6961; } }
      @media (max-width: 480px) { .dsa-coach-container { right: 16px; bottom: 16px; } }
    `;
    return style;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return entities[character] ?? character;
  });
}
