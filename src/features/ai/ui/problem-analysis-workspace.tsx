import { useEffect, useMemo, useState } from 'react';
import { prepareAiAccess } from '@/features/ai/lib/ai-client';
import type { AiInsights } from '@/features/ai/model/ai-contracts';
import {
  problemAnalysisStorageKey,
  useProblemAnalysisStore,
  type ProblemAnalysisRecord,
} from '@/features/ai/model/problem-analysis-store';
import { AiInsightsEditor } from '@/features/ai/ui/ai-coach-workspace';
import type { RevisionProblem } from '@/features/revision/model/revision-types';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/cn';

export function ProblemAnalysisWorkspace({
  problems,
}: {
  problems: RevisionProblem[];
}): React.ReactNode {
  const records = useProblemAnalysisStore((state) => state.records);
  const isHydrated = useProblemAnalysisStore((state) => state.isHydrated);
  const hydrate = useProblemAnalysisStore((state) => state.hydrate);
  const analyzeProblem = useProblemAnalysisStore((state) => state.analyzeProblem);
  const updateSourceCode = useProblemAnalysisStore((state) => state.updateSourceCode);
  const updateInsights = useProblemAnalysisStore((state) => state.updateInsights);
  const sortedProblems = useMemo(
    () => [...problems].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [problems],
  );
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [codeDrafts, setCodeDrafts] = useState<Record<string, string>>({});
  const [insightDrafts, setInsightDrafts] = useState<Record<string, AiInsights>>({});
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (typeof chrome === 'undefined' || chrome.storage?.onChanged === undefined) return;
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ): void => {
      if (areaName === 'local' && changes[problemAnalysisStorageKey] !== undefined) void hydrate();
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [hydrate]);

  const activeProblemId = sortedProblems.some((problem) => problem.id === selectedProblemId)
    ? selectedProblemId
    : (sortedProblems[0]?.id ?? null);
  const selectedProblem = sortedProblems.find((problem) => problem.id === activeProblemId);
  const selectedRecord = records.find((record) => record.problemId === activeProblemId);
  const codeDraft =
    activeProblemId === null
      ? ''
      : (codeDrafts[activeProblemId] ?? selectedRecord?.sourceCode ?? '');
  const insightDraft =
    activeProblemId === null
      ? undefined
      : (insightDrafts[activeProblemId] ?? selectedRecord?.insights);

  const generate = async (): Promise<void> => {
    if (selectedProblem?.source === undefined) return;
    setStatus(null);
    try {
      await prepareAiAccess();
      if (activeProblemId !== null) {
        setInsightDrafts((current) => {
          const next = { ...current };
          delete next[activeProblemId];
          return next;
        });
      }
      await analyzeProblem(selectedProblem, codeDraft);
      setStatus('Analysis request completed.');
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : 'AI access could not be enabled.');
    }
  };

  const saveEdits = async (): Promise<void> => {
    if (activeProblemId === null || insightDraft === undefined) return;
    await updateSourceCode(activeProblemId, codeDraft);
    await updateInsights(activeProblemId, () => insightDraft);
    setStatus('Your edited analysis was saved locally.');
  };

  if (!isHydrated) {
    return <div className="mt-8 h-96 animate-pulse rounded-3xl bg-muted" />;
  }

  return (
    <section className="analysis-page" aria-labelledby="analysis-page-title">
      <div className="analysis-page-heading">
        <div>
          <p className="dashboard-kicker">AI learning library</p>
          <h2 id="analysis-page-title">Every solve, organized into understanding.</h2>
          <p>
            Questions are ordered by when you added them. Select one to review your code and move
            from brute force to the cleanest optimal solution.
          </p>
        </div>
        <span className="analysis-privacy-pill">Local records · explicit AI consent</span>
      </div>

      {sortedProblems.length === 0 ? (
        <div className="analysis-empty">
          <span aria-hidden="true">✧</span>
          <h3>No questions yet</h3>
          <p>Add a LeetCode question from the bottom-right capture button to begin.</p>
        </div>
      ) : (
        <div className="analysis-layout">
          <aside className="analysis-list" aria-label="Questions by latest added">
            <div className="analysis-list-heading">
              <strong>Latest questions</strong>
              <span>{sortedProblems.length}</span>
            </div>
            <div className="analysis-list-items">
              {sortedProblems.map((problem) => {
                const record = records.find((candidate) => candidate.problemId === problem.id);
                return (
                  <button
                    className={cn(
                      'analysis-list-item',
                      problem.id === activeProblemId && 'analysis-list-item-active',
                    )}
                    key={problem.id}
                    onClick={() => {
                      setSelectedProblemId(problem.id);
                      setStatus(null);
                    }}
                    type="button"
                  >
                    <span className="analysis-list-icon" aria-hidden="true">
                      {problem.title.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="analysis-list-copy">
                      <strong>{problem.title}</strong>
                      <small>
                        {formatAddedDate(problem.createdAt)} ·{' '}
                        {problem.source?.difficulty ?? 'Manual'}
                      </small>
                    </span>
                    <AnalysisStatus {...(record === undefined ? {} : { status: record.status })} />
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="analysis-detail">
            {selectedProblem !== undefined && (
              <>
                <header className="analysis-detail-header">
                  <div>
                    <div className="analysis-detail-meta">
                      <span>{selectedProblem.source?.difficulty ?? 'Manual question'}</span>
                      <span>Added {formatAddedDate(selectedProblem.createdAt)}</span>
                    </div>
                    <h3>{selectedProblem.title}</h3>
                  </div>
                  {selectedProblem.source !== undefined && (
                    <a href={selectedProblem.source.url} rel="noreferrer" target="_blank">
                      Open on LeetCode ↗
                    </a>
                  )}
                </header>

                {selectedProblem.source === undefined ? (
                  <AnalysisNotice
                    copy="This manually added question has no verified LeetCode URL or difficulty, so automatic AI analysis is unavailable. Add it from its LeetCode page to analyze code safely."
                    title="Verified problem context needed"
                  />
                ) : (
                  <>
                    <section className="analysis-code-card" aria-labelledby="your-code-title">
                      <div className="analysis-section-heading">
                        <div>
                          <p className="dashboard-kicker">Private input</p>
                          <h4 id="your-code-title">Your submitted code</h4>
                        </div>
                        <span>Saved locally</span>
                      </div>
                      <textarea
                        aria-label="Your submitted solution code"
                        onChange={(event) => {
                          if (activeProblemId === null) return;
                          setCodeDrafts((current) => ({
                            ...current,
                            [activeProblemId]: event.target.value,
                          }));
                        }}
                        placeholder="If LeetCode could not expose the editor, paste your solution here."
                        spellCheck={false}
                        value={codeDraft}
                      />
                      <div className="analysis-code-actions">
                        <p>Only sent to Groq when you press Analyze or Regenerate on this page.</p>
                        <Button
                          disabled={
                            selectedRecord?.status === 'generating' || codeDraft.trim() === ''
                          }
                          onClick={() => void generate()}
                        >
                          {selectedRecord?.status === 'generating'
                            ? 'Analyzing…'
                            : selectedRecord?.insights === undefined
                              ? 'Analyze solution'
                              : 'Regenerate analysis'}
                        </Button>
                      </div>
                    </section>

                    {selectedRecord?.status === 'generating' && (
                      <AnalysisNotice
                        copy="Your question is already saved. The AI is preparing the code review, solution progression, example, and visual flow."
                        title="Analysis in progress"
                      />
                    )}
                    {(selectedRecord?.status === 'failed' ||
                      selectedRecord?.status === 'needs-code') && (
                      <AnalysisNotice
                        {...(codeDraft.trim() === ''
                          ? {}
                          : {
                              action: () => void generate(),
                              actionLabel: 'Retry',
                            })}
                        copy={selectedRecord.error ?? 'The analysis could not be generated.'}
                        title={
                          selectedRecord.status === 'needs-code' ? 'Code needed' : 'Analysis paused'
                        }
                      />
                    )}
                    {insightDraft !== undefined && (
                      <AiInsightsEditor
                        insights={insightDraft}
                        onChange={(updater) => {
                          if (activeProblemId === null) return;
                          setInsightDrafts((current) => ({
                            ...current,
                            [activeProblemId]: updater(current[activeProblemId] ?? insightDraft),
                          }));
                        }}
                        onSave={() => void saveEdits()}
                        saveLabel="Save analysis edits"
                      />
                    )}
                    {selectedRecord === undefined && (
                      <AnalysisNotice
                        copy="This question was added before automatic analysis was enabled. Paste or confirm your code above, then analyze it."
                        title="Ready when you are"
                      />
                    )}
                    {status !== null && (
                      <p className="analysis-save-status" aria-live="polite">
                        {status}
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function AnalysisStatus({ status }: { status?: ProblemAnalysisRecord['status'] }): React.ReactNode {
  return (
    <span className={cn('analysis-status', status && `analysis-status-${status}`)}>
      {status === 'ready'
        ? 'Ready'
        : status === 'generating'
          ? 'Working'
          : status === 'failed'
            ? 'Retry'
            : status === 'needs-code'
              ? 'Code'
              : 'New'}
    </span>
  );
}

function AnalysisNotice({
  title,
  copy,
  action,
  actionLabel,
}: {
  title: string;
  copy: string;
  action?: () => void;
  actionLabel?: string;
}): React.ReactNode {
  return (
    <div className="analysis-notice">
      <div>
        <strong>{title}</strong>
        <p>{copy}</p>
      </div>
      {action !== undefined && actionLabel !== undefined && (
        <Button onClick={action} variant="secondary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

function formatAddedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(date);
}
