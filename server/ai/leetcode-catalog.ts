export interface CatalogProblem {
  slug: string;
  title: string;
  patterns: readonly string[];
}

export const leetCodeCatalog: readonly CatalogProblem[] = [
  { slug: 'two-sum', title: 'Two Sum', patterns: ['hash map', 'complement lookup'] },
  { slug: 'valid-anagram', title: 'Valid Anagram', patterns: ['frequency counting', 'hash map'] },
  { slug: 'group-anagrams', title: 'Group Anagrams', patterns: ['hash map', 'canonical key'] },
  {
    slug: 'top-k-frequent-elements',
    title: 'Top K Frequent Elements',
    patterns: ['heap', 'bucket sort'],
  },
  {
    slug: 'product-of-array-except-self',
    title: 'Product of Array Except Self',
    patterns: ['prefix suffix'],
  },
  { slug: 'valid-sudoku', title: 'Valid Sudoku', patterns: ['hash set', 'matrix'] },
  {
    slug: 'longest-consecutive-sequence',
    title: 'Longest Consecutive Sequence',
    patterns: ['hash set'],
  },
  { slug: 'valid-palindrome', title: 'Valid Palindrome', patterns: ['two pointers'] },
  { slug: '3sum', title: '3Sum', patterns: ['sorting', 'two pointers'] },
  {
    slug: 'container-with-most-water',
    title: 'Container With Most Water',
    patterns: ['two pointers', 'greedy'],
  },
  {
    slug: 'best-time-to-buy-and-sell-stock',
    title: 'Best Time to Buy and Sell Stock',
    patterns: ['sliding window'],
  },
  {
    slug: 'longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating Characters',
    patterns: ['sliding window', 'hash map'],
  },
  {
    slug: 'minimum-window-substring',
    title: 'Minimum Window Substring',
    patterns: ['sliding window', 'frequency counting'],
  },
  { slug: 'valid-parentheses', title: 'Valid Parentheses', patterns: ['stack'] },
  { slug: 'daily-temperatures', title: 'Daily Temperatures', patterns: ['monotonic stack'] },
  { slug: 'binary-search', title: 'Binary Search', patterns: ['binary search'] },
  {
    slug: 'search-in-rotated-sorted-array',
    title: 'Search in Rotated Sorted Array',
    patterns: ['binary search'],
  },
  {
    slug: 'reverse-linked-list',
    title: 'Reverse Linked List',
    patterns: ['linked list', 'iteration'],
  },
  { slug: 'linked-list-cycle', title: 'Linked List Cycle', patterns: ['fast and slow pointers'] },
  {
    slug: 'merge-two-sorted-lists',
    title: 'Merge Two Sorted Lists',
    patterns: ['linked list', 'merge'],
  },
  {
    slug: 'invert-binary-tree',
    title: 'Invert Binary Tree',
    patterns: ['tree traversal', 'recursion'],
  },
  {
    slug: 'maximum-depth-of-binary-tree',
    title: 'Maximum Depth of Binary Tree',
    patterns: ['depth-first search', 'breadth-first search'],
  },
  {
    slug: 'binary-tree-level-order-traversal',
    title: 'Binary Tree Level Order Traversal',
    patterns: ['breadth-first search'],
  },
  {
    slug: 'validate-binary-search-tree',
    title: 'Validate Binary Search Tree',
    patterns: ['tree traversal', 'bounds'],
  },
  {
    slug: 'kth-smallest-element-in-a-bst',
    title: 'Kth Smallest Element in a BST',
    patterns: ['inorder traversal'],
  },
  {
    slug: 'number-of-islands',
    title: 'Number of Islands',
    patterns: ['graph traversal', 'flood fill'],
  },
  { slug: 'clone-graph', title: 'Clone Graph', patterns: ['graph traversal', 'hash map'] },
  {
    slug: 'course-schedule',
    title: 'Course Schedule',
    patterns: ['topological sort', 'cycle detection'],
  },
  {
    slug: 'pacific-atlantic-water-flow',
    title: 'Pacific Atlantic Water Flow',
    patterns: ['graph traversal', 'reverse search'],
  },
  { slug: 'climbing-stairs', title: 'Climbing Stairs', patterns: ['dynamic programming'] },
  {
    slug: 'house-robber',
    title: 'House Robber',
    patterns: ['dynamic programming', 'state compression'],
  },
  {
    slug: 'coin-change',
    title: 'Coin Change',
    patterns: ['dynamic programming', 'unbounded knapsack'],
  },
  {
    slug: 'longest-increasing-subsequence',
    title: 'Longest Increasing Subsequence',
    patterns: ['dynamic programming', 'binary search'],
  },
  { slug: 'word-break', title: 'Word Break', patterns: ['dynamic programming', 'trie'] },
  { slug: 'combination-sum', title: 'Combination Sum', patterns: ['backtracking'] },
  { slug: 'permutations', title: 'Permutations', patterns: ['backtracking'] },
  { slug: 'subsets', title: 'Subsets', patterns: ['backtracking', 'bitmask'] },
  { slug: 'merge-intervals', title: 'Merge Intervals', patterns: ['intervals', 'sorting'] },
  { slug: 'insert-interval', title: 'Insert Interval', patterns: ['intervals'] },
  { slug: 'rotate-image', title: 'Rotate Image', patterns: ['matrix', 'in-place transformation'] },
  { slug: 'spiral-matrix', title: 'Spiral Matrix', patterns: ['matrix', 'simulation'] },
] as const;

const catalogBySlug = new Map(leetCodeCatalog.map((problem) => [problem.slug, problem]));

export function resolveCatalogProblems(slugs: readonly string[]): CatalogProblem[] {
  const resolved: CatalogProblem[] = [];
  const seen = new Set<string>();

  for (const slug of slugs) {
    const problem = catalogBySlug.get(slug);
    if (problem !== undefined && !seen.has(slug)) {
      resolved.push(problem);
      seen.add(slug);
    }
  }

  return resolved;
}

export function buildLeetCodeUrl(slug: string): string {
  return `https://leetcode.com/problems/${slug}/`;
}
