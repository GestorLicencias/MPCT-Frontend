const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://eldni.com/buscar-por-dni', { waitUntil: 'domcontentloaded' });
    await page.fill('#dni', '73335504');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.click('#btn-buscar-por-dni')
    ]);
    
    // The result page should have the name somewhere. Let's print the text of the body to see where it is.
    const text = await page.evaluate(() => document.body.innerText);
    console.log(text.substring(0, 1000));
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
})();
