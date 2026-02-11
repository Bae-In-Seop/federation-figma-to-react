/// <reference types="vitest/config" />
import 'dotenv/config';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

function figmaApiDevPlugin(): Plugin {
  return {
    name: 'figma-api-dev',
    configureServer(server) {
      // Middleware to proxy API routes to serverless function handlers
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // Serve package files from dist/packages
        if (url.startsWith('/packages/')) {
          const fs = await import('fs');
          const path = await import('path');
          const filename = url.replace('/packages/', '');
          const filePath = path.join(process.cwd(), 'dist', 'packages', filename);

          try {
            const fileBuffer = fs.readFileSync(filePath);
            res.setHeader('Content-Type', 'application/gzip');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.end(fileBuffer);
            return;
          } catch (err) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Package file not found' }));
            return;
          }
        }

        // Route to appropriate handler based on URL
        if (url.startsWith('/api/')) {
          try {
            // Extract path and query
            const [pathname, search] = url.split('?');
            const query: Record<string, string> = {};
            if (search) {
              new URLSearchParams(search).forEach((value, key) => {
                query[key] = value;
              });
            }

            // Read request body for POST/DELETE
            let body: any = {};
            if (req.method === 'POST' || req.method === 'DELETE') {
              let rawBody = '';
              for await (const chunk of req) {
                rawBody += chunk;
              }
              if (rawBody) {
                try {
                  body = JSON.parse(rawBody);
                } catch {
                  body = {};
                }
              }
            }

            // Create request/response objects matching Vercel handler signature
            const vercelReq = { method: req.method, body, query } as any;
            const vercelRes = {
              status: (code: number) => {
                res.statusCode = code;
                return vercelRes;
              },
              json: (data: any) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              },
            } as any;

            // Route to handlers (specific paths before dynamic catch-all)
            if (pathname === '/api/figma') {
              const { default: handler } = await import('./api/figma.ts');
              await handler(vercelReq, vercelRes);
              return;
            } else if (pathname === '/api/components/save') {
              const { default: handler } = await import('./api/components/save.ts');
              await handler(vercelReq, vercelRes);
              return;
            } else if (pathname === '/api/components/delete') {
              const { default: handler } = await import('./api/components/delete.ts');
              await handler(vercelReq, vercelRes);
              return;
            } else if (pathname === '/api/components') {
              const { default: handler } = await import('./api/components.ts');
              await handler(vercelReq, vercelRes);
              return;
            } else if (pathname.match(/^\/api\/components\/[^/]+$/)) {
              const id = pathname.split('/').pop();
              vercelReq.query = { ...query, id };
              const { default: handler } = await import('./api/components/[id].ts');
              await handler(vercelReq, vercelRes);
              return;
            } else if (pathname === '/api/package/build') {
              const { default: handler } = await import('./api/package/build.ts');
              await handler(vercelReq, vercelRes);
              return;
            } else if (pathname === '/api/package/info') {
              const { default: handler } = await import('./api/package/info.ts');
              await handler(vercelReq, vercelRes);
              return;
            }
          } catch (err) {
            console.error('API handler error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }));
            return;
          }
        }

        // Not an API route, continue to next middleware
        next();
      });
    },
  };
}

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [figmaApiDevPlugin(), react()],
  test: {
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.ts']
      }
    }]
  }
});
