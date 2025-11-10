import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import { codecovVitePlugin } from "@codecov/vite-plugin";
import {resolve} from 'path';
import {copyFileSync} from 'fs';

const ReactCompilerConfig = {
  /* ... */
};

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'React Adjustable Panels',
            fileName: 'index',
            formats: ['es']
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime'],
            output: {
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM'
                },
                assetFileNames: (assetInfo) => {
                    if (assetInfo.names.includes('style.css')) return 'style.css';
                    return assetInfo.names.length || 'asset';
                }
            }
        },
        sourcemap: true,
        minify: true,
        cssCodeSplit: false
    },
    plugins: [
        react({
            babel: {
                plugins: [
                    ['babel-plugin-react-compiler', ReactCompilerConfig],
                ],
            },
        }),
        {
            name: 'copy-css',
            writeBundle() {
                try {
                    copyFileSync(
                        resolve(__dirname, 'src/style.css'),
                        resolve(__dirname, 'dist/style.css')
                    );
                } catch (e) {
                    console.warn('Could not copy CSS file:', e);
                }
            }
        },
        // Put the Codecov vite plugin after all other plugins
        codecovVitePlugin({
            enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
            bundleName: "jeremy-boschen/react-adjustable-panels",
            uploadToken: process.env.CODECOV_TOKEN,
        }),
    ]
});
