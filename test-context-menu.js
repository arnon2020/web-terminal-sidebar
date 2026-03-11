const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://localhost:7681');
  await page.waitForTimeout(2000);
  
  // Get the terminal list and trigger context menu
  const terminalItems = await page.$$('.terminal-item');
  console.log('Found terminal items:', terminalItems.length);
  
  if (terminalItems.length > 0) {
    // Right-click on the first terminal
    await terminalItems[0].click({ button: 'right' });
    await page.waitForTimeout(500);
    
    // Check if context menu exists
    const contextMenu = await page.$('.context-menu');
    console.log('Context menu exists:', contextMenu !== null);
    
    if (contextMenu) {
      const isVisible = await contextMenu.isVisible();
      console.log('Context menu isVisible:', isVisible);
      
      const boundingBox = await contextMenu.boundingBox();
      console.log('Context menu boundingBox:', boundingBox);
      
      // Check CSS
      const display = await contextMenu.evaluate(el => getComputedStyle(el).display);
      const visibility = await contextMenu.evaluate(el => getComputedStyle(el).visibility);
      const opacity = await contextMenu.evaluate(el => getComputedStyle(el).opacity);
      const zIndex = await contextMenu.evaluate(el => getComputedStyle(el).zIndex);
      const position = await contextMenu.evaluate(el => getComputedStyle(el).position);
      
      console.log('CSS:', { display, visibility, opacity, zIndex, position });
      
      // Check parent styles
      const parentDisplay = await contextMenu.evaluate(el => getComputedStyle(el.parentElement).display);
      const parentOverflow = await contextMenu.evaluate(el => getComputedStyle(el.parentElement).overflow);
      console.log('Parent CSS:', { parentDisplay, parentOverflow });
      
      // Get the actual content
      const text = await contextMenu.textContent();
      console.log('Context menu text:', text);
      
      // Screenshot
      await contextMenu.screenshot({ path: 'context-menu-debug.png' });
      console.log('Screenshot saved to context-menu-debug.png');
    } else {
      // Check all divs with context in class name
      const allDivs = await page.$$('div[class*="context"]');
      console.log('Found divs with "context" in class:', allDivs.length);
      
      for (const div of allDivs) {
        const className = await div.getAttribute('class');
        const display = await div.evaluate(el => getComputedStyle(el).display);
        console.log(`  ${className}: display=${display}`);
      }
      
      // Check React state by examining DOM
      const hasContext = await page.evaluate(() => {
        const menu = document.querySelector('.context-menu');
        if (!menu) return { exists: false };
        
        return {
          exists: true,
          innerHTML: menu.innerHTML,
          offsetParent: menu.offsetParent ? menu.offsetParent.tagName : null,
          offsetWidth: menu.offsetWidth,
          offsetHeight: menu.offsetHeight
        };
      });
      console.log('DOM check:', JSON.stringify(hasContext, null, 2));
    }
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
})();
