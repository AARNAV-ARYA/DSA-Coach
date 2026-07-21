import { useEffect, useMemo, useState } from 'react';
import {
  findProblemBySource,
  reviewDateFromToday,
  today,
  useRevisionStore,
} from '@/features/revision/model/revision-store';
import {
  revisionOutcomeCopy,
  revisionOutcomes,
  type RevisionOutcome,
  type RevisionProblem,
  type RevisionProblemSource,
} from '@/features/revision/model/revision-types';
import { getActiveProblemContext, sendExtensionMessage } from '@/shared/lib/messaging/client';
import type { ProblemContext } from '@/shared/lib/messaging/contracts';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';

const reviewOptions = [
  { label: 'Tomorrow', days: 1 },
  { label: '3 Days', days: 3 },
  { label: '7 Days', days: 7 },
  { label: '15 Days', days: 15 },
  { label: '30 Days', days: 30 },
  { label: '60 Days', days: 60 },
] as const;

export function QuickCapture({
  compact = false,
  sidepanel = false,
}: {
  compact?: boolean;
  sidepanel?: boolean;
}): React.ReactNode {
  const problems = useRevisionStore((state) => state.problems);
  const isHydrated = useRevisionStore((state) => state.isHydrated);
  const hydrate = useRevisionStore((state) => state.hydrate);
  const addProblem = useRevisionStore((state) => state.addProblem);
  const updateProblem = useRevisionStore((state) => state.updateProblem);
  const reviewProblemToday = useRevisionStore((state) => state.reviewProblemToday);
  const removeProblem = useRevisionStore((state) => state.removeProblem);
  const [context, setContext] = useState<ProblemContext | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [outcome, setOutcome] = useState<RevisionOutcome>('understood');
  const [reviewDate, setReviewDate] = useState(reviewDateFromToday(7));
  const [note, setNote] = useState('');
  const [isCustomDate, setIsCustomDate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isManualCapture, setIsManualCapture] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [didSave, setDidSave] = useState(false);

  useEffect(() => {
    void hydrate();
    void getActiveProblemContext()
      .then(setContext)
      .finally(() => setIsLoadingContext(false));
  }, [hydrate]);

  const source = useMemo(() => (context === null ? null : toRevisionSource(context)), [context]);
  const existingProblem = useMemo(
    () => (source === null ? undefined : findProblemBySource(problems, source)),
    [problems, source],
  );
  const currentDate = today();
  const dueToday = problems.filter((problem) => problem.reviewDate <= currentDate).length;
  const mastered = problems.filter((problem) => problem.outcome === 'mastered').length;
  const upcomingProblems = [...problems]
    .filter((problem) => problem.reviewDate > currentDate)
    .sort((first, second) => first.reviewDate.localeCompare(second.reviewDate))
    .slice(0, 3);

  async function save(): Promise<void> {
    const title = source?.title ?? manualTitle.trim();
    if (title === '') return;

    if (source !== null && existingProblem !== undefined && isEditing) {
      await updateProblem(existingProblem.id, {
        title,
        outcome,
        reviewDate,
        note,
        source,
      });
      setIsEditing(false);
    } else {
      const savedProblem = await addProblem({
        title,
        outcome,
        reviewDate,
        note,
        ...(source === null ? {} : { source }),
      });
      if (savedProblem === null) return;
    }

    if (source === null) {
      setManualTitle('');
      setIsManualCapture(false);
    }
    setDidSave(true);
    globalThis.setTimeout(() => setDidSave(false), 2_000);
  }

  function startEditing(): void {
    if (existingProblem === undefined) return;

    setOutcome(existingProblem.outcome);
    setReviewDate(existingProblem.reviewDate);
    setNote(existingProblem.note ?? '');
    setIsCustomDate(
      !reviewOptions.some(
        (option) => reviewDateFromToday(option.days) === existingProblem.reviewDate,
      ),
    );
    setIsEditing(true);
  }

  function startManualCapture(): void {
    setIsEditing(false);
    setIsManualCapture(true);
    setManualTitle('');
    setOutcome('understood');
    setReviewDate(reviewDateFromToday(7));
    setNote('');
    setIsCustomDate(false);
    document.getElementById('sidepanel-capture')?.scrollIntoView({ behavior: 'smooth' });
  }

  if (sidepanel) {
    return (
      <SidepanelWorkspace
        dueToday={dueToday}
        existingProblem={existingProblem}
        isEditing={isEditing}
        isHydrated={isHydrated}
        isLoadingContext={isLoadingContext}
        isManualCapture={isManualCapture}
        mastered={mastered}
        manualTitle={manualTitle}
        note={note}
        onCancel={() => {
          setIsEditing(false);
          setIsManualCapture(false);
        }}
        onEdit={startEditing}
        onNoteChange={setNote}
        onOpenDashboard={() => void sendExtensionMessage({ type: 'shell.open-dashboard' })}
        onOutcomeChange={setOutcome}
        onRemove={() => existingProblem && void removeProblem(existingProblem.id)}
        onReview={() => existingProblem && void reviewProblemToday(existingProblem.id)}
        onReviewDateChange={setReviewDate}
        onSave={() => void save()}
        onCustomDateChange={setIsCustomDate}
        onManualTitleChange={setManualTitle}
        onStartManualCapture={startManualCapture}
        outcome={outcome}
        problems={problems}
        reviewDate={reviewDate}
        source={source}
        upcomingProblems={upcomingProblems}
        isCustomDate={isCustomDate}
        didSave={didSave}
      />
    );
  }

  const panelClassName = compact ? 'pt-7' : 'mx-auto max-w-xl pt-10';

  return (
    <section className={panelClassName}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-info">Quick capture</p>
        <Button
          onClick={() => void sendExtensionMessage({ type: 'shell.open-dashboard' })}
          variant="ghost"
        >
          Dashboard
        </Button>
      </div>
      <h1
        className={cn('mt-2 font-semibold tracking-[-0.04em]', compact ? 'text-2xl' : 'text-3xl')}
      >
        Save this problem.
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        We fill in what LeetCode already knows. You only decide how it went and when to return.
      </p>

      {isLoadingContext || !isHydrated ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-muted" />
      ) : (context === null || source === null) && !isManualCapture ? (
        <EmptyCaptureState onAddQuestion={startManualCapture} />
      ) : existingProblem !== undefined && !isEditing ? (
        <AlreadyAdded
          onEdit={startEditing}
          onOpenDashboard={() => void sendExtensionMessage({ type: 'shell.open-dashboard' })}
          onRemove={() => void removeProblem(existingProblem.id)}
          onReview={() => void reviewProblemToday(existingProblem.id)}
          problem={existingProblem}
          source={source}
        />
      ) : (
        <CaptureForm
          didSave={didSave}
          isEditing={isEditing}
          isCustomDate={isCustomDate}
          note={note}
          onCancel={() => setIsEditing(false)}
          onCustomDateChange={setIsCustomDate}
          onNoteChange={setNote}
          onOutcomeChange={setOutcome}
          onReviewDateChange={setReviewDate}
          onSave={() => void save()}
          outcome={outcome}
          reviewDate={reviewDate}
          source={source}
          manualTitle={manualTitle}
          onManualTitleChange={setManualTitle}
        />
      )}
    </section>
  );
}

