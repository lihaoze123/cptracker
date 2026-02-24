import { defineConfig } from 'wxt';
import tailwindcss from "@tailwindcss/vite";
import { OJ_HOST_PERMISSIONS } from './utils/platform-manifest';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'CPTracker Import',
    description: '一键从 Codeforces/AtCoder 导入题目到 CPTracker',
    version: packageJson.version,
    permissions: [
      'storage',
      'activeTab',
      'scripting',
      'tabs'
    ],
    host_permissions: [
      ...OJ_HOST_PERMISSIONS,
      '*://clist.by/*',
      '*://competitive-programming-tracker.netlify.app/*'
    ],
    action: {
      default_popup: 'entrypoints/popup/index.html',
    },
  }
});
