import {
  isExtensionMessage,
  type ActiveProblemContextResponse,
  type ProblemContext,
} from '@/shared/lib/messaging/contracts';

const activeContextsStorageKey = 'dsa-coach.active-problem-contexts';
const revisionStorageKey = 'dsa-coach.revision-problems.v1';
const notifiedReviewsStorageKey = 'dsa-coach.notified-reviews.v1';
const reviewScanAlarm = 'dsa-coach.review-scan';
const notificationPrefix = 'dsa-coach.review.';
const snoozeDays = 1;

type ContextByTab = Record<string, ProblemContext>;
type RevisionOutcome = 'mastered' | 'understood' | 'needed-hint' | 'saw-solution' | 'couldnt-solve';
type StoredRevisionProblem = {
  id: string;
  title: string;
  outcome: RevisionOutcome;
  reviewDate: string;
  source?: ProblemContext;
};
type NotifiedReviews = Record<string, string>;

async function configureActionBehavior(): Promise<void> {
  // This was enabled by the previous build. Explicitly clear it so the manifest's
  // default popup remains the toolbar action while browser integration is configured.
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
}

chrome.runtime.onInstalled.addListener(() => {
  void configureActionBehavior();
  void configureReviewAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  void configureActionBehavior();
  void configureReviewAlarm();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes[revisionStorageKey] !== undefined) {
    void notifyDueReviews();
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === reviewScanAlarm) void notifyDueReviews();
});

chrome.notifications.onClicked.addListener((notificationId) => {
  if (!notificationId.startsWith(notificationPrefix)) return;
  void openReview(notificationId.slice(notificationPrefix.length));
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (!notificationId.startsWith(notificationPrefix)) return;

  const problemId = notificationId.slice(notificationPrefix.length);
  if (buttonIndex === 0) void openReview(problemId);
  if (buttonIndex === 1) void rescheduleFromNotification(problemId, snoozeDays);
});

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (!isExtensionMessage(message)) return;

  if (message.type === 'shell.open-dashboard') {
    void chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    return;
  }

  if (message.type === 'shell.open-side-panel') {
    if (sender.tab?.id !== undefined) void chrome.sidePanel.open({ tabId: sender.tab.id });
    return;
  }

  if (message.type === 'problem.context.detected') {
    if (sender.tab?.id !== undefined) void persistContext(sender.tab.id, message.context);
    return;
  }

  if (message.type === 'capture.active-context.request') {
    void getActiveContext().then((context) =>
      sendResponse({ context } satisfies ActiveProblemContextResponse),
    );
    return true;
  }

  if (message.type === 'review.added') {
    void notifyReviewAdded(message.title, message.reviewDate);
    return;
  }

  if (message.type === 'review.completed') {
    void notifyReviewCompleted(message.title, message.nextReviewDate);
  }
});

async function persistContext(tabId: number, context: ProblemContext): Promise<void> {
  const stored = await chrome.storage.session.get(activeContextsStorageKey);
  const contexts = (stored[activeContextsStorageKey] as ContextByTab | undefined) ?? {};
  await chrome.storage.session.set({
    [activeContextsStorageKey]: { ...contexts, [String(tabId)]: context },
  });
}

async function getActiveContext(): Promise<ProblemContext | null> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab?.id === undefined) return null;

  const stored = await chrome.storage.session.get(activeContextsStorageKey);
  const contexts = stored[activeContextsStorageKey] as ContextByTab | undefined;
  return contexts?.[String(activeTab.id)] ?? null;
}

async function configureReviewAlarm(): Promise<void> {
  await chrome.alarms.create(reviewScanAlarm, { periodInMinutes: 15 });
  await notifyDueReviews();
}

async function notifyDueReviews(): Promise<void> {
  const stored = await chrome.storage.local.get([revisionStorageKey, notifiedReviewsStorageKey]);
  const problems = isStoredRevisionProblemList(stored[revisionStorageKey])
    ? stored[revisionStorageKey]
    : [];
  const notified = isNotifiedReviews(stored[notifiedReviewsStorageKey])
    ? stored[notifiedReviewsStorageKey]
    : {};
  const currentDate = today();

  for (const problem of problems) {
    if (problem.reviewDate > currentDate || notified[problem.id] === problem.reviewDate) continue;

    const notificationId = `${notificationPrefix}${problem.id}`;
    try {
      await chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: 'assets/dsa-coach-mascot.png',
        title: 'Review due · DSA Coach',
        message: `${problem.title} is ready for a quick review.`,
        contextMessage: 'Review Now or Snooze. Completed and Skip are available in the dashboard.',
        buttons: [{ title: 'Review Now' }, { title: 'Snooze 1 day' }],
        priority: 1,
      });
      notified[problem.id] = problem.reviewDate;
    } catch {
      // Notifications can be unavailable in restricted browser profiles. The alarm remains safe.
    }
  }

  for (const problemId of Object.keys(notified)) {
    if (!problems.some((problem) => problem.id === problemId)) delete notified[problemId];
  }
  await chrome.storage.local.set({ [notifiedReviewsStorageKey]: notified });
}

