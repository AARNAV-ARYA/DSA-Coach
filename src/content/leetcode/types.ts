export interface LeetCodeProblemContext {
  provider: 'leetcode';
  problemId: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  url: string;
}
