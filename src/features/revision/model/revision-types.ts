export const revisionOutcomes = [
  'mastered',
  'understood',
  'needed-hint',
  'saw-solution',
  'couldnt-solve',
] as const;

export type RevisionOutcome = (typeof revisionOutcomes)[number];

export interface RevisionProblemSource {
  provider: 'leetcode';
  problemId: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  url: string;
}

export interface RevisionProblem {
  id: string;
  title: string;
  outcome: RevisionOutcome;
  reviewDate: string;
  createdAt: string;
  note?: string;
  source?: RevisionProblemSource;
}

export interface RevisionProblemDraft {
  title: string;
  outcome: RevisionOutcome;
  reviewDate: string;
  note?: string;
  source?: RevisionProblemSource;
}

export const revisionOutcomeCopy: Record<RevisionOutcome, { label: string; description: string }> =
  {
    mastered: { label: 'Mastered', description: 'I could solve it confidently.' },
    understood: { label: 'Understood', description: 'The approach is clear to me.' },
    'needed-hint': { label: 'Needed Hint', description: 'I needed a nudge to progress.' },
    'saw-solution': { label: 'Saw Solution', description: 'I learned it from the solution.' },
    'couldnt-solve': { label: "Couldn't Solve", description: 'I could not find the approach.' },
  };
