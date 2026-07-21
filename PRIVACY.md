# DSA Coach Privacy Policy

**Effective date:** 21 July 2026

DSA Coach is a local-first study extension for remembering data-structures-and-algorithms problems. This policy explains what the current extension handles and why.

## Data handled on your device

DSA Coach stores the following in extension-local browser storage:

- problems you explicitly add, including title, difficulty, canonical LeetCode URL, confidence/outcome, review date, and optional private note;
- locally captured solution code only when you explicitly enable AI analysis for that question;
- generated analysis and your edits;
- theme and small device preferences.

The extension reads only allowlisted LeetCode problem metadata needed for capture. It does not read passwords, cookies, browsing history, private messages, or arbitrary pages. It reads the active LeetCode code editor once only after you select AI analysis and confirm adding the question.

## AI processing

AI is optional. When you explicitly request it, the selected problem metadata and solution code are sent to the separately running DSA Coach API, which sends the request to Groq to generate the requested study material. The Groq API key is never included in the extension package or browser storage. Core capture and revision work without AI.

The current API binds only to the local computer and is for development testing. A public release that offers AI must update this policy with the deployed processor, retention terms, authentication, and production endpoint before publication.

## Use and sharing

DSA Coach uses data only to provide its study, revision, reminder, and explicitly requested AI features. It does not sell user data, use it for advertising, or transfer it for unrelated purposes. Human access to private local records is not provided.

DSA Coach's use of information received from browser APIs complies with the Chrome Web Store User Data Policy, including the Limited Use requirements.

## Retention and deletion

Local records remain until you remove a question or uninstall the extension. Removing a question also removes its linked AI analysis. Uninstalling DSA Coach removes its extension-local browser storage under normal browser behavior.

## Security

Extension code is bundled with the published package under Manifest V3. Remote executable code is not used. Sensitive storage is restricted to trusted extension contexts on browsers that support that protection.

## Changes and contact

Material data-handling changes will be disclosed before they take effect. Questions or deletion concerns can be submitted through the project's [GitHub issue tracker](https://github.com/AARNAV-ARYA/DSA-Coach/issues).
