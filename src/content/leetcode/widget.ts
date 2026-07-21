import type { LeetCodeProblemContext } from '@/content/leetcode/types';

const widgetId = 'dsa-coach-leetcode-widget';

export class LeetCodeProblemWidget {
  private readonly host: HTMLDivElement;
  private readonly shadow: ShadowRoot;
  private readonly context: LeetCodeProblemContext;
  private readonly eventController = new AbortController();

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

    const action = document.createElement('button');
    action.className = 'dsa-coach-action';
    action.setAttribute('aria-label', `Add ${this.context.title} to DSA Coach`);
    action.title = `Add ${this.context.title} to DSA Coach`;
    action.type = 'button';
    action.innerHTML = '<span aria-hidden="true">+</span><strong>DSA Coach</strong>';

    action.addEventListener(
      'click',
      (event) => {
        event.stopPropagation();
        void this.openCapturePanel();
      },
      { signal: this.eventController.signal },
    );

    container.append(action);
    return container;
  }

  private async openCapturePanel(): Promise<void> {
    if (typeof chrome === 'undefined' || typeof chrome.runtime?.sendMessage !== 'function') return;

    await chrome.runtime.sendMessage({ version: 1, type: 'shell.open-side-panel' });
  }

  private createStyles(): HTMLStyleElement {
    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      .dsa-coach-container { position: fixed; right: 24px; bottom: 24px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .dsa-coach-action { height: 42px; display: inline-flex; align-items: center; gap: 8px; padding: 0 14px; border: 1px solid rgba(37, 99, 235, .2); border-radius: 14px; background: rgba(255, 255, 255, .94); box-shadow: 0 8px 24px rgba(15, 23, 42, .12), 0 1px 2px rgba(15, 23, 42, .08); color: #1d4ed8; cursor: pointer; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease; }
      .dsa-coach-action:hover { transform: translateY(-1px); background: #f8fbff; box-shadow: 0 12px 30px rgba(15, 23, 42, .16), 0 1px 2px rgba(15, 23, 42, .08); }
      .dsa-coach-action:focus-visible { outline: 3px solid #0a84ff; outline-offset: 3px; }
      .dsa-coach-action span { display: grid; width: 18px; height: 18px; place-items: center; border-radius: 6px; background: #2563eb; color: #fff; font-size: 16px; font-weight: 500; line-height: 1; }
      .dsa-coach-action strong { font-size: 13px; font-weight: 650; letter-spacing: -.01em; }
      @media (prefers-color-scheme: dark) { .dsa-coach-action { border-color: rgba(96,165,250,.26); background: rgba(23,32,51,.94); color: #bfdbfe; box-shadow: 0 12px 30px rgba(0,0,0,.4); } .dsa-coach-action:hover { background: #1d2a42; } .dsa-coach-action span { background: #60a5fa; color: #0b1a33; } }
      @media (max-width: 480px) { .dsa-coach-container { right: 16px; bottom: 16px; } }
    `;
    return style;
  }
}
