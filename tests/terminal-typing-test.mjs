import { chromium } from 'playwright';

/**
 * Terminal Typing Test
 * 
 * Tests that users can type commands into the ttyd terminal
 * 
 * Key scenarios:
 * 1. Click on terminal to focus
 * 2. Type a simple command (echo, ls, pwd)
 * 3. Verify the command appears in the terminal
 * 4. Test keyboard shortcuts (Ctrl+C, Enter)
 */
async function testTerminalTyping() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 // Slow down for visibility
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Starting Terminal Typing Test...\n');

  try {
    console.log('1. Starting dev server (assuming running on port 3000)...');
    // Make sure server is running: cd /home/user/web-terminal-sidebar && bun run dev
    
    console.log('2. Navigating to app...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check if terminals exist
    let terminalCount = await page.locator('.terminal-item').count();
    console.log(`   Found ${terminalCount} terminals`);

    if (terminalCount === 0) {
      console.log('3. Creating a terminal first...');
      await page.click('.add-terminal');
      await page.waitForTimeout(300);
      
      // Type terminal name
      const nameInput = page.locator('.modal-input').first();
      await nameInput.fill('Test Terminal');
      await page.waitForTimeout(200);
      
      // Click Add
      await page.click('.modal-btn-primary');
      await page.waitForTimeout(1000);
      
      terminalCount = await page.locator('.terminal-item').count();
      console.log(`   Now have ${terminalCount} terminal(s)`);
    }

    // Select first terminal
    const firstTerminal = page.locator('.terminal-item').first();
    await firstTerminal.click();
    await page.waitForTimeout(500);
    console.log('   Selected first terminal');

    console.log('\n4. Finding terminal iframe...');
    const iframe = page.locator('.terminal-iframe.active').first();
    await iframe.waitFor();
    console.log('   ✓ Found terminal iframe');

    console.log('\n5. Clicking on terminal to focus...');
    // Click on the terminal container/wrapper
    const terminalContainer = page.locator('.terminal-container').first();
    await terminalContainer.click();
    await page.waitForTimeout(300);
    
    // Also try clicking directly on iframe
    try {
      await iframe.click();
      await page.waitForTimeout(200);
    } catch (e) {
      console.log('   ⚠️  Could not click iframe directly (expected with cross-origin)');
    }

    console.log('\n6. Typing "echo hello" command...');
    
    // Try multiple methods to send keystrokes
    const methods = [
      { name: 'Direct keyboard', fn: async () => {
        await page.keyboard.type('echo hello');
      }},
      { name: 'Focus then type', fn: async () => {
        await iframe.focus();
        await page.waitForTimeout(100);
        await page.keyboard.type('echo hello');
      }},
      { name: 'Click then type', fn: async () => {
        await terminalContainer.click({ position: { x: 100, y: 100 } });
        await page.waitForTimeout(100);
        await page.keyboard.type('echo hello');
      }}
    ];

    let success = false;
    for (const method of methods) {
      console.log(`   Trying: ${method.name}...`);
      try {
        // Clear any existing text first
        await page.keyboard.press('Control+A');
        await page.waitForTimeout(50);
        
        await method.fn();
        await page.waitForTimeout(200);
        
        // Press Enter
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        
        // Check if typing worked by taking screenshot
        const timestamp = Date.now();
        await page.screenshot({ 
          path: `terminal-typing-${method.name.replace(/\s+/g, '-')}-${timestamp}.png`,
          fullPage: false 
        });
        console.log(`   ✓ Screenshot saved for ${method.name}`);
        success = true;
        
      } catch (e) {
        console.log(`   ✗ ${method.name} failed: ${e.message}`);
      }
      
      // Wait before trying next method
      await page.waitForTimeout(500);
    }

    console.log('\n7. Testing other keystrokes...');
    try {
      // Test Ctrl+L to clear screen (common terminal shortcut)
      await page.keyboard.press('Control+L');
      await page.waitForTimeout(300);
      console.log('   ✓ Ctrl+L sent');
      
      // Test Tab completion
      await page.keyboard.type('ec');
      await page.waitForTimeout(200);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      console.log('   ✓ Tab completion attempted');
      
    } catch (e) {
      console.log(`   ⚠️  Keystroke test: ${e.message}`);
    }

    console.log('\n8. Testing split view typing...');
    if (terminalCount >= 2) {
      try {
        // Enable split view
        await page.click('.split-toggle[title="Split Vertical"]');
        await page.waitForTimeout(500);
        console.log('   ✓ Split view enabled');
        
        // Click on second pane
        const splitContainer = page.locator('.split-container').first();
        await splitContainer.click({ position: { x: 500, y: 100 } });
        await page.waitForTimeout(300);
        
        // Type in second terminal
        await page.keyboard.type('pwd');
        await page.waitForTimeout(200);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        
        await page.screenshot({ path: 'terminal-split-typing.png' });
        console.log('   ✓ Split typing screenshot saved');
        
      } catch (e) {
        console.log(`   ⚠️  Split view test: ${e.message}`);
      }
    }

    console.log('\n9. Final verification...');
    await page.screenshot({ 
      path: 'terminal-typing-final.png',
      fullPage: true 
    });
    console.log('   ✓ Final screenshot saved');

    console.log('\n✅ Terminal typing test completed!');
    console.log('\n📸 Screenshots saved:');
    console.log('   - terminal-typing-*.png (various methods)');
    console.log('   - terminal-split-typing.png');
    console.log('   - terminal-typing-final.png');
    console.log('\n💡 Manual verification:');
    console.log('   1. Open the screenshots');
    console.log('   2. Check if "echo hello" appears in the terminal');
    console.log('   3. If yes, typing works! If no, need further debugging');

  } catch (error) {
    console.error(`\n❌ Test failed: ${error.message}`);
    await page.screenshot({ path: 'terminal-typing-error.png' });
    console.log('   Error screenshot saved: terminal-typing-error.png');
  } finally {
    await browser.close();
  }
}

testTerminalTyping();
