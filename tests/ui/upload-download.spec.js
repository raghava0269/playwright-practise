import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/** UPLOAD & DOWNLOAD — demo site: https://the-internet.herokuapp.com */
const UPLOAD_FILE = path.join(__dirname, '../../test-data/files/sample-upload.txt');

test.describe('Upload and Download', { tag: '@files' }, () => {
  test('upload a file with setInputFiles', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/upload');

    await page.locator('#file-upload').setInputFiles(UPLOAD_FILE);
    await page.locator('#file-submit').click();

    await expect(page.getByRole('heading', { name: 'File Uploaded!' })).toBeVisible();
    await expect(page.locator('#uploaded-files')).toHaveText('sample-upload.txt');
  });

  test('upload an in-memory file via the file chooser', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/upload');

    // Wait for the native file dialog, then answer it — no file on disk needed.
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('#drag-drop-upload').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({ name: 'generated.txt', mimeType: 'text/plain', buffer: Buffer.from('created in test') });

    await expect(page.locator('#drag-drop-upload')).toContainText('generated.txt');
  });

  test('download a file and verify its content', async ({ page }, testInfo) => {
    // Build a tiny page with a download link so the test does not depend on
    // whatever files the public demo server currently has.
    await page.setContent(`<a href="data:text/plain,Hello%20Download" download="report.txt">Download report</a>`);

    const downloadPromise = page.waitForEvent('download'); // start waiting BEFORE clicking
    await page.getByRole('link', { name: 'Download report' }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('report.txt');

    const savePath = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(savePath);
    expect(fs.existsSync(savePath)).toBeTruthy();
    expect(fs.readFileSync(savePath, 'utf-8')).toBe('Hello Download');
  });
});
