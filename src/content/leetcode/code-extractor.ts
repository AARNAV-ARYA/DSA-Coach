const codeEditorSelectors = [
  'textarea[aria-label="Code editor"]',
  '.monaco-editor textarea.inputarea',
] as const;

const MAX_CAPTURED_CODE_LENGTH = 20_000;

interface CodeEditorRoot {
  querySelector: (selector: string) => { value?: unknown } | null;
}

/** Reads only the active LeetCode editor value after an explicit UI request. */
export function extractLeetCodeSolutionCode(root: CodeEditorRoot = document): string | null {
  for (const selector of codeEditorSelectors) {
    const value = root.querySelector(selector)?.value;
    if (typeof value !== 'string' || value.trim() === '') continue;
    return value.trim().slice(0, MAX_CAPTURED_CODE_LENGTH);
  }

  return null;
}
