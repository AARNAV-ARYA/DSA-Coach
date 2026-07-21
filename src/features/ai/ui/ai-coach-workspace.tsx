import { useEffect, useMemo, useState } from 'react';
import { AiClientError, generateAiInsights } from '@/features/ai/lib/ai-client';
import {
  aiGenerationRequestSchema,
  aiInsightsSchema,
  savedAiDraftSchema,
  type AiConsentScope,
  type AiGenerationRequest,
  type AiInsights,
} from '@/features/ai/model/ai-contracts';
import { extensionStorage } from '@/shared/lib/storage/extension-storage';
import { Button } from '@/shared/ui/button';

const draftStorageKey = 'dsa-coach.ai.latest-draft';

interface SourceForm {
  title: string;
  url: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  approach: string;
  reflection: string;
  code: string;
  timeTakenMinutes: string;
  hintsUsed: string;
  failures: string;
  shareApproach: boolean;
  shareReflection: boolean;
  shareCode: boolean;
  sharePerformance: boolean;
}

const initialSource: SourceForm = {
  title: '',
  url: '',
  difficulty: 'Medium',
  approach: '',
  reflection: '',
  code: '',
  timeTakenMinutes: '30',
  hintsUsed: '0',
  failures: '0',
  shareApproach: false,
  shareReflection: false,
  shareCode: false,
  sharePerformance: false,
};