function SidepanelWorkspace({
  didSave,
  dueToday,
  existingProblem,
  isCustomDate,
  isEditing,
  isHydrated,
  isLoadingContext,
  isManualCapture,
  mastered,
  manualTitle,
  note,
  onCancel,
  onCustomDateChange,
  onEdit,
  onManualTitleChange,
  onNoteChange,
  onOpenDashboard,
  onOutcomeChange,
  onRemove,
  onReview,
  onReviewDateChange,
  onSave,
  onStartManualCapture,
  outcome,
  problems,
  reviewDate,
  source,
  upcomingProblems,
}: {
  didSave: boolean;
  dueToday: number;
  existingProblem?: RevisionProblem;
  isCustomDate: boolean;
  isEditing: boolean;
  isHydrated: boolean;
  isLoadingContext: boolean;
  isManualCapture: boolean;
  mastered: number;
  manualTitle: string;
  note: string;
  onCancel: () => void;
  onCustomDateChange: (value: boolean) => void;
  onEdit: () => void;
  onManualTitleChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onOpenDashboard: () => void;
  onOutcomeChange: (value: RevisionOutcome) => void;
  onRemove: () => void;
  onReview: () => void;
  onReviewDateChange: (value: string) => void;
  onSave: () => void;
  onStartManualCapture: () => void;
  outcome: RevisionOutcome;
  problems: RevisionProblem[];
  reviewDate: string;
  source: RevisionProblemSource | null;
  upcomingProblems: RevisionProblem[];
}): React.ReactNode {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const completion = problems.length === 0 ? 0 : Math.round((mastered / problems.length) * 100);

  return (
    <section className="sidepanel-workspace" id="sidepanel-workspace">
      <header className="sidepanel-header">
        <button
          aria-expanded={isMenuOpen}
          aria-label="Open side panel menu"
          className="sidepanel-icon-button"
          onClick={() => setIsMenuOpen((value) => !value)}
          type="button"
        >
          ☰
        </button>
        <div className="sidepanel-brand">
          <span className="sidepanel-brand-mark" aria-hidden="true">
            ✦
          </span>
          <div>
            <strong>DSA Coach</strong>
            <span>Local revision studio</span>
          </div>
        </div>
        <button
          aria-label="Open dashboard"
          className="sidepanel-avatar"
          onClick={onOpenDashboard}
          type="button"
        >
          A
        </button>
      </header>

      {isMenuOpen && (
        <nav className="sidepanel-menu" aria-label="Side panel menu">
          <button onClick={onStartManualCapture} type="button">
            Add question
          </button>
          <button onClick={onOpenDashboard} type="button">
            Open dashboard
          </button>
        </nav>
      )}

      <div className="sidepanel-greeting">
        <p className="sidepanel-eyebrow">Your learning space</p>
        <h1>
          Hello, Aarnav! <span aria-hidden="true">👋</span>
        </h1>
        <p>Good to see you again. Let&apos;s make one calm step forward.</p>
        <img
          alt=""
          className="sidepanel-hero-art"
          height="1536"
          src="/assets/dsa-coach-mascot.png"
          width="1024"
        />
      </div>

      <section className="sidepanel-goal-card" aria-label="Revision progress">
        <div className="sidepanel-goal-copy">
          <span className="sidepanel-check" aria-hidden="true">
            ✓
          </span>
          <div>
            <p>Revision progress</p>
            <strong>
              {mastered}/{problems.length} mastered
            </strong>
            <span>{dueToday === 0 ? 'Your queue is clear' : `${dueToday} due today`}</span>
          </div>
        </div>
        <div
          className="sidepanel-progress"
          aria-label={`${completion}% mastered`}
          role="progressbar"
        >
          <span style={{ width: `${completion}%` }} />
        </div>
      </section>

      <div className="sidepanel-section-heading">
        <h2>Quick actions</h2>
      </div>
      <div className="sidepanel-actions">
        <button onClick={onStartManualCapture} type="button">
          <span className="sidepanel-action-icon sidepanel-action-icon-mint" aria-hidden="true">
            ▤
          </span>
          <span>Add question</span>
        </button>
        <button onClick={onOpenDashboard} type="button">
          <span className="sidepanel-action-icon sidepanel-action-icon-lilac" aria-hidden="true">
            ▣
          </span>
          <span>Schedule</span>
        </button>
      </div>

      <section className="sidepanel-upcoming" aria-labelledby="sidepanel-upcoming-title">
        <div className="sidepanel-section-heading">
          <h2 id="sidepanel-upcoming-title">Upcoming reviews</h2>
          <button onClick={onOpenDashboard} type="button">
            See all
          </button>
        </div>
        {upcomingProblems.length === 0 ? (
          <p className="sidepanel-empty-copy">
            Add a question or capture one from LeetCode to start your rhythm.
          </p>
        ) : (
          <ul className="sidepanel-upcoming-list">
            {upcomingProblems.map((problem) => (
              <li key={problem.id}>
                <span className="sidepanel-task-icon" aria-hidden="true">
                  {problem.title.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <strong>{problem.title}</strong>
                  <span>Review {formatReviewDate(problem.reviewDate)}</span>
                </div>
                <em>{problem.source?.difficulty ?? '—'}</em>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="sidepanel-capture-card"
        id="sidepanel-capture"
        aria-labelledby="capture-title"
      >
        <div className="sidepanel-section-heading">
          <h2 id="capture-title">Capture a problem</h2>
          <span className="sidepanel-live-dot" aria-label="Local only" />
        </div>
        {isLoadingContext || !isHydrated ? (
          <div className="sidepanel-capture-loading" />
        ) : source === null && !isManualCapture ? (
          <EmptyCaptureState onAddQuestion={onStartManualCapture} />
        ) : existingProblem !== undefined && !isEditing ? (
          <AlreadyAdded
            onEdit={onEdit}
            onOpenDashboard={onOpenDashboard}
            onRemove={onRemove}
            onReview={onReview}
            problem={existingProblem}
            source={source}
          />
        ) : (
          <CaptureForm
            didSave={didSave}
            isEditing={isEditing}
            isCustomDate={isCustomDate}
            note={note}
            onCancel={onCancel}
            onCustomDateChange={onCustomDateChange}
            onNoteChange={onNoteChange}
            onOutcomeChange={onOutcomeChange}
            onReviewDateChange={onReviewDateChange}
            onSave={onSave}
            outcome={outcome}
            reviewDate={reviewDate}
            source={source}
            manualTitle={manualTitle}
            onManualTitleChange={onManualTitleChange}
          />
        )}
      </section>

      <nav className="sidepanel-bottom-nav" aria-label="Side panel navigation">
        <button
          className="is-active"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          type="button"
        >
          <span aria-hidden="true">⌂</span>
          Home
        </button>
        <button onClick={onStartManualCapture} type="button">
          <span aria-hidden="true">☷</span>
          Reviews
        </button>
        <button onClick={onOpenDashboard} type="button">
          <span aria-hidden="true">▦</span>
          Calendar
        </button>
        <button onClick={onOpenDashboard} type="button">
          <span aria-hidden="true">♙</span>
          Profile
        </button>
      </nav>
    </section>
  );
}

function CaptureForm({
  didSave,
  isCustomDate,
  isEditing,
  manualTitle,
  note,
  onCancel,
  onCustomDateChange,
  onManualTitleChange,
  onNoteChange,
  onOutcomeChange,
  onReviewDateChange,
  onSave,
  outcome,
  reviewDate,
  source,
}: {
  didSave: boolean;
  isCustomDate: boolean;
  isEditing: boolean;
  manualTitle: string;
  note: string;
  onCancel: () => void;
  onCustomDateChange: (isCustom: boolean) => void;
  onManualTitleChange: (title: string) => void;
  onNoteChange: (note: string) => void;
  onOutcomeChange: (outcome: RevisionOutcome) => void;
  onReviewDateChange: (reviewDate: string) => void;
  onSave: () => void;
  outcome: RevisionOutcome;
  reviewDate: string;
  source: RevisionProblemSource | null;
}): React.ReactNode {
  const isManualEntry = source === null;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
      {source === null ? (
        <label className="block text-sm font-semibold" htmlFor="quick-capture-title">
          Question title
          <input
            autoFocus
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-base font-normal outline-none transition placeholder:text-muted-foreground focus:border-info focus:ring-2 focus:ring-info/20"
            id="quick-capture-title"
            onChange={(event) => onManualTitleChange(event.target.value)}
            placeholder="e.g. Two Sum"
            value={manualTitle}
          />
          <span className="mt-2 block text-xs font-normal leading-5 text-muted-foreground">
            Saved locally. You can optionally add it from outside LeetCode.
          </span>
        </label>
      ) : (
        <ProblemSummary source={source} />
      )}
      <fieldset className="mt-6">
        <legend className="text-sm font-semibold">Understanding level</legend>
        <div className="mt-3 space-y-1">
          {revisionOutcomes.map((option) => (
            <label
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                outcome === option ? 'bg-info/10 text-foreground' : 'hover:bg-muted',
              )}
              key={option}
            >
              <input
                checked={outcome === option}
                className="size-4 accent-[var(--color-info)]"
                name="quick-capture-outcome"
                onChange={() => onOutcomeChange(option)}
                type="radio"
                value={option}
              />
              <span className={cn('size-2.5 rounded-full', outcomeColorClass(option))} />
              <span className="flex-1 text-sm font-medium">
                {revisionOutcomeCopy[option].label}
              </span>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {revisionOutcomeCopy[option].description}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold">Review again</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {reviewOptions.map((option) => {
            const optionDate = reviewDateFromToday(option.days);
            const isSelected = !isCustomDate && reviewDate === optionDate;
            return (
              <button
                aria-pressed={isSelected}
                className={scheduleButtonClass(isSelected)}
                key={option.days}
                onClick={() => {
                  onReviewDateChange(optionDate);
                  onCustomDateChange(false);
                }}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
          <button
            aria-pressed={isCustomDate}
            className={scheduleButtonClass(isCustomDate)}
            onClick={() => onCustomDateChange(true)}
            type="button"
          >
            Custom
          </button>
        </div>
        {isCustomDate && (
          <input
            aria-label="Custom review date"
            className="mt-3 h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-info focus:ring-2 focus:ring-info/20"
            min={today()}
            onChange={(event) => onReviewDateChange(event.target.value)}
            type="date"
            value={reviewDate}
          />
        )}
      </fieldset>

      <label className="mt-6 block text-sm font-semibold" htmlFor="quick-capture-note">
        Note <span className="font-normal text-muted-foreground">(optional)</span>
        <textarea
          className="mt-2 min-h-20 w-full resize-y rounded-xl border border-border bg-background p-3 text-sm font-normal outline-none transition placeholder:text-muted-foreground focus:border-info focus:ring-2 focus:ring-info/20"
          id="quick-capture-note"
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="What would you like to remember?"
          value={note}
        />
      </label>

      <div className="quick-capture-submit-row mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
        <p aria-live="polite" className="text-sm text-success">
          {didSave
            ? 'Saved to your revision library.'
            : `Review on ${formatReviewDate(reviewDate)}.`}
        </p>
        <div className="flex gap-2">
          {isEditing && (
            <Button onClick={onCancel} variant="ghost">
              Cancel
            </Button>
          )}
          <Button
            className="quick-capture-submit-button"
            disabled={isManualEntry && manualTitle.trim() === ''}
            onClick={onSave}
          >
            {isEditing ? 'Save changes' : 'Add question to reviews'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AlreadyAdded({
  onEdit,
  onOpenDashboard,
  onRemove,
  onReview,
  problem,
  source,
}: {
  onEdit: () => void;
  onOpenDashboard: () => void;
  onRemove: () => void;
  onReview: () => void;
  problem: { outcome: RevisionOutcome; reviewDate: string };
  source: RevisionProblemSource;
}): React.ReactNode {
  return (
    <div className="mt-6 rounded-2xl border border-success/35 bg-success/10 p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-success text-xs font-bold text-success-foreground"
        >
          ✓
        </span>
        <div className="min-w-0">
          <p className="font-semibold">Already added</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {source.title} is scheduled for {formatReviewDate(problem.reviewDate)}.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={onReview} variant="secondary">
          Review today
        </Button>
        <Button onClick={onEdit} variant="secondary">
          Edit
        </Button>
        <Button onClick={onOpenDashboard} variant="secondary">
          Dashboard
        </Button>
        <Button onClick={onRemove} variant="ghost">
          Remove
        </Button>
      </div>
    </div>
  );
}

function EmptyCaptureState({ onAddQuestion }: { onAddQuestion: () => void }): React.ReactNode {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center">
      <p className="font-medium">Capture from LeetCode or add one yourself.</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        On LeetCode, DSA Coach fills in the problem metadata. Elsewhere, add a question title and
        set its next review.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button onClick={onAddQuestion}>Add question</Button>
        <Button
          onClick={() => void sendExtensionMessage({ type: 'shell.open-dashboard' })}
          variant="secondary"
        >
          Open dashboard
        </Button>
      </div>
    </div>
  );
}

function ProblemSummary({ source }: { source: RevisionProblemSource }): React.ReactNode {
  return (
    <div className="rounded-xl bg-muted px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Detected on LeetCode
      </p>
      <p className="mt-1 font-semibold tracking-tight">{source.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        #{source.problemId} ·{' '}
        <span className={difficultyColorClass(source.difficulty)}>{source.difficulty}</span>
      </p>
    </div>
  );
}

function toRevisionSource(context: ProblemContext): RevisionProblemSource {
  return { ...context };
}

function scheduleButtonClass(isSelected: boolean): string {
  return cn(
    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info',
    isSelected
      ? 'border-info bg-info text-info-foreground'
      : 'border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground',
  );
}

function outcomeColorClass(outcome: RevisionOutcome): string {
  return {
    mastered: 'bg-success',
    understood: 'bg-info',
    'needed-hint': 'bg-warning',
    'saw-solution': 'bg-warning-dark',
    'couldnt-solve': 'bg-error',
  }[outcome];
}

function difficultyColorClass(difficulty: RevisionProblemSource['difficulty']): string {
  return {
    Easy: 'text-success',
    Medium: 'text-warning-dark',
    Hard: 'text-error',
  }[difficulty];
}

function formatReviewDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) return value;

  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(
    new Date(year, month - 1, day),
  );
}
