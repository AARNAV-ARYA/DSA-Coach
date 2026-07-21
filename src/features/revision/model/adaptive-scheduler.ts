export const SCHEDULER_ALGORITHM_VERSION = 'adaptive-v1' as const;

export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface MemoryState {
  /** Estimated days until retrievability falls to 90%. */
  stabilityDays: number;
  /** Adaptive difficulty on a 1 (easy) to 10 (hard) scale. */
  difficulty: number;
  successfulReviews: number;
  totalReviews: number;
  consecutiveSuccesses: number;
  lapseCount: number;
}

export interface ReviewObservation {
  successful: boolean;
  /** Time since the previous review or solve, expressed as a fractional number of days. */
  elapsedDays: number;
  responseTimeMs: number;
  /** Expected recall time for this card type, supplied by the domain use case. */
  expectedResponseTimeMs: number;
  hintsUsed: number;
  /** Incorrect attempts made during this review before the final result. */
  failures: number;
}

export interface ScheduleExplanation {
  summary: string;
  signals: readonly string[];
}

export interface ScheduleResult {
  algorithmVersion: typeof SCHEDULER_ALGORITHM_VERSION;
  intervalDays: number;
  targetRetention: number;
  retrievabilityBeforeReview: number;
  reviewQuality: number;
  state: MemoryState;
  explanation: ScheduleExplanation;
}

const INITIAL_STATE_BY_DIFFICULTY: Record<
  ProblemDifficulty,
  Pick<MemoryState, 'difficulty' | 'stabilityDays'>
> = {
  Easy: { difficulty: 3.25, stabilityDays: 0.75 },
  Medium: { difficulty: 5.5, stabilityDays: 0.5 },
  Hard: { difficulty: 7.75, stabilityDays: 0.3 },
};

const MIN_STABILITY_DAYS = 5 / (24 * 60);
const MAX_INTERVAL_DAYS = 10 * 365;

export function createInitialMemoryState(problemDifficulty: ProblemDifficulty): MemoryState {
  const initial = INITIAL_STATE_BY_DIFFICULTY[problemDifficulty];

  return {
    ...initial,
    successfulReviews: 0,
    totalReviews: 0,
    consecutiveSuccesses: 0,
    lapseCount: 0,
  };
}

/**
 * Calculates the next interval from observable recall behavior. The function is pure so the
 * extension and the future backend can run the same versioned policy and compare results.
 */
export function scheduleNextReview(
  previous: MemoryState,
  observation: ReviewObservation,
): ScheduleResult {
  assertValidState(previous);
  assertValidObservation(observation);

  const retrievability = calculateRetrievability(previous.stabilityDays, observation.elapsedDays);
  const speedScore = clamp(observation.expectedResponseTimeMs / observation.responseTimeMs, 0.2, 1);
  const hintPenalty = Math.min(observation.hintsUsed * 0.12, 0.36);
  const failurePenalty = Math.min(observation.failures * 0.1, 0.4);
  const quality = observation.successful
    ? clamp(0.35 + speedScore * 0.65 - hintPenalty - failurePenalty, 0, 1)
    : 0;
  const previousSuccessRate =
    previous.totalReviews === 0 ? 0.5 : previous.successfulReviews / previous.totalReviews;
  const difficulty = updateDifficulty(previous.difficulty, quality, speedScore, observation);
  const stabilityDays = observation.successful
    ? growStability(previous, observation, retrievability, quality, difficulty, previousSuccessRate)
    : reduceStability(previous, observation, retrievability, difficulty);
  const state = updateHistory(previous, observation, difficulty, stabilityDays);
  const targetRetention = calculateTargetRetention(state, observation);
  const unconstrainedInterval = state.stabilityDays * (Math.log(targetRetention) / Math.log(0.9));
  const minimumInterval = observation.successful
    ? MIN_STABILITY_DAYS
    : calculateRelearningFloor(difficulty, observation);
  const intervalDays = round(clamp(unconstrainedInterval, minimumInterval, MAX_INTERVAL_DAYS), 6);

  return {
    algorithmVersion: SCHEDULER_ALGORITHM_VERSION,
    intervalDays,
    targetRetention: round(targetRetention, 4),
    retrievabilityBeforeReview: round(retrievability, 4),
    reviewQuality: round(quality, 4),
    state: {
      ...state,
      stabilityDays: round(state.stabilityDays, 6),
      difficulty: round(state.difficulty, 4),
    },
    explanation: buildExplanation(
      previous,
      observation,
      state,
      retrievability,
      quality,
      speedScore,
      previousSuccessRate,
    ),
  };
}

