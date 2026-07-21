import { describe, expect, it } from 'vitest';
import {
  calculateRetrievability,
  createInitialMemoryState,
  scheduleNextReview,
  type MemoryState,
  type ReviewObservation,
} from '@/features/revision/model/adaptive-scheduler';

const cleanSuccess: ReviewObservation = {
  successful: true,
  elapsedDays: 1,
  responseTimeMs: 20_000,
  expectedResponseTimeMs: 30_000,
  hintsUsed: 0,
  failures: 0,
};

const establishedMemory: MemoryState = {
  stabilityDays: 4,
  difficulty: 5,
  successfulReviews: 4,
  totalReviews: 5,
  consecutiveSuccesses: 2,
  lapseCount: 1,
};

describe('adaptive scheduler', () => {
  it('starts harder problems with shorter memory strength', () => {
    const easy = createInitialMemoryState('Easy');
    const medium = createInitialMemoryState('Medium');
    const hard = createInitialMemoryState('Hard');

    expect(easy.stabilityDays).toBeGreaterThan(medium.stabilityDays);
    expect(medium.stabilityDays).toBeGreaterThan(hard.stabilityDays);
    expect(easy.difficulty).toBeLessThan(medium.difficulty);
    expect(medium.difficulty).toBeLessThan(hard.difficulty);
  });

  it('schedules an otherwise equivalent harder memory more conservatively', () => {
    const easy = scheduleNextReview({ ...establishedMemory, difficulty: 2 }, cleanSuccess);
    const hard = scheduleNextReview({ ...establishedMemory, difficulty: 8 }, cleanSuccess);

    expect(easy.intervalDays).toBeGreaterThan(hard.intervalDays);
    expect(easy.targetRetention).toBeLessThan(hard.targetRetention);
  });

  it('grows memory strength after successful recall', () => {
    const result = scheduleNextReview(establishedMemory, cleanSuccess);

    expect(result.state.stabilityDays).toBeGreaterThan(establishedMemory.stabilityDays);
    expect(result.intervalDays).toBeGreaterThan(0);
    expect(result.state.successfulReviews).toBe(5);
    expect(result.state.consecutiveSuccesses).toBe(3);
  });

  it('contracts memory strength and interval after a failure', () => {
    const result = scheduleNextReview(establishedMemory, {
      ...cleanSuccess,
      successful: false,
      failures: 1,
    });

    expect(result.state.stabilityDays).toBeLessThan(establishedMemory.stabilityDays);
    expect(result.intervalDays).toBeLessThan(establishedMemory.stabilityDays);
    expect(result.state.lapseCount).toBe(2);
    expect(result.state.consecutiveSuccesses).toBe(0);
  });

  it('rewards faster successful recall with a longer interval', () => {
    const fast = scheduleNextReview(establishedMemory, {
      ...cleanSuccess,
      responseTimeMs: 12_000,
    });
    const slow = scheduleNextReview(establishedMemory, {
      ...cleanSuccess,
      responseTimeMs: 90_000,
    });

    expect(fast.reviewQuality).toBeGreaterThan(slow.reviewQuality);
    expect(fast.intervalDays).toBeGreaterThan(slow.intervalDays);
  });

  it('shortens the interval when recall needs hints', () => {
    const unassisted = scheduleNextReview(establishedMemory, cleanSuccess);
    const assisted = scheduleNextReview(establishedMemory, {
      ...cleanSuccess,
      hintsUsed: 2,
    });

    expect(unassisted.intervalDays).toBeGreaterThan(assisted.intervalDays);
    expect(assisted.explanation.signals.some((signal) => signal.includes('hint'))).toBe(true);
  });

  it('shortens the interval as failures within an eventual success increase', () => {
    const clean = scheduleNextReview(establishedMemory, cleanSuccess);
    const recovered = scheduleNextReview(establishedMemory, {
      ...cleanSuccess,
      failures: 2,
    });

    expect(clean.intervalDays).toBeGreaterThan(recovered.intervalDays);
    expect(recovered.state.difficulty).toBeGreaterThan(clean.state.difficulty);
  });

  it('uses established memory strength when calculating the next interval', () => {
    const weak = scheduleNextReview({ ...establishedMemory, stabilityDays: 1 }, cleanSuccess);
    const strong = scheduleNextReview({ ...establishedMemory, stabilityDays: 12 }, cleanSuccess);

    expect(strong.intervalDays).toBeGreaterThan(weak.intervalDays);
  });

  it('uses previous success history to reward consistent recall', () => {
    const inconsistent = scheduleNextReview(
      {
        ...establishedMemory,
        successfulReviews: 2,
        totalReviews: 8,
        consecutiveSuccesses: 0,
        lapseCount: 6,
      },
      cleanSuccess,
    );
    const consistent = scheduleNextReview(
      {
        ...establishedMemory,
        successfulReviews: 8,
        totalReviews: 8,
        consecutiveSuccesses: 5,
        lapseCount: 0,
      },
      cleanSuccess,
    );

    expect(consistent.intervalDays).toBeGreaterThan(inconsistent.intervalDays);
  });

  it('models continuous forgetting without fixed review dates', () => {
    const atStability = calculateRetrievability(6, 6);
    const later = calculateRetrievability(6, 12);

    expect(atStability).toBeCloseTo(0.9);
    expect(later).toBeCloseTo(0.81);
  });

  it('rejects invalid observations rather than producing corrupt schedules', () => {
    expect(() =>
      scheduleNextReview(establishedMemory, { ...cleanSuccess, responseTimeMs: 0 }),
    ).toThrow(RangeError);
    expect(() => scheduleNextReview(establishedMemory, { ...cleanSuccess, hintsUsed: -1 })).toThrow(
      RangeError,
    );
  });
});
