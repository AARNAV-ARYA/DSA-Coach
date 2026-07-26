import { useId, useState } from 'react';
import { reviewDateFromToday, useRevisionStore } from '@/features/revision/model/revision-store';
import {
  revisionOutcomeCopy,
  revisionOutcomes,
  type RevisionOutcome,
  type RevisionProblemSource,
} from '@/features/revision/model/revision-types';

interface WebCaptureDialogProps {
  onClose: () => void;
}

export function WebCaptureDialog({ onClose }: WebCaptureDialogProps): React.ReactNode {
  const titleId = useId();
  const addProblem = useRevisionStore((state) => state.addProblem);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [difficulty, setDifficulty] = useState<RevisionProblemSource['difficulty']>('Medium');
  const [outcome, setOutcome] = useState<RevisionOutcome>('understood');
  const [reviewDate, setReviewDate] = useState(reviewDateFromToday(7));
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const save = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    const sourceResult = buildLeetCodeSource(url, title, difficulty);
    if (sourceResult.error !== null) {
      setError(sourceResult.error);
      return;
    }

    setIsSaving(true);
    const problem = await addProblem({
      title,
      outcome,
      reviewDate,
      note,
      ...(sourceResult.source === null ? {} : { source: sourceResult.source }),
    });
    setIsSaving(false);

    if (problem === null) {
      setError('Enter a title, or remove the duplicate LeetCode URL.');
      return;
    }

    onClose();
  };

  return (
    <div
      className="web-capture-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="web-capture-dialog"
        role="dialog"
      >
        <header>
          <div>
            <p className="dashboard-kicker">Quick capture</p>
            <h2 id={titleId}>Add a question</h2>
            <p>The web app keeps this question in your current browser.</p>
          </div>
          <button aria-label="Close add question" onClick={onClose} type="button">
            ×
          </button>
        </header>

        <form onSubmit={(event) => void save(event)}>
          <label className="web-field">
            <span>Question title</span>
            <input
              autoFocus
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Two Sum"
              required
              value={title}
            />
          </label>

          <div className="web-field-row">
            <label className="web-field">
              <span>
                LeetCode URL <small>optional</small>
              </span>
              <input
                inputMode="url"
                onChange={(event) => setUrl(event.target.value)}
                placeholder="leetcode.com/problems/..."
                value={url}
              />
            </label>
            <label className="web-field web-difficulty-field">
              <span>Difficulty</span>
              <select
                disabled={url.trim() === ''}
                onChange={(event) =>
                  setDifficulty(event.target.value as RevisionProblemSource['difficulty'])
                }
                value={difficulty}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </label>
          </div>

          <fieldset className="web-outcomes">
            <legend>How well did you understand it?</legend>
            <div>
              {revisionOutcomes.map((item) => (
                <button
                  aria-pressed={outcome === item}
                  className={outcome === item ? 'is-selected' : undefined}
                  key={item}
                  onClick={() => setOutcome(item)}
                  type="button"
                >
                  <strong>{revisionOutcomeCopy[item].label}</strong>
                  <span>{revisionOutcomeCopy[item].description}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="web-field-row">
            <label className="web-field">
              <span>Return to this question</span>
              <input
                min={reviewDateFromToday(0)}
                onChange={(event) => setReviewDate(event.target.value)}
                required
                type="date"
                value={reviewDate}
              />
            </label>
            <label className="web-field">
              <span>
                Private note <small>optional</small>
              </span>
              <textarea
                onChange={(event) => setNote(event.target.value)}
                placeholder="What made the approach click?"
                value={note}
              />
            </label>
          </div>

          {error !== null && (
            <p className="web-form-error" role="alert">
              {error}
            </p>
          )}

          <footer>
            <button className="web-button-secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="web-button-primary" disabled={isSaving} type="submit">
              {isSaving ? 'Saving…' : 'Add to reviews'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function buildLeetCodeSource(
  value: string,
  title: string,
  difficulty: RevisionProblemSource['difficulty'],
): { source: RevisionProblemSource | null; error: string | null } {
  const trimmedUrl = value.trim();
  if (trimmedUrl === '') {
    return { source: null, error: null };
  }

  try {
    const normalizedUrl = trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`;
    const parsed = new URL(normalizedUrl);
    const problemSlug = parsed.pathname.match(/^\/problems\/([^/]+)/)?.[1];

    if (!parsed.hostname.endsWith('leetcode.com') || problemSlug === undefined) {
      return {
        source: null,
        error: 'Use a LeetCode problem URL such as leetcode.com/problems/two-sum.',
      };
    }

    return {
      source: {
        provider: 'leetcode',
        problemId: problemSlug,
        title: title.trim(),
        difficulty,
        url: `https://leetcode.com/problems/${problemSlug}/`,
      },
      error: null,
    };
  } catch {
    return { source: null, error: 'Enter a valid LeetCode URL or leave the field empty.' };
  }
}
