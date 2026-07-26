import { useState } from 'react';

const views = ['Dashboard', 'Capture', 'Analysis'] as const;
type View = (typeof views)[number];

export function ProductGallery(): React.ReactNode {
  const [activeView, setActiveView] = useState<View>('Dashboard');

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ): void => {
    let nextIndex: number | undefined;

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % views.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + views.length) % views.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = views.length - 1;
    }

    if (nextIndex === undefined) {
      return;
    }

    event.preventDefault();
    const nextView = views[nextIndex]!;
    setActiveView(nextView);
    document.getElementById(`gallery-tab-${nextView.toLowerCase()}`)?.focus();
  };

  return (
    <div className="gallery">
      <div className="gallery-tabs" role="tablist" aria-label="Product views">
        {views.map((view, index) => (
          <button
            aria-controls={`gallery-${view.toLowerCase()}`}
            aria-selected={activeView === view}
            id={`gallery-tab-${view.toLowerCase()}`}
            key={view}
            onClick={() => setActiveView(view)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
            role="tab"
            tabIndex={activeView === view ? 0 : -1}
            type="button"
          >
            {view}
          </button>
        ))}
      </div>
      <div
        aria-labelledby={`gallery-tab-${activeView.toLowerCase()}`}
        className="gallery-stage"
        id={`gallery-${activeView.toLowerCase()}`}
        role="tabpanel"
      >
        {activeView === 'Dashboard' && <DashboardPreview />}
        {activeView === 'Capture' && <CapturePreview />}
        {activeView === 'Analysis' && <AnalysisPreview />}
      </div>
    </div>
  );
}

function DashboardPreview(): React.ReactNode {
  return (
    <div className="product-preview dashboard-preview">
      <aside>
        <div className="preview-brand">D</div>
        <span className="active" />
        <span />
        <span />
        <span />
      </aside>
      <main>
        <div className="preview-title">
          <div>
            <small>Tuesday, 21 July</small>
            <h3>Good morning.</h3>
          </div>
          <div className="preview-avatar">A</div>
        </div>
        <div className="preview-hero">
          <div>
            <small>Your learning space</small>
            <h4>Make progress feel visible.</h4>
            <p>One focused view of what needs attention next.</p>
          </div>
          <span>12</span>
        </div>
        <div className="preview-stats">
          <article>
            <small>Due today</small>
            <strong>3</strong>
          </article>
          <article>
            <small>In your library</small>
            <strong>48</strong>
          </article>
          <article>
            <small>Mastered</small>
            <strong>21</strong>
          </article>
        </div>
      </main>
    </div>
  );
}

function CapturePreview(): React.ReactNode {
  return (
    <div className="product-preview capture-preview">
      <header>
        <div className="preview-brand">D</div>
        <div>
          <small>Detected on LeetCode</small>
          <strong>1. Two Sum</strong>
        </div>
        <span>Easy</span>
      </header>
      <section>
        <p>How well did you understand it?</p>
        <div className="capture-choice-grid">
          <div>Mastered</div>
          <div className="selected">Understood</div>
          <div>Needed hint</div>
        </div>
        <label>
          Private note
          <span>A hash map turns complement lookup into one pass.</span>
        </label>
        <div className="capture-consent">
          <span>✓</span>
          Analyze my current solution with AI
        </div>
        <div className="capture-save">Add question</div>
      </section>
    </div>
  );
}

function AnalysisPreview(): React.ReactNode {
  return (
    <div className="product-preview analysis-preview">
      <aside>
        <small>Latest questions</small>
        <div className="selected">
          <span>T</span>
          <div>
            <strong>Two Sum</strong>
            <small>Easy · Ready</small>
          </div>
        </div>
        <div>
          <span>G</span>
          <div>
            <strong>Group Anagrams</strong>
            <small>Medium · Ready</small>
          </div>
        </div>
      </aside>
      <main>
        <small>Topic</small>
        <h3>Hash map complement lookup</h3>
        <div className="analysis-methods">
          <article>
            <span>Brute Force</span>
            <strong>Check every pair</strong>
            <small>O(n²) time · O(1) space</small>
          </article>
          <article>
            <span>Improved</span>
            <strong>Sort + two pointers</strong>
            <small>O(n log n) time · O(n) space</small>
          </article>
          <article className="highlight">
            <span>Optimal</span>
            <strong>One-pass hash map</strong>
            <small>O(n) time · O(n) space</small>
          </article>
        </div>
      </main>
    </div>
  );
}
