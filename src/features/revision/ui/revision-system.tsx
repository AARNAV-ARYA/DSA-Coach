import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { ProblemAnalysisWorkspace } from '@/features/ai/ui/problem-analysis-workspace';
import {
  revisionStorageKey,
  reviewDateFromToday,
  today,
  useRevisionStore,
} from '@/features/revision/model/revision-store';
import {
  revisionOutcomeCopy,
  revisionOutcomes,
  type RevisionOutcome,
  type RevisionProblem,
} from '@/features/revision/model/revision-types';
import { cn } from '@/shared/lib/cn';
import { sendExtensionMessage } from '@/shared/lib/messaging/client';

type DifficultyFilter = 'all' | 'Easy' | 'Medium' | 'Hard' | 'Unclassified';
type DateFilter = 'all' | 'today' | 'upcoming';

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function RevisionSystem(): React.ReactNode {
  const problems = useRevisionStore((state) => state.problems);
  const isHydrated = useRevisionStore((state) => state.isHydrated);
  const hydrate = useRevisionStore((state) => state.hydrate);
  const snoozeProblem = useRevisionStore((state) => state.snoozeProblem);
  const completeProblem = useRevisionStore((state) => state.completeProblem);
  const skipProblem = useRevisionStore((state) => state.skipProblem);
  const removeProblem = useRevisionStore((state) => state.removeProblem);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [outcome, setOutcome] = useState<'all' | RevisionOutcome>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activeView, setActiveView] = useState<'overview' | 'analysis'>('overview');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (typeof chrome === 'undefined' || chrome.storage?.onChanged === undefined) return;

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ): void => {
      if (areaName === 'local' && changes[revisionStorageKey] !== undefined) void hydrate();
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [hydrate]);

  const currentDate = today();
  const visibleProblems = useMemo(
    () =>
      problems.filter((problem) => {
        const matchesSearch = problem.title.toLowerCase().includes(search.trim().toLowerCase());
        const matchesDifficulty = difficulty === 'all' || getDifficulty(problem) === difficulty;
        const matchesOutcome = outcome === 'all' || problem.outcome === outcome;
        const matchesDateFilter =
          dateFilter === 'all' ||
          (dateFilter === 'today' && problem.reviewDate <= currentDate) ||
          (dateFilter === 'upcoming' && problem.reviewDate > currentDate);
        const matchesCalendarDate = selectedDate === null || problem.reviewDate === selectedDate;

        return (
          matchesSearch &&
          matchesDifficulty &&
          matchesOutcome &&
          matchesDateFilter &&
          matchesCalendarDate
        );
      }),
    [currentDate, dateFilter, difficulty, outcome, problems, search, selectedDate],
  );
  const todaysReviews = visibleProblems.filter((problem) => problem.reviewDate <= currentDate);
  const upcomingReviews = visibleProblems
    .filter((problem) => problem.reviewDate > currentDate)
    .slice(0, 5);
  const recentProblems = [...visibleProblems]
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .slice(0, 5);
  const difficultyDistribution = getDifficultyDistribution(problems);
  const calendarDays = getCalendarDays(currentDate, problems);
  const dashboardStyle = {
    '--dashboard-tilt-x': `${tilt.x}deg`,
    '--dashboard-tilt-y': `${tilt.y}deg`,
  } as CSSProperties;

  function updateTilt(event: React.PointerEvent<HTMLElement>): void {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientY - bounds.top) / bounds.height - 0.5) * -2;
    const y = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    setTilt({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
  }

  function completeReview(problemId: string): void {
    const problem = problems.find((item) => item.id === problemId);
    if (problem === undefined) return;

    const nextReviewDate = reviewDateFromToday(30);
    void completeProblem(problemId).then(() =>
      sendExtensionMessage({
        type: 'review.completed',
        title: problem.title,
        nextReviewDate,
      }),
    );
  }

  const dueToday = problems.filter((problem) => problem.reviewDate <= currentDate).length;
  const mastered = problems.filter((problem) => problem.outcome === 'mastered').length;
  const scheduled = problems.filter((problem) => problem.reviewDate > currentDate).length;

  return (
    <section className="dashboard-scene pt-6 sm:pt-10" style={dashboardStyle}>
      <div className="dashboard-sky-decor" aria-hidden="true">
        <span className="dashboard-cloud dashboard-cloud-one" />
        <span className="dashboard-cloud dashboard-cloud-two" />
        <span className="dashboard-cloud dashboard-cloud-three" />
        <span className="dashboard-pixel-spark dashboard-pixel-spark-one" />
        <span className="dashboard-pixel-spark dashboard-pixel-spark-two" />
      </div>
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar dashboard-glass" aria-label="Dashboard navigation">
          <div className="dashboard-sidebar-brand">
            <span className="dashboard-brand-mark" aria-hidden="true">
              ✦
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">DSA Coach</p>
              <p className="text-xs text-muted-foreground">Revision studio</p>
            </div>
          </div>
          <nav className="dashboard-sidebar-nav">
            <button
              className={cn(
                'dashboard-nav-link',
                activeView === 'overview' && 'dashboard-nav-link-active',
              )}
              onClick={() => setActiveView('overview')}
              type="button"
            >
              <span aria-hidden="true">⌂</span> Overview
            </button>
            <a
              className="dashboard-nav-link"
              href="#today"
              onClick={() => setActiveView('overview')}
            >
              <span aria-hidden="true">◷</span> Reviews
              {dueToday > 0 && <b>{dueToday}</b>}
            </a>
            <a
              className="dashboard-nav-link"
              href="#analytics"
              onClick={() => setActiveView('overview')}
            >
              <span aria-hidden="true">◒</span> Analytics
            </a>
            <a
              className="dashboard-nav-link"
              href="#calendar"
              onClick={() => setActiveView('overview')}
            >
              <span aria-hidden="true">▦</span> Calendar
            </a>
            <button
              className={cn(
                'dashboard-nav-link',
                activeView === 'analysis' && 'dashboard-nav-link-active',
              )}
              onClick={() => setActiveView('analysis')}
              type="button"
            >
              <span aria-hidden="true">✧</span> Analysis
            </button>
          </nav>
          <div className="dashboard-sidebar-note">
            <span className="dashboard-note-spark" aria-hidden="true">
              ✧
            </span>
            <p className="font-medium">Small steps, daily.</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Your next review is the only thing you need to solve right now.
            </p>
          </div>
        </aside>

        <div className="dashboard-main">
          <header className="dashboard-topbar">
            <div>
              <p className="dashboard-kicker">{formatTodayLabel(currentDate)}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
                {activeView === 'analysis' ? 'Your analysis.' : 'Good morning.'}
              </h1>
            </div>
            <div className="dashboard-topbar-actions">
              <span className="dashboard-status-dot" aria-hidden="true" />
              <span className="dashboard-local-label hidden text-sm text-muted-foreground sm:inline">
                Local workspace
              </span>
              <span className="dashboard-avatar" aria-label="DSA Coach profile">
                A
              </span>
            </div>
          </header>

          {activeView === 'analysis' && <ProblemAnalysisWorkspace problems={problems} />}

          <div hidden={activeView === 'analysis'}>
            <section
              className="dashboard-hero"
              id="overview"
              onPointerLeave={() => setTilt({ x: 0, y: 0 })}
              onPointerMove={updateTilt}
            >
              <div className="dashboard-hero-copy">
                <p className="dashboard-kicker dashboard-hero-kicker">Your learning space</p>
                <h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">
                  Make progress feel visible.
                </h2>
                <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
                  A soft, focused view of what needs your attention, what is coming next, and how
                  your practice is taking shape.
                </p>
                <button
                  className="dashboard-primary-button mt-6"
                  onClick={() =>
                    document.getElementById('today')?.scrollIntoView({ behavior: 'smooth' })
                  }
                  type="button"
                >
                  Open today&apos;s reviews <span aria-hidden="true">↗</span>
                </button>
              </div>
              <div className="dashboard-hero-cosmos" aria-hidden="true">
                <div className="dashboard-hero-orbit dashboard-hero-orbit-one" />
                <div className="dashboard-hero-orbit dashboard-hero-orbit-two" />
                <img
                  alt=""
                  className="dashboard-hero-asset"
                  height="1024"
                  src="/assets/dashboard-retro-computer.png"
                  width="1536"
                />
                <div className="dashboard-hero-orb">
                  <span>DSA</span>
                </div>
                <div className="dashboard-hero-satellite dashboard-hero-satellite-one" />
                <div className="dashboard-hero-satellite dashboard-hero-satellite-two" />
                <div className="dashboard-hero-starfield" />
              </div>
              <div className="dashboard-hero-float dashboard-hero-float-one" aria-hidden="true">
                <span>Focus</span>
                <strong>{dueToday === 0 ? 'Clear' : `${dueToday} due`}</strong>
              </div>
              <div className="dashboard-hero-float dashboard-hero-float-two" aria-hidden="true">
                <span>Momentum</span>
                <strong>{mastered > 0 ? `${mastered} mastered` : 'Begin today'}</strong>
              </div>
            </section>

            <section className="dashboard-stat-grid" aria-label="Learning snapshot">
              <DashboardStat
                eyebrow="Due today"
                value={dueToday}
                detail="Keep the queue light"
                tone="violet"
              />
              <DashboardStat
                eyebrow="In your library"
                value={problems.length}
                detail="Problems captured"
                tone="cyan"
              />
              <DashboardStat
                eyebrow="Scheduled ahead"
                value={scheduled}
                detail="Future review dates"
                tone="amber"
              />
              <DashboardStat
                eyebrow="Mastered"
                value={mastered}
                detail="Confidence logged"
                tone="coral"
              />
            </section>

            <section
              aria-label="Search and filters"
              className="dashboard-glass dashboard-toolbar"
              id="reviews"
            >
              <label className="dashboard-search-field">
                <span className="dashboard-search-icon" aria-hidden="true">
                  ⌕
                </span>
                <span className="sr-only">Search problems</span>
                <input
                  className="dashboard-input"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search your problems"
                  type="search"
                  value={search}
                />
              </label>
              <div className="dashboard-filter-row">
                <FilterSelect
                  label="When"
                  onChange={(value) => setDateFilter(value as DateFilter)}
                  value={dateFilter}
                >
                  <option value="all">All dates</option>
                  <option value="today">Due today</option>
                  <option value="upcoming">Upcoming</option>
                </FilterSelect>
                <FilterSelect
                  label="Difficulty"
                  onChange={(value) => setDifficulty(value as DifficultyFilter)}
                  value={difficulty}
                >
                  <option value="all">All difficulty</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Unclassified">Unclassified</option>
                </FilterSelect>
                <FilterSelect
                  label="Understanding"
                  onChange={(value) => setOutcome(value as 'all' | RevisionOutcome)}
                  value={outcome}
                >
                  <option value="all">All outcomes</option>
                  {revisionOutcomes.map((item) => (
                    <option key={item} value={item}>
                      {revisionOutcomeCopy[item].label}
                    </option>
                  ))}
                </FilterSelect>
                {selectedDate !== null && (
                  <button
                    className="dashboard-filter-button"
                    onClick={() => setSelectedDate(null)}
                    type="button"
                  >
                    Clear day
                  </button>
                )}
              </div>
            </section>

            {!isHydrated ? (
              <div className="mt-6 h-96 animate-pulse rounded-3xl bg-muted" />
            ) : (
              <>
                <div className="dashboard-content-grid dashboard-content-grid-primary">
                  <SectionCard
                    id="today"
                    title="Today's reviews"
                    subtitle="The smallest useful next step."
                    accent="violet"
                  >
                    {todaysReviews.length === 0 ? (
                      <EmptyState message="Nothing is due today. Your review queue is clear." />
                    ) : (
                      <ProblemList
                        onComplete={completeReview}
                        onRemove={(id) => void removeProblem(id)}
                        onSkip={(id) => void skipProblem(id)}
                        onSnooze={(id) => void snoozeProblem(id)}
                        problems={todaysReviews}
                        showReviewActions
                      />
                    )}
                  </SectionCard>
                  <SectionCard
                    id="upcoming"
                    title="Upcoming reviews"
                    subtitle="Keep the rhythm visible."
                    accent="cyan"
                  >
                    {upcomingReviews.length === 0 ? (
                      <EmptyState message="No future reviews scheduled yet." />
                    ) : (
                      <ProblemList
                        onRemove={(id) => void removeProblem(id)}
                        problems={upcomingReviews}
                        compact
                      />
                    )}
                  </SectionCard>
                </div>

                <div className="dashboard-content-grid" id="analytics">
                  <SectionCard
                    title="Difficulty distribution"
                    subtitle="Detected LeetCode difficulty across your library."
                    accent="amber"
                  >
                    <DistributionChart items={difficultyDistribution} />
                  </SectionCard>
                  <SectionCard
                    title="Pattern distribution"
                    subtitle="Patterns stay evidence-based."
                    accent="coral"
                  >
                    <div className="dashboard-empty-visual">
                      <span className="dashboard-empty-orb" aria-hidden="true">
                        ◌
                      </span>
                      <p className="mt-4 font-medium">No pattern data yet</p>
                      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                        This adapter currently captures only problem metadata. Pattern charts will
                        appear when verified tags are available.
                      </p>
                    </div>
                  </SectionCard>
                </div>

                <div
                  className="dashboard-content-grid dashboard-content-grid-secondary"
                  id="calendar"
                >
                  <SectionCard
                    title="Revision calendar"
                    subtitle={
                      selectedDate === null
                        ? 'Select a date to focus the dashboard.'
                        : `Showing ${formatLongDate(selectedDate)}.`
                    }
                    accent="cyan"
                  >
                    <CalendarGrid
                      days={calendarDays}
                      onSelect={setSelectedDate}
                      selectedDate={selectedDate}
                    />
                  </SectionCard>
                  <SectionCard
                    title="Recently added"
                    subtitle="Your latest commitments."
                    accent="violet"
                  >
                    {recentProblems.length === 0 ? (
                      <EmptyState message="Captured problems will appear here." />
                    ) : (
                      <ProblemList
                        onRemove={(id) => void removeProblem(id)}
                        problems={recentProblems}
                        compact
                        showAddedDate
                      />
                    )}
                  </SectionCard>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <img
        alt=""
        className="dashboard-adventurer-crew"
        height="1024"
        hidden={activeView === 'analysis'}
        src="/assets/dashboard-adventurer-crew.png"
        width="1536"
      />
    </section>
  );
}

function DashboardStat({
  detail,
  eyebrow,
  tone,
  value,
}: {
  detail: string;
  eyebrow: string;
  tone: 'amber' | 'coral' | 'cyan' | 'violet';
  value: number;
}): React.ReactNode {
  return (
    <article className={cn('dashboard-stat-card', `dashboard-stat-card-${tone}`)}>
      <div className="dashboard-stat-card-top">
        <span>{eyebrow}</span>
        <span className="dashboard-stat-glyph" aria-hidden="true">
          ✦
        </span>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function SectionCard({
  children,
  id,
  subtitle,
  title,
  accent = 'violet',
}: React.PropsWithChildren<{
  accent?: 'amber' | 'coral' | 'cyan' | 'violet';
  id?: string;
  subtitle: string;
  title: string;
}>): React.ReactNode {
  return (
    <section
      className={cn('dashboard-glass dashboard-section-card', `dashboard-section-card-${accent}`)}
      id={id}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function FilterSelect({
  children,
  label,
  onChange,
  value,
}: React.PropsWithChildren<{
  label: string;
  onChange: (value: string) => void;
  value: string;
}>): React.ReactNode {
  return (
    <label className="sr-only">
      {label}
      <select
        className="dashboard-select not-sr-only"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function ProblemList({
  compact = false,
  onComplete,
  onRemove,
  onSkip,
  onSnooze,
  problems,
  showReviewActions = false,
  showAddedDate = false,
}: {
  compact?: boolean;
  onComplete?: (id: string) => void;
  onRemove?: (id: string) => void;
  onSkip?: (id: string) => void;
  onSnooze?: (id: string) => void;
  problems: RevisionProblem[];
  showReviewActions?: boolean;
  showAddedDate?: boolean;
}): React.ReactNode {
  return (
    <ul className="dashboard-problem-list">
      {problems.map((problem) => {
        const rowContent = (
          <>
            <span
              aria-hidden="true"
              className={cn('dashboard-problem-icon', outcomeColorClass(problem.outcome))}
            >
              {problem.title.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{problem.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {revisionOutcomeCopy[problem.outcome].label} ·{' '}
                {showAddedDate
                  ? `Added ${formatShortDate(problem.createdAt)}`
                  : `Review ${formatShortDate(problem.reviewDate)}`}
              </p>
            </div>
            {!compact && <DifficultyBadge difficulty={getDifficulty(problem)} />}
            <span className="dashboard-row-arrow" aria-hidden="true">
              ↗
            </span>
          </>
        );

        return (
          <li className="dashboard-problem-item" key={problem.id}>
            {problem.source?.url ? (
              <a
                aria-label={`Open ${problem.title} on LeetCode`}
                className="dashboard-problem-row dashboard-problem-link"
                href={problem.source.url}
                rel="noreferrer"
                target="_blank"
              >
                {rowContent}
              </a>
            ) : (
              <div className="dashboard-problem-row">{rowContent}</div>
            )}
            {(showReviewActions || onRemove !== undefined) && (
              <div className="dashboard-review-actions" aria-label={`Actions for ${problem.title}`}>
                <button onClick={() => onSnooze?.(problem.id)} type="button">
                  Snooze
                </button>
                <button onClick={() => onSkip?.(problem.id)} type="button">
                  Skip
                </button>
                <button onClick={() => onComplete?.(problem.id)} type="button">
                  Completed
                </button>
                {onRemove !== undefined && (
                  <button
                    aria-label={`Remove ${problem.title}`}
                    className="dashboard-remove-action"
                    onClick={() => {
                      if (
                        globalThis.confirm(`Remove “${problem.title}” from your revision library?`)
                      ) {
                        onRemove(problem.id);
                      }
                    }}
                    type="button"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: DifficultyFilter }): React.ReactNode {
  if (difficulty === 'all') return null;
  return (
    <span className={cn('dashboard-difficulty-badge', difficultyColorClass(difficulty))}>
      {difficulty}
    </span>
  );
}

function DistributionChart({
  items,
}: {
  items: Array<{ label: DifficultyFilter; value: number }>;
}): React.ReactNode {
  const maximum = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className="space-y-4" role="img" aria-label="Difficulty distribution chart">
      {items
        .filter((item) => item.label !== 'all')
        .map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm">
              <span>{item.label}</span>
              <span className="text-muted-foreground">{item.value}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  difficultyBarClass(item.label),
                )}
                style={{ width: `${(item.value / maximum) * 100}%` }}
              />
            </div>
          </div>
        ))}
    </div>
  );
}

function CalendarGrid({
  days,
  onSelect,
  selectedDate,
}: {
  days: CalendarDay[];
  onSelect: (date: string) => void;
  selectedDate: string | null;
}): React.ReactNode {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {weekdayLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <button
            aria-label={`${formatLongDate(day.date)}${day.reviewCount === 0 ? '' : `, ${day.reviewCount} reviews`}`}
            aria-pressed={selectedDate === day.date}
            className={cn(
              'calendar-day',
              day.isCurrentMonth ? '' : 'calendar-day-outside',
              day.isToday ? 'calendar-day-today' : '',
              selectedDate === day.date ? 'calendar-day-selected' : '',
            )}
            key={day.date}
            onClick={() => onSelect(day.date)}
            type="button"
          >
            <span>{day.dayOfMonth}</span>
            {day.reviewCount > 0 && <i className="calendar-day-count">{day.reviewCount}</i>}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }): React.ReactNode {
  return <p className="py-9 text-center text-sm leading-6 text-muted-foreground">{message}</p>;
}

interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  reviewCount: number;
}

function getCalendarDays(referenceDate: string, problems: RevisionProblem[]): CalendarDay[] {
  const [year, month] = referenceDate.split('-').map(Number);
  if (year === undefined || month === undefined) return [];
  const current = new Date(year, month - 1, 1);
  const firstWeekday = (current.getDay() + 6) % 7;
  const calendarStart = new Date(year, month - 1, 1 - firstWeekday);
  const counts = new Map<string, number>();
  problems.forEach((problem) =>
    counts.set(problem.reviewDate, (counts.get(problem.reviewDate) ?? 0) + 1),
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    const dateValue = toDateValue(date);
    return {
      date: dateValue,
      dayOfMonth: date.getDate(),
      isCurrentMonth: date.getMonth() === current.getMonth(),
      isToday: dateValue === referenceDate,
      reviewCount: counts.get(dateValue) ?? 0,
    };
  });
}

function getDifficultyDistribution(
  problems: RevisionProblem[],
): Array<{ label: DifficultyFilter; value: number }> {
  const levels: DifficultyFilter[] = ['Easy', 'Medium', 'Hard', 'Unclassified'];
  return levels.map((label) => ({
    label,
    value: problems.filter((problem) => getDifficulty(problem) === label).length,
  }));
}

function getDifficulty(problem: RevisionProblem): Exclude<DifficultyFilter, 'all'> {
  return problem.source?.difficulty ?? 'Unclassified';
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

function difficultyColorClass(difficulty: DifficultyFilter): string {
  return {
    Easy: 'bg-success/10 text-success',
    Medium: 'bg-warning/15 text-warning-dark',
    Hard: 'bg-error/10 text-error',
    Unclassified: 'bg-muted text-muted-foreground',
    all: 'bg-muted text-muted-foreground',
  }[difficulty];
}

function difficultyBarClass(difficulty: DifficultyFilter): string {
  return {
    Easy: 'bg-success',
    Medium: 'bg-warning',
    Hard: 'bg-error',
    Unclassified: 'bg-info',
    all: 'bg-info',
  }[difficulty];
}

function toDateValue(date: Date): string {
  const offset = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offset.toISOString().slice(0, 10);
}

function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(
    new Date(`${value.length === 10 ? value : value.slice(0, 10)}T12:00:00`),
  );
}

function formatTodayLabel(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date(`${value}T12:00:00`));
}

function formatLongDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}