async function notifyReviewAdded(title: string, reviewDate: string): Promise<void> {
  await createCelebrationNotification(
    'review-added',
    'Question added ✨',
    `${title} is now in your revision library.`,
    `Next review: ${formatNotificationDate(reviewDate)} · Future you says thanks!`,
  );
}

async function notifyReviewCompleted(title: string, nextReviewDate: string): Promise<void> {
  await createCelebrationNotification(
    'review-completed',
    'Revision complete 🎉',
    `You finished ${title}. Great work!`,
    `Next review: ${formatNotificationDate(nextReviewDate)} · Keep the momentum going.`,
  );
}

async function createCelebrationNotification(
  kind: string,
  title: string,
  message: string,
  contextMessage: string,
): Promise<void> {
  try {
    await chrome.notifications.create(`dsa-coach.${kind}.${Date.now()}`, {
      type: 'basic',
      iconUrl: 'assets/dsa-coach-mascot.png',
      title,
      message,
      contextMessage,
      priority: 1,
    });
  } catch {
    // Notifications can be unavailable in restricted browser profiles.
  }
}

function formatNotificationDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) return value;
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(
    new Date(year, month - 1, day),
  );
}

async function openReview(problemId: string): Promise<void> {
  const problem = await getStoredProblem(problemId);
  await chrome.notifications.clear(`${notificationPrefix}${problemId}`);
  await chrome.tabs.create({
    url: problem?.source?.url ?? chrome.runtime.getURL('index.html#today'),
  });
}

async function rescheduleFromNotification(problemId: string, days: number): Promise<void> {
  await updateStoredProblem(problemId, (problem) => ({
    ...problem,
    reviewDate: dateFromToday(days),
  }));
  await chrome.notifications.clear(`${notificationPrefix}${problemId}`);
}

async function getStoredProblem(problemId: string): Promise<StoredRevisionProblem | undefined> {
  const stored = await chrome.storage.local.get(revisionStorageKey);
  if (!isStoredRevisionProblemList(stored[revisionStorageKey])) return undefined;
  return stored[revisionStorageKey].find((problem) => problem.id === problemId);
}

async function updateStoredProblem(
  problemId: string,
  update: (problem: StoredRevisionProblem) => StoredRevisionProblem,
): Promise<void> {
  const stored = await chrome.storage.local.get(revisionStorageKey);
  if (!isStoredRevisionProblemList(stored[revisionStorageKey])) return;

  const problems = stored[revisionStorageKey].map((problem) =>
    problem.id === problemId ? update(problem) : problem,
  );
  await chrome.storage.local.set({ [revisionStorageKey]: problems });
  const notified = await chrome.storage.local.get(notifiedReviewsStorageKey);
  const notifiedReviews = isNotifiedReviews(notified[notifiedReviewsStorageKey])
    ? { ...notified[notifiedReviewsStorageKey] }
    : {};
  delete notifiedReviews[problemId];
  await chrome.storage.local.set({ [notifiedReviewsStorageKey]: notifiedReviews });
}

function isStoredRevisionProblemList(value: unknown): value is StoredRevisionProblem[] {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (typeof item !== 'object' || item === null) return false;
      const problem = item as Record<string, unknown>;
      return (
        typeof problem.id === 'string' &&
        typeof problem.title === 'string' &&
        typeof problem.reviewDate === 'string' &&
        isRevisionOutcome(problem.outcome) &&
        (problem.source === undefined || isProblemContext(problem.source))
      );
    })
  );
}

function isRevisionOutcome(value: unknown): value is RevisionOutcome {
  return (
    value === 'mastered' ||
    value === 'understood' ||
    value === 'needed-hint' ||
    value === 'saw-solution' ||
    value === 'couldnt-solve'
  );
}

function isNotifiedReviews(value: unknown): value is NotifiedReviews {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((reviewDate) => typeof reviewDate === 'string')
  );
}

function isProblemContext(value: unknown): value is ProblemContext {
  if (typeof value !== 'object' || value === null) return false;
  const context = value as Partial<ProblemContext>;
  return (
    context.provider === 'leetcode' &&
    typeof context.problemId === 'string' &&
    typeof context.title === 'string' &&
    (context.difficulty === 'Easy' ||
      context.difficulty === 'Medium' ||
      context.difficulty === 'Hard') &&
    typeof context.url === 'string'
  );
}

function today(): string {
  return dateFromToday(0);
}

function dateFromToday(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}
