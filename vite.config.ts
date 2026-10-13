import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), {
    name: 'inline-study-artifact',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = bundle['index.html'];
      if (!html || html.type !== 'asset') return;
      let content = String(html.source);
      for (const [name, asset] of Object.entries(bundle)) {
        if (asset.type === 'chunk' && asset.isEntry) {
          content = content.replace(/<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/,
            () => `<script type="module">${asset.code.replace(/<\/script/gi, '<\\/script')}</script>`);
          delete bundle[name];
        } else if (asset.type === 'asset' && name.endsWith('.css')) {
          content = content.replace(/<link[^>]*rel="stylesheet"[^>]*>/,
            () => `<style>${String(asset.source)}</style>`);
          delete bundle[name];
        }
      }
      html.source = content;
    },
  }],
  build: { cssCodeSplit: false, rollupOptions: { output: { inlineDynamicImports: true } } },
  test: { include: ['tests/unit/**/*.test.ts'] },
});