export function calculateRetrievability(stabilityDays: number, elapsedDays: number): number {
  assertPositiveFinite(stabilityDays, 'stabilityDays');
  assertNonNegativeFinite(elapsedDays, 'elapsedDays');
  return Math.pow(0.9, elapsedDays / stabilityDays);
}

function growStability(
  previous: MemoryState,
  observation: ReviewObservation,
  retrievability: number,
  quality: number,
  difficulty: number,
  previousSuccessRate: number,
): number {
  const difficultyEase = (11 - difficulty) / 10;
  const retrievalEffort = 0.35 + 1.65 * (1 - retrievability);
  const qualityFactor = 0.45 + 1.35 * quality;
  const historyFactor =
    (0.8 + previousSuccessRate * 0.4) * (1 + Math.min(previous.consecutiveSuccesses, 5) * 0.06);
  const fragilityFactor =
    1 /
    (1 + previous.lapseCount * 0.08 + observation.failures * 0.18 + observation.hintsUsed * 0.1);
  const growthMultiplier =
    1 + difficultyEase * retrievalEffort * qualityFactor * historyFactor * fragilityFactor;

  return clamp(previous.stabilityDays * growthMultiplier, MIN_STABILITY_DAYS, MAX_INTERVAL_DAYS);
}

function reduceStability(
  previous: MemoryState,
  observation: ReviewObservation,
  retrievability: number,
  difficulty: number,
): number {
  const lapseSeverity = clamp(
    0.28 + difficulty * 0.035 + observation.failures * 0.06 + observation.hintsUsed * 0.04,
    0.35,
    0.85,
  );
  const retainedStrength = previous.stabilityDays * (1 - lapseSeverity);
  const retrievalAdjustment = 0.75 + retrievability * 0.25;

  return clamp(retainedStrength * retrievalAdjustment, MIN_STABILITY_DAYS, MAX_INTERVAL_DAYS);
}

function updateDifficulty(
  previousDifficulty: number,
  quality: number,
  speedScore: number,
  observation: ReviewObservation,
): number {
  const meanReversion = (5 - previousDifficulty) * 0.03;
  const performanceDelta =
    (0.72 - quality) * 0.9 +
    (1 - speedScore) * 0.18 +
    observation.hintsUsed * 0.1 +
    observation.failures * 0.14 +
    (observation.successful ? 0 : 0.45);

  return clamp(previousDifficulty + meanReversion + performanceDelta, 1, 10);
}

function updateHistory(
  previous: MemoryState,
  observation: ReviewObservation,
  difficulty: number,
  stabilityDays: number,
): MemoryState {
  return {
    stabilityDays,
    difficulty,
    successfulReviews: previous.successfulReviews + (observation.successful ? 1 : 0),
    totalReviews: previous.totalReviews + 1,
    consecutiveSuccesses: observation.successful ? previous.consecutiveSuccesses + 1 : 0,
    lapseCount: previous.lapseCount + (observation.successful ? 0 : 1),
  };
}

