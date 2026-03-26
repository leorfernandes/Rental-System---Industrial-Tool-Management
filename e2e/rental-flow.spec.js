const { test, expect } = require('@playwright/test');

test.describe('Modular Asset Lifecycle', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8888');
    });

    test('Step 1: Renting an Available Asset', async ({ page }) => {
        const card = page.locator('.asset-card', { hasText: 'Available' }).first();
        const assetName = await card.locator('h3').innerText();
        
        await card.getByRole('button', { name: /Rent Equipment/i }).click();
        await page.fill('#customer-name', 'Leo Fernandes');
        await page.fill('#return-date', '2026-12-31');
        await page.click('button:has-text("Confirm Rental")');

        await expect(page.locator('.asset-card', { hasText: assetName }).locator('.status-badge')).toContainText('Rented');
    });

    test('Step 2: Returning a Rented Asset', async ({ page }) => {
    const card = page.locator('.asset-card', { hasText: 'Rented' }).first();
    const assetName = await card.locator('h3').innerText();

    await card.getByRole('button', { name: /Return Tool/i }).click();

    await expect(page.locator('.asset-card', { hasText: assetName }).locator('.status-badge')).toContainText('Maintenance', { timeout: 5000 });
    });

    test('Step 3: Clearing Maintenance', async ({ page }) => {
        const card = page.locator('.asset-card', { hasText: 'Maintenance' }).first();
        const assetName = await card.locator('h3').innerText();
        page.on('dialog', dialog => dialog.accept());

        await card.getByRole('button', { name: /Log Inspection/i }).click();
        await expect(page.locator('.asset-card', { hasText: assetName }).locator('.status-badge')).toContainText('Available');
    });
});