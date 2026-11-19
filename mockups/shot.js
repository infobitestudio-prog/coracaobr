const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const v of ['v1','v2','v3']) { const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await p.goto('file:///home/user/guia-texas/mockups/' + v + '.html'); await p.waitForTimeout(1500);
    const h = await p.evaluate(() => document.documentElement.scrollHeight); await p.setViewportSize({ width: 390, height: h }); await p.waitForTimeout(300);
    await p.screenshot({ path: v + '.png' }); console.log(v, h); await p.close(); }
  await b.close(); })();
