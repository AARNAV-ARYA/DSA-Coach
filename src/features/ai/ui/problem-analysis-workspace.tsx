import { useEffect, useMemo, useState } from 'react';
import { prepareAiAccess } from '@/features/ai/lib/ai-client';
import type { AiInsights } from '@/features/ai/model/ai-contracts';
import {
  problemAnalysisStorageKey,
  useProblemAnalysisStore,
  type ProblemAnalysisRecord,
} from '@/features/ai/model/problem-analysis-store';
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
  const updateInsights = useProblemAnalysisStore((state) => state.updateInsights);
  const sortedProblems = useMemo(
    () => [...problems].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [problems],
  );
  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
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
      await analyzeProblem(selectedProblem, selectedRecord?.sourceCode ?? null);
      setStatus('Analysis request completed.');
    } catch (caught) {
      setStatus(caught instanceof Error ? caught.message : 'AI access could not be enabled.');
    }
  };

  const saveEdits = async (): Promise<void> => {
    if (activeProblemId === null || insightDraft === undefined) return;
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
          <h2 id="analysis-page-title">Solutions, without the clutter.</h2>
          <p>Choose a question to compare its approaches, complexity, and related problems.</p>
        </div>
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
                    <div className="analysis-header-actions">
                      {selectedRecord?.insights !== undefined && (
                        <Button
                          disabled={selectedRecord.status === 'generating'}
                          onClick={() => void generate()}
                          variant="secondary"
                        >
                          {selectedRecord.status === 'generating' ? 'Generating…' : 'Regenerate'}
                        </Button>
                      )}
                      <a href={selectedProblem.source.url} rel="noreferrer" target="_blank">
                        LeetCode ↗
                      </a>
                    </div>
                  )}
                </header>

                {selectedProblem.source === undefined ? (
                  <AnalysisNotice
                    copy="This manually added question has no verified LeetCode URL or difficulty, so automatic AI analysis is unavailable. Add it from its LeetCode page to analyze code safely."
                    title="Verified problem context needed"
                  />
                ) : (
                  <>
                    {selectedRecord?.status === 'generating' && (
                      <AnalysisNotice
                        copy="Preparing the three approaches, their complexity, and similar questions."
                        title="Generating solutions"
                      />
                    )}
                    {(selectedRecord?.status === 'failed' ||
                      selectedRecord?.status === 'needs-code') && (
                      <AnalysisNotice
                        {...(selectedRecord.sourceCode === undefined
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
                      <FocusedAnalysisEditor
                        insights={insightDraft}
                        onChange={(updater) => {
                          if (activeProblemId === null) return;
                          setInsightDrafts((current) => ({
                            ...current,
                            [activeProblemId]: updater(current[activeProblemId] ?? insightDraft),
                          }));
                        }}
                        onSave={() => void saveEdits()}
                      />
                    )}
                    {selectedRecord === undefined && (
                      <AnalysisNotice
                        copy="Add this question again from LeetCode with AI analysis enabled to generate its approaches."
                        title="No solution analysis yet"
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

function FocusedAnalysisEditor({
  insights,
  onChange,
  onSave,
}: {
  insights: AiInsights;
  onChange: (updater: (current: AiInsights) => AiInsights) => void;
  onSave: () => void;
}): React.ReactNode {
  return (
    <div className="focused-analysis">
      <label className="focused-analysis-field">
        <span>Topic</span>
        <input
          className="focused-analysis-input"
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              pattern: { ...current.pattern, name: event.target.value },
            }))
          }
          value={insights.pattern.name}
        />
      </label>

      <div className="focused-methods">
        {insights.solutionProgression?.map((stage, index) => (
          <article className="focused-method" key={`${stage.kind}-${String(index)}`}>
            <div className="focused-method-heading">
              <strong>{methodLabel(stage.kind)}</strong>
              <span>
                {stage.timeComplexity} time · {stage.spaceComplexity} space
              </span>
            </div>
            <label className="focused-analysis-field">
              <span>Method</span>
              <input
                className="focused-analysis-input"
                onChange={(event) =>
                  onChange((current) => updateStage(current, index, 'title', event.target.value))
                }
                value={stage.title}
              />
            </label>
            <label className="focused-analysis-field">
              <span>Approach</span>
              <textarea
                className="focused-analysis-input focused-analysis-idea"
                onChange={(event) =>
                  onChange((current) => updateStage(current, index, 'idea', event.target.value))
                }
                value={stage.idea}
              />
            </label>
            <label className="focused-analysis-field">
              <span>Solution code</span>
              <textarea
                className="focused-analysis-input focused-analysis-code"
                onChange={(event) =>
                  onChange((current) => updateStage(current, index, 'code', event.target.value))
                }
                spellCheck={false}
                value={stage.code}
              />
            </label>
            <div className="focused-complexity">
              <label className="focused-analysis-field">
                <span>Time complexity</span>
                <input
                  className="focused-analysis-input"
                  onChange={(event) =>
                    onChange((current) =>
                      updateStage(current, index, 'timeComplexity', event.target.value),
                    )
                  }
                  value={stage.timeComplexity}
                />
              </label>
              <label className="focused-analysis-field">
                <span>Space complexity</span>
                <input
                  className="focused-analysis-input"
                  onChange={(event) =>
                    onChange((current) =>
                      updateStage(current, index, 'spaceComplexity', event.target.value),
                    )
                  }
                  value={stage.spaceComplexity}
                />
              </label>
            </div>
          </article>
        ))}
      </div>

      <section className="focused-related" aria-labelledby="similar-questions-title">
        <h4 id="similar-questions-title">Similar topic-wise questions</h4>
        {insights.relatedProblems.map((problem, index) => (
          <div className="focused-related-item" key={`${problem.url}-${String(index)}`}>
            <input
              aria-label={`Similar question ${String(index + 1)}`}
              className="focused-analysis-input"
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  relatedProblems: current.relatedProblems.map((candidate, candidateIndex) =>
                    candidateIndex === index
                      ? { ...candidate, title: event.target.value }
                      : candidate,
                  ),
                }))
              }
              value={problem.title}
            />
            <a href={problem.url} rel="noreferrer" target="_blank">
              Open ↗
            </a>
          </div>
        ))}
      </section>

      <div className="focused-analysis-save">
        <Button onClick={onSave} variant="secondary">
          Save edits
        </Button>
      </div>
    </div>
  );
}

type SolutionStage = NonNullable<AiInsights['solutionProgression']>[number];

function updateStage(
  insights: AiInsights,
  index: number,
  field: 'title' | 'idea' | 'code' | 'timeComplexity' | 'spaceComplexity',
  value: string,
): AiInsights {
  if (insights.solutionProgression === undefined) return insights;
  return {
    ...insights,
    solutionProgression: insights.solutionProgression.map((stage, stageIndex) =>
      stageIndex === index ? { ...stage, [field]: value } : stage,
    ),
  };
}

function methodLabel(kind: SolutionStage['kind']): string {
  return {
    'brute-force': 'Brute Force',
    improved: 'Optimal',
    optimal: 'Most Optimal',
  }[kind];
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
