export const MESSAGE_VERSION = 1 as const;

export type ExtensionMessage =
  | {
      version: typeof MESSAGE_VERSION;
      type: 'shell.open-side-panel';
    }
  | {
      version: typeof MESSAGE_VERSION;
      type: 'shell.open-dashboard';
    }
  | {
      version: typeof MESSAGE_VERSION;
      type: 'problem.context.detected';
      context: ProblemContext;
    }
  | {
      version: typeof MESSAGE_VERSION;
      type: 'capture.active-context.request';
    }
  | {
      version: typeof MESSAGE_VERSION;
      type: 'capture.active-solution.request';
    }
  | {
      version: typeof MESSAGE_VERSION;
      type: 'content.solution-code.request';
    }
  | {
      version: typeof MESSAGE_VERSION;
      type: 'review.added';
      title: string;
      reviewDate: string;
    }
  | {
      version: typeof MESSAGE_VERSION;
      type: 'review.completed';
      title: string;
      nextReviewDate: string;
    };

export interface ProblemContext {
  provider: 'leetcode';
  problemId: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  url: string;
}

export interface ActiveProblemContextResponse {
  context: ProblemContext | null;
}

export interface ActiveSolutionCodeResponse {
  code: string | null;
}

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Partial<ExtensionMessage>;
  return (
    candidate.version === MESSAGE_VERSION &&
    (candidate.type === 'shell.open-side-panel' ||
      candidate.type === 'shell.open-dashboard' ||
      candidate.type === 'capture.active-context.request' ||
      candidate.type === 'capture.active-solution.request' ||
      candidate.type === 'content.solution-code.request' ||
      (candidate.type === 'review.added' &&
        typeof candidate.title === 'string' &&
        typeof candidate.reviewDate === 'string') ||
      (candidate.type === 'review.completed' &&
        typeof candidate.title === 'string' &&
        typeof candidate.nextReviewDate === 'string') ||
      (candidate.type === 'problem.context.detected' && isProblemContext(candidate.context)))
  );
}

export function isActiveSolutionCodeResponse(value: unknown): value is ActiveSolutionCodeResponse {
  if (typeof value !== 'object' || value === null) return false;
  const code = (value as { code?: unknown }).code;
  return code === null || typeof code === 'string';
}

export function isProblemContext(value: unknown): value is ProblemContext {
  if (typeof value !== 'object' || value === null) return false;

  const context = value as Partial<ProblemContext>;
  return (
    context.provider === 'leetcode' &&
    typeof context.problemId === 'string' &&
    context.problemId.length > 0 &&
    typeof context.title === 'string' &&
    context.title.length > 0 &&
    (context.difficulty === 'Easy' ||
      context.difficulty === 'Medium' ||
      context.difficulty === 'Hard') &&
    typeof context.url === 'string'
  );
}
