#!/usr/bin/env node
/**
 * Acceptance Test Runner — Label Visibility
 * Loads test_label_visibility.html in a headless Chromium and captures console output.
 */
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox'],
    });

    const page = await browser.newPage();
    
    // Forward all console messages
    const lines = [];
    page.on('console', msg => {
        const text = msg.text();
        lines.push(text);
        process.stdout.write(text + '\n');
    });

    page.on('pageerror', err => {
        console.error('PAGE ERROR:', err.message);
    });

    // Navigate to the test page
    await page.goto('http://localhost:8765/test_label_visibility.html', {
        waitUntil: 'networkidle0',
        timeout: 30000,
    });

    // Wait for the test to complete (look for ACCEPTANCE TEST result)
    await page.waitForFunction(() => {
        const el = document.getElementById('results');
        return el && (el.textContent.includes('ACCEPTANCE TEST PASSED') || el.textContent.includes('ACCEPTANCE TEST FAILED'));
    }, { timeout: 30000 });

    // Get the full results text
    const resultsText = await page.evaluate(() => document.getElementById('results').textContent);
    
    // Print results
    console.log('\n=== FULL TEST OUTPUT ===');
    console.log(resultsText);

    const passed = resultsText.includes('ACCEPTANCE TEST PASSED');
    
    await browser.close();
    process.exit(passed ? 0 : 1);
})();
