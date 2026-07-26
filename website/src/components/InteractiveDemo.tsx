import { useId, useState } from 'react';

type DemoStage = 'detected' | 'captured' | 'scheduled';

const stageCopy: Record<DemoStage, { label: string; status: string }> = {
  detected: { label: 'Problem detected', status: 'Ready to save' },
  captured: { label: 'Added to your library', status: 'Saved locally' },
  scheduled: { label: 'Review prepared', status: 'Returns when useful' },
};

export function InteractiveDemo(): React.ReactNode {
  const [stage, setStage] = useState<DemoStage>('detected');
  const [outcome, setOutcome] = useState('Understood');
  const statusId = useId();

  const advance = (): void => {
    setStage((current) =>
      current === 'detected' ? 'captured' : current === 'captured' ? 'scheduled' : 'detected',
    );
  };

  return (
    <div className="demo-shell">
      <div className="demo-browser" aria-hidden="true">
        <div className="demo-browser-bar">
          <span />
          <span />
          <span />
          <p>leetcode.com/problems/two-sum</p>
        </div>
        <div className="demo-code">
          <div>
            <span className="code-purple">class</span> Solution {'{'}
          </div>
          <div className="code-indent">
            <span className="code-blue">twoSum</span>(nums, target) {'{'}
          </div>
          <div className="code-indent code-dim">// Find the missing complement</div>
          <div className="code-indent">{'}'}</div>
          <div>{'}'}</div>
        </div>
        <div className="demo-add-pill">+ Add question</div>
      </div>

      <section className="demo-panel" aria-labelledby="demo-panel-title">
        <div className="demo-panel-top">
          <div>
            <p className="eyebrow">Live product simulation</p>
            <h3 id="demo-panel-title">Two Sum</h3>
          </div>
          <span className="difficulty-pill">Easy</span>
        </div>

        <div className="demo-progress" aria-hidden="true">
          {(['detected', 'captured', 'scheduled'] as const).map((item, index) => (
            <span
              className={
                index <= (stage === 'detected' ? 0 : stage === 'captured' ? 1 : 2)
                  ? 'demo-progress-active'
                  : undefined
              }
              key={item}
            />
          ))}
        </div>

        <div className="demo-state">
          <span className="demo-state-mark" aria-hidden="true">
            {stage === 'scheduled' ? '✓' : stage === 'captured' ? '↗' : '⌁'}
          </span>
          <div>
            <strong>{stageCopy[stage].label}</strong>
            <p id={statusId} aria-live="polite">
              {stageCopy[stage].status}
            </p>
          </div>
        </div>

        <fieldset className="demo-outcomes">
          <legend>How did it feel?</legend>
          <div>
            {['Mastered', 'Understood', 'Needed hint'].map((item) => (
              <button
                aria-pressed={outcome === item}
                className={outcome === item ? 'demo-outcome-active' : undefined}
                key={item}
                onClick={() => setOutcome(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </fieldset>

        <button className="button button-primary demo-action" onClick={advance} type="button">
          {stage === 'detected'
            ? 'Add problem'
            : stage === 'captured'
              ? 'Prepare review'
              : 'Run demo again'}
          <span aria-hidden="true">→</span>
        </button>
      </section>
    </div>
  );
}
