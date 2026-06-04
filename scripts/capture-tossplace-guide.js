/**
 * 토스플레이스 사용가이드 페이지를 Playwright로 캡처한다.
 *
 * 생성 파일:
 *  - captures/tossplace-guide-full.png  (fullPage screenshot)
 *  - captures/tossplace-guide.html      (page.content())
 *  - captures/tossplace-guide.txt       (document.body.innerText)
 *
 * 실행:
 *   node scripts/capture-tossplace-guide.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGET_URL =
  'https://support-tossplace.oopy.io/987a08f2-bdf5-4353-a253-ae4140e8564e';
const VIEWPORT = { width: 1440, height: 1200 };

const OUT_DIR = path.resolve(__dirname, '..', 'captures');
const PNG_PATH = path.join(OUT_DIR, 'tossplace-guide-full.png');
const HTML_PATH = path.join(OUT_DIR, 'tossplace-guide.html');
const TXT_PATH = path.join(OUT_DIR, 'tossplace-guide.txt');

function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log(`[init] captures 폴더 생성: ${OUT_DIR}`);
  }
}

async function autoScrollToBottom(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      const distance = 400;
      const delay = 200;
      let total = 0;
      const timer = setInterval(() => {
        const scrollHeight = document.documentElement.scrollHeight;
        window.scrollBy(0, distance);
        total += distance;
        if (total >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, delay);
    });
  });
}

async function waitForLazyContent(page) {
  try {
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch (err) {
    console.warn('[warn] networkidle 대기 타임아웃 — 계속 진행합니다.');
  }
  await page.waitForTimeout(1500);
}

async function run() {
  ensureOutDir();

  console.log('[step] Chromium 실행 (headless)');
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      locale: 'ko-KR',
    });

    const page = await context.newPage();

    console.log(`[step] 페이지 이동: ${TARGET_URL}`);
    await page.goto(TARGET_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    console.log('[step] networkidle 대기');
    await waitForLazyContent(page);

    console.log('[step] 하단까지 천천히 스크롤 (lazy load 유도)');
    await autoScrollToBottom(page);
    await waitForLazyContent(page);

    console.log('[step] 상단으로 복귀');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    console.log('[step] HTML 저장');
    const html = await page.content();
    fs.writeFileSync(HTML_PATH, html, 'utf8');

    console.log('[step] 텍스트 저장 (document.body.innerText)');
    const innerText = await page.evaluate(() =>
      (document.body && document.body.innerText) || ''
    );
    fs.writeFileSync(TXT_PATH, innerText, 'utf8');

    console.log('[step] Full-page 스크린샷 저장');
    await page.screenshot({
      path: PNG_PATH,
      fullPage: true,
    });

    await context.close();
  } finally {
    await browser.close();
  }

  console.log('\n=== 검증 ===');
  const pngExists = fs.existsSync(PNG_PATH);
  const htmlExists = fs.existsSync(HTML_PATH);
  const txtExists = fs.existsSync(TXT_PATH);

  const pngSize = pngExists ? fs.statSync(PNG_PATH).size : 0;
  const htmlSize = htmlExists ? fs.statSync(HTML_PATH).size : 0;
  const txtSize = txtExists ? fs.statSync(TXT_PATH).size : 0;

  console.log(`PNG  : ${pngExists ? 'OK' : 'MISSING'}  (${pngSize} bytes) ${PNG_PATH}`);
  console.log(`HTML : ${htmlExists ? 'OK' : 'MISSING'}  (${htmlSize} bytes) ${HTML_PATH}`);
  console.log(`TXT  : ${txtExists ? 'OK' : 'MISSING'}  (${txtSize} bytes) ${TXT_PATH}`);

  if (txtExists) {
    const text = fs.readFileSync(TXT_PATH, 'utf8');
    console.log('\n=== TXT 앞부분 1000자 ===');
    console.log(text.slice(0, 1000));
    console.log('=== /TXT 앞부분 ===');
  }

  if (!pngExists || !htmlExists || !txtExists) {
    throw new Error('일부 산출물이 생성되지 않았습니다.');
  }
}

run().catch((err) => {
  console.error('[error] 캡처 실패:', err && err.stack ? err.stack : err);
  process.exit(1);
});
