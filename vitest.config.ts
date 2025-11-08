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
                { browser: 'chromium' },
                { browser: 'firefox' },
                { browser: 'webkit' },
            ],
        },
        setupFiles: ['./src/__tests__/setup.ts'],
        testTimeout: 10000,
        coverage: {
            provider: 'istanbul',
            reporter: ['text', 'html', 'json'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/**/*.test.{ts,tsx}',
                'src/__tests__/**',
                'src/**/*.d.ts',
            ],
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});
