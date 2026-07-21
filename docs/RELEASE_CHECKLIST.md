# Production release checklist

## Automated gates

- [ ] `npm ci`
- [ ] `npm run check`
- [ ] `npm run test:production`
- [ ] `npm audit --audit-level=moderate`
- [ ] `npm run package:chrome`
- [ ] Load the generated ZIP unpacked and confirm no errors on `chrome://extensions`.

## Manual product checks

- [ ] Fresh install: toolbar popup opens and local storage initializes.
- [ ] LeetCode problem: bottom-right Add question button appears after refresh.
- [ ] Side panel: detected metadata, manual capture, note, and removal work.
- [ ] AI opt-in: code is read only after affirmative consent; failure never blocks capture.
- [ ] Dashboard: Overview and Analysis work offline after first load.
- [ ] Keyboard: `Alt+Shift+A` opens capture and `Alt+Shift+D` opens the dashboard; remapping works at `chrome://extensions/shortcuts`.
- [ ] Keyboard-only navigation, visible focus, 200% zoom, screen reader labels, light/dark themes, and reduced motion.
- [ ] Chrome stable on macOS and Windows; Edge stable; Firefox package smoke test.
- [ ] Offline mode, browser restart, extension service-worker restart, and an unavailable AI API.

## Web Store gates

- [ ] Re-check the [Chrome Web Store Developer Program Policies](https://developer.chrome.com/docs/webstore/program-policies/policies) immediately before submission; the July 2026 transparency changes require every data collection practice to be prominently disclosed, with enforcement beginning August 1, 2026.
- [ ] Replace the development loopback AI endpoint with an authenticated HTTPS backend, or remove AI from the public listing/package.
- [ ] Host `PRIVACY.md` at a stable public URL and enter it in Privacy practices.
- [ ] Complete the data-use disclosure for website content, user-generated content, and local storage.
- [ ] Upload a real 1280 × 800 screenshot and 440 × 280 promotional image.
- [ ] Verify permission justifications match `docs/STORE_LISTING.md` and current behavior.
- [ ] Enable two-step verification on the publisher account.
- [ ] Start with Private or Unlisted trusted testing before Public distribution.
- [ ] Increment both package and manifest versions for every uploaded build.

Do not submit publicly while any Web Store gate is incomplete.
