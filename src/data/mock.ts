export interface SolvedProblem {
  id: number;
  题目: string;
  难度: string;
  题解: string;
  关键词: string;
  日期: string;
  supabase_id?: string;
}

export const mockProblems: SolvedProblem[] = [
  {
    id: 1,
    题目: "https://codeforces.com/contest/145/problem/C",
    难度: "2100",
    题解: `这是一个题解\n\n$\\LaTeX$ 演示 \n\`\`\`cpp
#include <bits/stdc++.h>
using i64 = long long;
int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    return 0;
}
\`\`\``,
    关键词: "DP, 计数 DP, 组合数学, 背包",
    日期: "2025-04-02 09:10:00",
  },
  {
    id: 2,
    题目: "https://codeforces.com/contest/1800/problem/E2",
    难度: "1900",
    题解: "[题解链接](https://github.com/user/solutions/1800E2.cpp)",
    关键词: "贪心, 字符串, 构造, favorited",
    日期: "2025-04-02 14:30:00",
  },
];
