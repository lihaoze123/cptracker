import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

export default defineConfig({
  plugins: [
    react(),
    monkey({
      entry: "src/main.tsx",
      userscript: {
        name: {
          "": "CP Tracker Import",
          zh: "CP Tracker 导入",
        },
        description: {
          "": "Open CP Tracker import form on the current OJ page.",
          zh: "在当前 OJ 页面内打开 CP Tracker 导入表单。",
        },
        namespace: "https://github.com/lihaoze123/cptracker",
        match: [
          "https://codeforces.com/contest/*/problem/*",
          "https://*.codeforces.com/contest/*/problem/*",
          "https://codeforces.com/problemset/problem/*/*",
          "https://*.codeforces.com/problemset/problem/*/*",
          "https://codeforces.com/gym/*/problem/*",
          "https://*.codeforces.com/gym/*/problem/*",
          "https://atcoder.jp/contests/*/tasks/*",
          "https://www.luogu.com.cn/problem/*",
          "https://ac.nowcoder.com/acm/problem/*",
          "https://ac.nowcoder.com/acm/contest/*/*",
          "https://leetcode.com/problems/*",
          "https://leetcode.cn/problems/*",
          "https://qoj.ac/problem/*",
          "https://qoj.ac/contest/*/problem/*",
          "https://vjudge.net/problem/*",
        ],
        grant: ["GM_getValue", "GM_openInTab", "GM_registerMenuCommand", "GM_setValue"],
        "run-at": "document-idle",
      },
    }),
  ],
});
