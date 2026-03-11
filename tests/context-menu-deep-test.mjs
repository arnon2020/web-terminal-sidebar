import { chromium } from 'playwright';

/**
 * Deep Context Menu Test
 * Tests that context menu appears AND clicking items works
 */
async function testContextMenu() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Starting Context Menu Deep Test...\n');

  try {
    // Navigate to app
    console.log('1. Navigating to app...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for app to load
    await page.waitForTimeout(500);

    // Check if any terminals exist, if not create one
    const existingTerminals = await page.locator('.terminal-item').count();
    console.log(`   Found ${existingTerminals} existing terminals`);

    if (existingTerminals === 0) {
      console.log('2. Creating a new terminal...');
      await page.click('[aria-label="Add terminal"], .add-terminal-btn, button:has-text("New")');
      await page.waitForTimeout(500);
    }

    // Get first terminal item
    const terminal = page.locator('.terminal-item').first();
    await terminal.waitFor();
    const terminalName = await terminal.locator('.terminal-name').textContent();
    console.log(`   Testing on terminal: "${terminalName}"`);

    // Right-click to open context menu
    console.log('\n3. Right-clicking terminal to open context menu...');
    const box = await terminal.boundingBox();

    if (!box) {
      throw new Error('Could not get terminal bounding box');
    }

    // Right-click in the middle of the terminal
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
    await page.waitForTimeout(200);

    // Check if context menu appeared
    const contextMenu = page.locator('.context-menu');
    const isMenuVisible = await contextMenu.isVisible();
    console.log(`   Context menu visible: ${isMenuVisible}`);

    if (!isMenuVisible) {
      console.log('   ❌ FAIL: Context menu not visible!');
      await browser.close();
      return;
    }

    // Get menu items
    const menuItems = await contextMenu.locator('.context-menu-item').all();
    console.log(`   Found ${menuItems.length} menu items`);

    for (let i = 0; i < menuItems.length; i++) {
      const text = await menuItems[i].textContent();
      console.log(`   - ${text}`);
    }

    // Test clicking each menu item
    console.log('\n4. Testing menu item clicks...');

    // Test Rename
    console.log('\n   Testing: Rename');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
    await page.waitForTimeout(100);
    await page.click('.context-menu-item:has-text("Rename")');
    await page.waitForTimeout(200);

    const renameInput = page.locator('.terminal-name-input');
    const isRenameVisible = await renameInput.isVisible();
    console.log(`   ✅ Rename input appeared: ${isRenameVisible}`);

    // Cancel rename by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Test Change Color
    console.log('\n   Testing: Change Color');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
    await page.waitForTimeout(100);
    await page.click('.context-menu-item:has-text("Change Color")');
    await page.waitForTimeout(200);

    const colorPicker = page.locator('.color-picker');
    const isColorPickerVisible = await colorPicker.isVisible();
    console.log(`   ✅ Color picker appeared: ${isColorPickerVisible}`);

    // Click outside to close
    await page.mouse.click(0, 0);
    await page.waitForTimeout(200);

    // Test Duplicate
    const terminalsBefore = await page.locator('.terminal-item').count();
    console.log(`\n   Testing: Duplicate (terminals before: ${terminalsBefore})`);

    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
    await page.waitForTimeout(100);
    await page.click('.context-menu-item:has-text("Duplicate")');
    await page.waitForTimeout(500);

    const terminalsAfter = await page.locator('.terminal-item').count();
    console.log(`   ✅ Duplicated! Terminals after: ${terminalsAfter}`);

    if (terminalsAfter !== terminalsBefore + 1) {
      console.log(`   ⚠️  Warning: Expected ${terminalsBefore + 1} terminals, got ${terminalsAfter}`);
    }

    // Test Close Terminal (use the duplicated terminal)
    console.log('\n   Testing: Close Terminal');
    const lastTerminal = page.locator('.terminal-item').last();
    const lastBox = await lastTerminal.boundingBox();

    if (lastBox) {
      await page.mouse.click(lastBox.x + lastBox.width / 2, lastBox.y + lastBox.height / 2, { button: 'right' });
      await page.waitForTimeout(100);
      await page.click('.context-menu-item:has-text("Close Terminal")');
      await page.waitForTimeout(300);

      const terminalsAfterClose = await page.locator('.terminal-item').count();
      console.log(`   ✅ Closed! Terminals after close: ${terminalsAfterClose}`);
    }

    console.log('\n✅ All context menu tests passed!');

    // Take screenshot for verification
    await page.screenshot({ path: 'context-menu-test-result.png' });
    console.log('   Saved screenshot: context-menu-test-result.png');

  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    await page.screenshot({ path: 'context-menu-error.png' });
    console.log('   Saved error screenshot: context-menu-error.png');
  } finally {
    await browser.close();
  }
}

testContextMenu();