export function AiCoachWorkspace(): React.ReactNode {
  const [source, setSource] = useState<SourceForm>(initialSource);
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void extensionStorage.get<unknown>(draftStorageKey).then((stored) => {
      const draft = savedAiDraftSchema.safeParse(stored);
      if (!draft.success) return;
      setSource(sourceFromRequest(draft.data.request));
      setInsights(draft.data.insights);
      setStatus('Saved draft restored.');
    });
  }, []);

  const sharedScopes = useMemo(() => buildConsentScopes(source), [source]);

  const generate = async (): Promise<void> => {
    if (
      insights !== null &&
      isDirty &&
      !globalThis.confirm('Regenerate and replace your unsaved AI edits?')
    ) {
      return;
    }

    setError(null);
    setStatus(null);
    const parsedRequest = aiGenerationRequestSchema.safeParse(buildRequest(source));
    if (!parsedRequest.success) {
      setError(parsedRequest.error.issues[0]?.message ?? 'Check the problem details.');
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await generateAiInsights(parsedRequest.data);
      setInsights(generated);
      setIsDirty(false);
      setStatus('Insights generated. Review and edit before saving.');
    } catch (caught) {
      setError(
        caught instanceof AiClientError ? caught.message : 'The AI request could not be completed.',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const save = async (): Promise<void> => {
    if (insights === null) return;
    const request = aiGenerationRequestSchema.safeParse(buildRequest(source));
    const editedInsights = aiInsightsSchema.safeParse(insights);
    if (!request.success || !editedInsights.success) {
      setError('Complete the required insight fields before saving this draft.');
      return;
    }

    await extensionStorage.set(draftStorageKey, {
      request: request.data,
      insights: editedInsights.data,
      savedAt: new Date().toISOString(),
    });
    setIsDirty(false);
    setError(null);
    setStatus('Editable draft saved locally.');
  };

  const updateInsights = (updater: (current: AiInsights) => AiInsights): void => {
    setInsights((current) => (current === null ? null : updater(current)));
    setIsDirty(true);
    setStatus(null);
  };

  return (
    <section className="mt-14 border-t border-border pt-10" aria-labelledby="ai-coach-title">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-accent">Private AI study synthesis</p>
        <h2 id="ai-coach-title" className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
          Turn one solve into reusable intuition.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Problem metadata is required. Your approach, reflection, code, and performance are sent
          only when you explicitly include them below.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="space-y-5 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <Field label="Problem title">
            <input
              className={inputClass}
              maxLength={160}
              onChange={(event) => setSource({ ...source, title: event.target.value })}
              placeholder="Two Sum"
              value={source.title}
            />
          </Field>
          <Field label="Canonical LeetCode URL">
            <input
              className={inputClass}
              onChange={(event) => setSource({ ...source, url: event.target.value })}
              placeholder="https://leetcode.com/problems/two-sum/"
              type="url"
              value={source.url}
            />
          </Field>
          <Field label="Difficulty">
            <select
              className={inputClass}
              onChange={(event) =>
                setSource({
                  ...source,
                  difficulty: event.target.value as SourceForm['difficulty'],
                })
              }
              value={source.difficulty}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </Field>

          <ConsentField
            checked={source.shareApproach}
            label="Share my approach"
            onChange={(checked) => setSource({ ...source, shareApproach: checked })}
          >
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              disabled={!source.shareApproach}
              maxLength={6_000}
              onChange={(event) => setSource({ ...source, approach: event.target.value })}
              placeholder="What approach did you try?"
              value={source.approach}
            />
          </ConsentField>
          <ConsentField
            checked={source.shareReflection}
            label="Share my reflection"
            onChange={(checked) => setSource({ ...source, shareReflection: checked })}
          >
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              disabled={!source.shareReflection}
              maxLength={3_000}
              onChange={(event) => setSource({ ...source, reflection: event.target.value })}
              placeholder="Where did the solve feel uncertain?"
              value={source.reflection}
            />
          </ConsentField>
          <ConsentField
            checked={source.shareCode}
            label="Share my code"
            onChange={(checked) => setSource({ ...source, shareCode: checked })}
          >
            <textarea
              className={`${inputClass} min-h-32 resize-y font-mono text-xs`}
              disabled={!source.shareCode}
              maxLength={12_000}
              onChange={(event) => setSource({ ...source, code: event.target.value })}
              placeholder="Optional solution attempt"
              value={source.code}
            />
          </ConsentField>
          <ConsentField
            checked={source.sharePerformance}
            label="Share performance signals"
            onChange={(checked) => setSource({ ...source, sharePerformance: checked })}
          >
            <div className="grid grid-cols-3 gap-3">
              <NumberField
                disabled={!source.sharePerformance}
                label="Minutes"
                onChange={(value) => setSource({ ...source, timeTakenMinutes: value })}
                value={source.timeTakenMinutes}
              />
              <NumberField
                disabled={!source.sharePerformance}
                label="Hints"
                onChange={(value) => setSource({ ...source, hintsUsed: value })}
                value={source.hintsUsed}
              />
              <NumberField
                disabled={!source.sharePerformance}
                label="Failures"
                onChange={(value) => setSource({ ...source, failures: value })}
                value={source.failures}
              />
            </div>
          </ConsentField>

          <div className="rounded-2xl bg-muted p-4 text-xs leading-5 text-muted-foreground">
            Sharing now: {sharedScopes.map(formatScope).join(', ')}. AI output is a suggestion and
            never changes your review schedule.
          </div>
          <Button disabled={isGenerating} onClick={() => void generate()}>
            {isGenerating ? 'Generating…' : insights === null ? 'Generate insights' : 'Regenerate'}
          </Button>
          {error !== null && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {status !== null && <p className="text-sm text-accent">{status}</p>}
        </div>

        {insights === null ? (
          <div className="grid min-h-80 place-items-center rounded-3xl border border-dashed border-border p-8 text-center text-sm leading-6 text-muted-foreground">
            Your editable notes, pattern, intuition, solution summary, and related practice will
            appear here.
          </div>
        ) : (
          <AiInsightsEditor
            insights={insights}
            onChange={updateInsights}
            onSave={() => void save()}
          />
        )}
      </div>
    </section>
  );
}

export function AiInsightsEditor({
  insights,
  onChange,
  onSave,
  saveLabel = 'Save edited draft',
}: {
  insights: AiInsights;
  onChange: (updater: (current: AiInsights) => AiInsights) => void;
  onSave: () => void;
  saveLabel?: string;
}): React.ReactNode {
  return (
    <div className="space-y-5 rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <EditorField label="Concise notes">
        <textarea
          className={`${inputClass} min-h-28 resize-y`}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              conciseNotes: linesFromText(event.target.value).slice(0, 5),
            }))
          }
          value={insights.conciseNotes.join('\n')}
        />
      </EditorField>
      <div className="grid gap-4 sm:grid-cols-2">
        <EditorField label="Algorithm">
          <input
            className={inputClass}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                algorithm: { ...current.algorithm, name: event.target.value },
              }))
            }
            value={insights.algorithm.name}
          />
        </EditorField>
        <EditorField label="Pattern">
          <input
            className={inputClass}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                pattern: { ...current.pattern, name: event.target.value },
              }))
            }
            value={insights.pattern.name}
          />
        </EditorField>
      </div>
      <EditorField label="Why this algorithm">
        <textarea
          className={`${inputClass} min-h-20 resize-y`}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              algorithm: { ...current.algorithm, explanation: event.target.value },
            }))
          }
          value={insights.algorithm.explanation}
        />
      </EditorField>
      <EditorField label="Pattern recognition signals">
        <textarea
          className={`${inputClass} min-h-20 resize-y`}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              pattern: {
                ...current.pattern,
                recognitionSignals: linesFromText(event.target.value).slice(0, 4),
              },
            }))
          }
          value={insights.pattern.recognitionSignals.join('\n')}
        />
      </EditorField>
      <EditorField label="One-line intuition">
        <textarea
          className={`${inputClass} min-h-20 resize-y text-base font-medium`}
          onChange={(event) =>
            onChange((current) => ({ ...current, oneLineIntuition: event.target.value }))
          }
          value={insights.oneLineIntuition}
        />
      </EditorField>
      <EditorField label="Why you may have been stuck">
        <textarea
          className={`${inputClass} min-h-24 resize-y`}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              stuckPrediction: { ...current.stuckPrediction, hypothesis: event.target.value },
            }))
          }
          value={insights.stuckPrediction.hypothesis}
        />
        <select
          aria-label="Stuck prediction confidence"
          className={`${inputClass} mt-2`}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              stuckPrediction: {
                ...current.stuckPrediction,
                confidence: event.target.value as AiInsights['stuckPrediction']['confidence'],
              },
            }))
          }
          value={insights.stuckPrediction.confidence}
        >
          <option value="low">Low confidence</option>
          <option value="medium">Medium confidence</option>
          <option value="high">High confidence</option>
        </select>
      </EditorField>
      <EditorField label="Evidence for that hypothesis">
        <textarea
          className={`${inputClass} min-h-20 resize-y`}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              stuckPrediction: {
                ...current.stuckPrediction,
                evidence: linesFromText(event.target.value).slice(0, 4),
              },
            }))
          }
          value={insights.stuckPrediction.evidence.join('\n')}
        />
      </EditorField>
      <EditorField label="Optimal solution summary">
        <textarea
          className={`${inputClass} min-h-32 resize-y`}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              optimalSolution: { ...current.optimalSolution, summary: event.target.value },
            }))
          }
          value={insights.optimalSolution.summary}
        />
      </EditorField>
      <div className="grid gap-4 sm:grid-cols-2">
        <EditorField label="Time complexity">
          <input
            className={inputClass}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                optimalSolution: {
                  ...current.optimalSolution,
                  timeComplexity: event.target.value,
                },
              }))
            }
            value={insights.optimalSolution.timeComplexity}
          />
        </EditorField>
        <EditorField label="Space complexity">
          <input
            className={inputClass}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                optimalSolution: {
                  ...current.optimalSolution,
                  spaceComplexity: event.target.value,
                },
              }))
            }
            value={insights.optimalSolution.spaceComplexity}
          />
        </EditorField>
      </div>
      {insights.codeReview !== undefined && (
        <div className="space-y-4 rounded-2xl border border-border bg-muted/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Your code review</p>
            <input
              aria-label="Solution language"
              className="max-w-36 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground outline-none focus:border-accent"
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  codeReview:
                    current.codeReview === undefined
                      ? undefined
                      : { ...current.codeReview, language: event.target.value },
                }))
              }
              value={insights.codeReview.language}
            />
          </div>
          <EditorField label="Review summary">
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  codeReview:
                    current.codeReview === undefined
                      ? undefined
                      : { ...current.codeReview, summary: event.target.value },
                }))
              }
              value={insights.codeReview.summary}
            />
          </EditorField>
          <div className="grid gap-4 sm:grid-cols-2">
            <EditorField label="What worked">
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    codeReview:
                      current.codeReview === undefined
                        ? undefined
                        : {
                            ...current.codeReview,
                            strengths: linesFromText(event.target.value).slice(0, 5),
                          },
                  }))
                }
                value={insights.codeReview.strengths.join('\n')}
              />
            </EditorField>
            <EditorField label="What to improve">
              <textarea
                className={`${inputClass} min-h-24 resize-y`}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    codeReview:
                      current.codeReview === undefined
                        ? undefined
                        : {
                            ...current.codeReview,
                            improvements: linesFromText(event.target.value).slice(0, 6),
                          },
                  }))
                }
                value={insights.codeReview.improvements.join('\n')}
              />
            </EditorField>
          </div>
          <EditorField label="Correctness or edge-case risk">
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  codeReview:
                    current.codeReview === undefined
                      ? undefined
                      : { ...current.codeReview, correctnessRisk: event.target.value },
                }))
              }
              value={insights.codeReview.correctnessRisk}
            />
          </EditorField>
        </div>
      )}
      {insights.solutionProgression !== undefined && (
        <div>
          <p className="text-sm font-semibold">Brute force to optimal</p>
          <div className="mt-3 space-y-4">
            {insights.solutionProgression.map((stage, index) => (
              <div className="rounded-2xl border border-border p-4" key={stage.kind}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                    {formatStageKind(stage.kind)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {stage.timeComplexity} time · {stage.spaceComplexity} space
                  </span>
                </div>
                <EditorField label="Approach name">
                  <input
                    className={inputClass}
                    onChange={(event) =>
                      onChange((current) =>
                        updateSolutionStage(current, index, { title: event.target.value }),
                      )
                    }
                    value={stage.title}
                  />
                </EditorField>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <EditorField label="Idea">
                    <textarea
                      className={`${inputClass} min-h-24 resize-y`}
                      onChange={(event) =>
                        onChange((current) =>
                          updateSolutionStage(current, index, { idea: event.target.value }),
                        )
                      }
                      value={stage.idea}
                    />
                  </EditorField>
                  <EditorField label="Intuition">
                    <textarea
                      className={`${inputClass} min-h-24 resize-y`}
                      onChange={(event) =>
                        onChange((current) =>
                          updateSolutionStage(current, index, { intuition: event.target.value }),
                        )
                      }
                      value={stage.intuition}
                    />
                  </EditorField>
                </div>
                <EditorField label="Clean solution code">
                  <textarea
                    className={`${inputClass} mt-4 min-h-56 resize-y font-mono text-xs leading-5`}
                    onChange={(event) =>
                      onChange((current) =>
                        updateSolutionStage(current, index, { code: event.target.value }),
                      )
                    }
                    spellCheck={false}
                    value={stage.code}
                  />
                </EditorField>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <EditorField label="Time complexity">
                    <input
                      className={inputClass}
                      onChange={(event) =>
                        onChange((current) =>
                          updateSolutionStage(current, index, {
                            timeComplexity: event.target.value,
                          }),
                        )
                      }
                      value={stage.timeComplexity}
                    />
                  </EditorField>
                  <EditorField label="Space complexity">
                    <input
                      className={inputClass}
                      onChange={(event) =>
                        onChange((current) =>
                          updateSolutionStage(current, index, {
                            spaceComplexity: event.target.value,
                          }),
                        )
                      }
                      value={stage.spaceComplexity}
                    />
                  </EditorField>
                </div>
                <EditorField label="Trade-off">
                  <textarea
                    className={`${inputClass} mt-4 min-h-20 resize-y`}
                    onChange={(event) =>
                      onChange((current) =>
                        updateSolutionStage(current, index, { tradeoff: event.target.value }),
                      )
                    }
                    value={stage.tradeoff}
                  />
                </EditorField>
              </div>
            ))}
          </div>
        </div>
      )}
      {insights.realLifeAnalogy !== undefined && (
        <div className="grid gap-4 sm:grid-cols-2">
          <EditorField label="Real-life analogy">
            <input
              className={inputClass}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  realLifeAnalogy:
                    current.realLifeAnalogy === undefined
                      ? undefined
                      : { ...current.realLifeAnalogy, title: event.target.value },
                }))
              }
              value={insights.realLifeAnalogy.title}
            />
            <textarea
              className={`${inputClass} mt-2 min-h-28 resize-y`}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  realLifeAnalogy:
                    current.realLifeAnalogy === undefined
                      ? undefined
                      : { ...current.realLifeAnalogy, explanation: event.target.value },
                }))
              }
              value={insights.realLifeAnalogy.explanation}
            />
          </EditorField>
          {insights.workedExample !== undefined && (
            <EditorField label="Worked example">
              <input
                aria-label="Worked example input"
                className={inputClass}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    workedExample:
                      current.workedExample === undefined
                        ? undefined
                        : { ...current.workedExample, input: event.target.value },
                  }))
                }
                value={insights.workedExample.input}
              />
              <textarea
                aria-label="Worked example steps"
                className={`${inputClass} mt-2 min-h-28 resize-y`}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    workedExample:
                      current.workedExample === undefined
                        ? undefined
                        : { ...current.workedExample, steps: linesFromText(event.target.value) },
                  }))
                }
                value={insights.workedExample.steps.join('\n')}
              />
              <input
                aria-label="Worked example output"
                className={`${inputClass} mt-2`}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    workedExample:
                      current.workedExample === undefined
                        ? undefined
                        : { ...current.workedExample, output: event.target.value },
                  }))
                }
                value={insights.workedExample.output}
              />
            </EditorField>
          )}
        </div>
      )}
      {insights.visualFlow !== undefined && (
        <div className="rounded-2xl border border-border p-4">
          <EditorField label="Visual flow title">
            <input
              className={inputClass}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  visualFlow:
                    current.visualFlow === undefined
                      ? undefined
                      : { ...current.visualFlow, title: event.target.value },
                }))
              }
              value={insights.visualFlow.title}
            />
          </EditorField>
          <div className="mt-4 flex flex-col gap-2" aria-label={insights.visualFlow.title}>
            {insights.visualFlow.steps.map((step, index) => (
              <div key={`${step.label}-${String(index)}`}>
                <div className="rounded-xl border border-border bg-background p-3">
                  <input
                    aria-label={`Visual step ${String(index + 1)} label`}
                    className={inputClass}
                    onChange={(event) =>
                      onChange((current) =>
                        updateVisualStep(current, index, 'label', event.target.value),
                      )
                    }
                    value={step.label}
                  />
                  <textarea
                    aria-label={`Visual step ${String(index + 1)} detail`}
                    className={`${inputClass} mt-2 min-h-16 resize-y`}
                    onChange={(event) =>
                      onChange((current) =>
                        updateVisualStep(current, index, 'detail', event.target.value),
                      )
                    }
                    value={step.detail}
                  />
                </div>
                {index < (insights.visualFlow?.steps.length ?? 0) - 1 && (
                  <div className="py-1 text-center text-lg text-accent" aria-hidden="true">
                    ↓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="text-sm font-semibold">Related LeetCode problems</p>
        <div className="mt-3 space-y-3">
          {insights.relatedProblems.map((problem, index) => (
            <div
              className="rounded-2xl border border-border p-4"
              key={`${problem.url}-${String(index)}`}
            >
              <input
                aria-label={`Related problem ${String(index + 1)} title`}
                className={inputClass}
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
              <input
                aria-label={`Related problem ${String(index + 1)} URL`}
                className={`${inputClass} mt-2`}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    relatedProblems: current.relatedProblems.map((candidate, candidateIndex) =>
                      candidateIndex === index
                        ? { ...candidate, url: event.target.value }
                        : candidate,
                    ),
                  }))
                }
                type="url"
                value={problem.url}
              />
              <textarea
                aria-label={`Related problem ${String(index + 1)} reason`}
                className={`${inputClass} mt-2 min-h-16 resize-y`}
                onChange={(event) =>
                  onChange((current) => ({
                    ...current,
                    relatedProblems: current.relatedProblems.map((candidate, candidateIndex) =>
                      candidateIndex === index
                        ? { ...candidate, reason: event.target.value }
                        : candidate,
                    ),
                  }))
                }
                value={problem.reason}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-5">
        <p className="text-xs text-muted-foreground">
          {insights.metadata.model} · {insights.metadata.promptVersion}
        </p>
        <Button onClick={onSave} variant="secondary">
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): React.ReactNode {
  return (
    <label className="block text-sm font-medium">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function EditorField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <label className="block text-sm font-semibold">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function ConsentField({
  checked,
  label,
  onChange,
  children,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-medium">
        <input
          checked={checked}
          className="size-4 accent-[var(--color-accent)]"
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        {label}
      </label>
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}): React.ReactNode {
  return (
    <label className="text-xs text-muted-foreground">
      {label}
      <input
        className={`${inputClass} mt-1`}
        disabled={disabled}
        min="0"
        onChange={(event) => onChange(event.target.value)}
        step="1"
        type="number"
        value={value}
      />
    </label>
  );
}

function buildRequest(source: SourceForm): unknown {
  const consentScopes = buildConsentScopes(source);
  return {
    problem: { title: source.title, url: source.url, difficulty: source.difficulty },
    consentScopes,
    ...(source.shareApproach && source.approach.trim() !== '' ? { approach: source.approach } : {}),
    ...(source.shareReflection && source.reflection.trim() !== ''
      ? { reflection: source.reflection }
      : {}),
    ...(source.shareCode && source.code.trim() !== '' ? { code: source.code } : {}),
    ...(source.sharePerformance
      ? {
          performance: {
            timeTakenMinutes: Number(source.timeTakenMinutes),
            hintsUsed: Number(source.hintsUsed),
            failures: Number(source.failures),
          },
        }
      : {}),
  };
}

function buildConsentScopes(source: SourceForm): AiConsentScope[] {
  return [
    'problem_metadata',
    ...(source.shareApproach ? (['approach'] as const) : []),
    ...(source.shareReflection ? (['reflection'] as const) : []),
    ...(source.shareCode ? (['code'] as const) : []),
    ...(source.sharePerformance ? (['performance'] as const) : []),
  ];
}

function sourceFromRequest(request: AiGenerationRequest): SourceForm {
  const scopes = new Set(request.consentScopes);
  return {
    title: request.problem.title,
    url: request.problem.url,
    difficulty: request.problem.difficulty,
    approach: request.approach ?? '',
    reflection: request.reflection ?? '',
    code: request.code ?? '',
    timeTakenMinutes: String(request.performance?.timeTakenMinutes ?? 30),
    hintsUsed: String(request.performance?.hintsUsed ?? 0),
    failures: String(request.performance?.failures ?? 0),
    shareApproach: scopes.has('approach'),
    shareReflection: scopes.has('reflection'),
    shareCode: scopes.has('code'),
    sharePerformance: scopes.has('performance'),
  };
}

type SolutionStage = NonNullable<AiInsights['solutionProgression']>[number];

function updateSolutionStage(
  insights: AiInsights,
  index: number,
  change: Partial<SolutionStage>,
): AiInsights {
  if (insights.solutionProgression === undefined) return insights;
  return {
    ...insights,
    solutionProgression: insights.solutionProgression.map((stage, stageIndex) =>
      stageIndex === index ? { ...stage, ...change } : stage,
    ),
  };
}

function updateVisualStep(
  insights: AiInsights,
  index: number,
  field: 'label' | 'detail',
  value: string,
): AiInsights {
  if (insights.visualFlow === undefined) return insights;
  return {
    ...insights,
    visualFlow: {
      ...insights.visualFlow,
      steps: insights.visualFlow.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [field]: value } : step,
      ),
    },
  };
}

function formatStageKind(kind: SolutionStage['kind']): string {
  return {
    'brute-force': 'Brute force',
    improved: 'Improved',
    optimal: 'Optimal',
  }[kind];
}

function linesFromText(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function formatScope(scope: AiConsentScope): string {
  return scope.replace('_', ' ');
}

const inputClass =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-45';
