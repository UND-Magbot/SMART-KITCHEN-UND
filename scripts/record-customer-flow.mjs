// 고객 태블릿 전체 흐름 녹화 스크립트 (Playwright)
// 실행: node scripts/record-customer-flow.mjs
// 산출물: captures/customer-tablet-flow.webm
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const URL = process.env.HMI_URL ?? "http://127.0.0.1:5173/";
const OUT_DIR = "captures";
const OUT_FILE = path.join(OUT_DIR, "customer-tablet-flow.webm");
const VIEW = { width: 1440, height: 900 };

fs.mkdirSync(OUT_DIR, { recursive: true });

const pause = (page, ms) => page.waitForTimeout(ms);

// 안전 클릭: 선택자가 있으면 클릭, 없으면 경고만 (영상 흐름 끊김 방지)
async function click(page, selector, { timeout = 8000, after = 700, label } = {}) {
  try {
    const loc = page.locator(selector).first();
    await loc.waitFor({ state: "visible", timeout });
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    await loc.click();
    if (after) await pause(page, after);
    console.log("✓", label ?? selector);
    return true;
  } catch (e) {
    console.warn("✗ skip:", label ?? selector, "-", e.message.split("\n")[0]);
    return false;
  }
}

const run = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEW,
    recordVideo: { dir: OUT_DIR, size: VIEW },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const video = page.video();

  console.log("→ navigate", URL);
  await page.goto(URL, { waitUntil: "networkidle" });
  await pause(page, 1500);

  // 0) 랜딩 → 주문 시작
  await click(page, 'button:has-text("주문 시작")', { label: "주문 시작", after: 1200 });

  // 1) 식사 카테고리 둘러보기
  await click(page, '[data-testid="category-noodle"]', { label: "식사 카테고리", after: 1000 });

  // 2) 유니 짜장면 빠른 담기 → 옵션 모달
  await click(page, '[data-testid="quick-add-yuni-jjajang"]', { label: "유니짜장 담기", after: 900 });
  await click(page, '[data-testid="option-spice-1"]', { label: "맵기: 보통", after: 600 });
  await click(page, '[data-testid="option-size-0"]', { label: "사이즈: 일반", after: 600 });
  await click(page, '[data-testid="add-to-cart"]', { label: "장바구니 담기", after: 1100 });

  // 3) 사이드(군만두) 추가
  await click(page, '[data-testid="category-side-drink"]', { label: "사이드/주류", after: 900 });
  await click(page, '[data-testid="quick-add-dumpling"]', { label: "군만두 담기", after: 800 });
  await click(page, '.course-modal-backdrop button:has-text("담기")', { label: "군만두 확인", after: 1100 });

  // 4) 장바구니 열기
  await click(page, '[data-testid="open-cart"]', { label: "장바구니 열기", after: 1300 });

  // 5) 결제 단계로
  await click(page, '[data-testid="submit-order"]', { label: "결제하기", after: 1300 });

  // 6) 결제 수단(간편결제) 선택 후 결제 완료
  await click(page, '[data-testid="payment-step"] [role="radio"]:nth-child(2)', { label: "결제수단: 간편결제", after: 800 });
  await click(page, '[data-testid="confirm-order"]', { label: "결제 완료", after: 1800 });

  // 7) 주문 완료 화면 노출
  await pause(page, 2200);

  await context.close(); // 영상 파일 확정
  if (video) {
    await video.saveAs(OUT_FILE);
    await video.delete().catch(() => {});
    console.log("🎬 saved:", OUT_FILE);
  } else {
    console.warn("video handle 없음");
  }
  await browser.close();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
