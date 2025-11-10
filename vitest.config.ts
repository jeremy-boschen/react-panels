import {defineConfig} from 'vitest/config';
import {resolve} from 'path';
import {playwright} from '@vitest/browser-playwright';

export default defineConfig({
    test: {
        globals: true,
        browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [
                {browser: 'chromium'},
                {browser: 'firefox'},
                {browser: 'webkit'},
            ],
        },
        setupFiles: ['./src/__tests__/setup.ts'],
        testTimeout: 10000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json', 'json-summary'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/index.ts',
                'src/types.ts',
                'src/**/*.test.{ts,tsx}',
                'src/__tests__/**',
                'src/**/*.d.ts',
            ],
            thresholds: {
                branches: 90,
                functions: 90,
                lines: 90,
                statements: 90,
            },
        },
        reporters: ['junit', 'json', 'default'],
        outputFile: {
            junit: './src/__tests__/__reports__/junit-report.xml',
            json: './src/__tests__/__reports__/json-report.json',
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});
