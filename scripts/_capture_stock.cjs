// 재고(STOCK) mockup HTML → PNG 렌더 (1280×800 고정)
const path = require('path');

const FILE = process.argv[2] || path.join('SMART_Docs', '04_Mockup', 'Product_Mockups', 'ui_kitchen_stock.html');
const OUT = process.argv[3] || path.join('SMART_Docs', '04_Mockup', 'Product_Mockups', 'ui_kitchen_stock.png');
const URL = 'file:///' + path.resolve(FILE).replace(/\\/g, '/');

(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch { ({ chromium } = require('playwright-core')); }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  try { await page.evaluate(() => document.fonts && document.fonts.ready); } catch {}
  await page.waitForTimeout(1800); // 폰트 로드 안정화
  await page.screenshot({ path: path.resolve(OUT) });
  console.log('captured -> ' + path.resolve(OUT));
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
