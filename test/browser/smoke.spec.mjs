import { test, expect } from '@playwright/test';

const editable = '.rich-editor-area, [contenteditable="true"]';

test('prompt demo: editor mounts and takes input', async ({ page }) => {
  await page.goto('/demos/prompt.html');
  const area = page.locator(`#yjd-stage ${editable}`).first();
  await expect(area).toBeVisible();
  await area.click();
  await page.keyboard.type('hello smoke');
  await expect(area).toContainText('hello smoke');
});

test('standard demo: a full toolbar renders with the editor', async ({ page }) => {
  await page.goto('/demos/standard.html');
  await expect(page.locator('#yjd-stage .yjd-rich-editor')).toBeVisible();
  await expect(page.locator('#yjd-stage .rich-editor-toolbar-btn').first()).toBeVisible();
});

test('React example: typing flows into the bound value', async ({ page }) => {
  await page.goto('/examples/react.html');
  await page.waitForSelector('.yjd-rich-editor', { timeout: 20_000 });
  await page.locator(editable).first().click();
  await page.keyboard.type(' RX');
  await expect(page.locator('#out')).toContainText('RX');
});

test('Vue example: v-model reflects typing', async ({ page }) => {
  await page.goto('/examples/vue.html');
  await page.waitForSelector('.yjd-rich-editor', { timeout: 20_000 });
  await page.locator(editable).first().click();
  await page.keyboard.type(' VX');
  await expect(page.locator('#out')).toContainText('VX');
});
