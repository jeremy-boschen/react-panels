#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('\n📦 Installing Playwright browsers (Chromium, Firefox, WebKit)...');
console.log('This may take a few minutes on first install (~500MB download).\n');

try {
    execSync('playwright install chromium firefox webkit', {
        stdio: 'inherit', // Show all output including progress
    });
    console.log('\n✅ Playwright browsers installed successfully!\n');
} catch (error) {
    console.error('\n⚠️  Playwright browser installation failed.');
    console.error('You can manually install them later by running: yarn playwright install\n');
    // Don't fail the entire install if browsers fail to download
    process.exit(0);
}