function calculateTargetRetention(state: MemoryState, observation: ReviewObservation): number {
  const difficultyAdjustment = (state.difficulty - 5) * 0.006;
  const lapseAdjustment = Math.min(state.lapseCount, 10) * 0.002;
  const attemptAdjustment = observation.failures * 0.003 + observation.hintsUsed * 0.002;
  const failureAdjustment = observation.successful ? 0 : 0.045;

  return clamp(
    0.9 + difficultyAdjustment + lapseAdjustment + attemptAdjustment + failureAdjustment,
    0.86,
    0.97,
  );
}

function calculateRelearningFloor(difficulty: number, observation: ReviewObservation): number {
  const minutes =
    30 / (1 + difficulty / 5 + observation.failures * 0.25 + observation.hintsUsed * 0.15);
  return clamp(minutes / (24 * 60), MIN_STABILITY_DAYS, 30 / (24 * 60));
}

function buildExplanation(
  previous: MemoryState,
  observation: ReviewObservation,
  next: MemoryState,
  retrievability: number,
  quality: number,
  speedScore: number,
  previousSuccessRate: number,
): ScheduleExplanation {
  const stabilityDirection = next.stabilityDays >= previous.stabilityDays ? 'grew' : 'decreased';
  const signals = [
    `Memory strength ${stabilityDirection} from ${formatDays(previous.stabilityDays)} to ${formatDays(next.stabilityDays)}.`,
    `Estimated recall probability before review was ${formatPercent(retrievability)}.`,
    `Observed recall quality was ${formatPercent(quality)} and speed was ${formatPercent(speedScore)} of target.`,
    `Adaptive difficulty is ${next.difficulty.toFixed(1)} out of 10.`,
    `Previous review success rate was ${formatPercent(previousSuccessRate)}.`,
  ];

  if (observation.hintsUsed > 0) {
    signals.push(`${String(observation.hintsUsed)} hint(s) reduced the stability gain.`);
  }
  if (observation.failures > 0) {
    signals.push(`${String(observation.failures)} failed attempt(s) shortened the interval.`);
  }

  return {
    summary: observation.successful
      ? 'The interval adapts to the strength and quality of this successful recall.'
      : 'The interval contracts for relearning after an unsuccessful recall.',
    signals,
  };
}

function assertValidState(state: MemoryState): void {
  assertPositiveFinite(state.stabilityDays, 'state.stabilityDays');
  assertFiniteInRange(state.difficulty, 1, 10, 'state.difficulty');
  assertNonNegativeInteger(state.successfulReviews, 'state.successfulReviews');
  assertNonNegativeInteger(state.totalReviews, 'state.totalReviews');
  assertNonNegativeInteger(state.consecutiveSuccesses, 'state.consecutiveSuccesses');
  assertNonNegativeInteger(state.lapseCount, 'state.lapseCount');

  if (state.successfulReviews > state.totalReviews) {
    throw new RangeError('state.successfulReviews cannot exceed state.totalReviews.');
  }
  if (state.consecutiveSuccesses > state.successfulReviews) {
    throw new RangeError('state.consecutiveSuccesses cannot exceed state.successfulReviews.');
  }
}

function assertValidObservation(observation: ReviewObservation): void {
  assertNonNegativeFinite(observation.elapsedDays, 'observation.elapsedDays');
  assertPositiveFinite(observation.responseTimeMs, 'observation.responseTimeMs');
  assertPositiveFinite(observation.expectedResponseTimeMs, 'observation.expectedResponseTimeMs');
  assertNonNegativeInteger(observation.hintsUsed, 'observation.hintsUsed');
  assertNonNegativeInteger(observation.failures, 'observation.failures');
}

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}

function assertNonNegativeFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative finite number.`);
  }
}

function assertFiniteInRange(value: number, minimum: number, maximum: number, name: string): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} must be between ${String(minimum)} and ${String(maximum)}.`);
  }
}

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer.`);
  }
}

function formatDays(days: number): string {
  return `${round(days, 2).toFixed(2)} days`;
}

function formatPercent(value: number): string {
  return `${String(Math.round(value * 100))}%`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function round(value: number, precision: number): number {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}
