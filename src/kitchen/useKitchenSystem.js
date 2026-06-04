import { useSyncExternalStore } from "react";

/**
 * SMART Kitchen — 주방 HMI 외부 스토어 + 조리 엔진.
 *
 * 설계 (개선 반영):
 * - 단일 모듈 스토어 + useSyncExternalStore 구독. App 전역 리렌더 대신 구독 컴포넌트만 갱신.
 * - 고객 태블릿은 placeOrder() 액션만 직접 import → 1초 틱에 리렌더되지 않음.
 * - 1초 틱은 단일 순수 트랜지션 reduceTick(world) → nextWorld. (setState 중첩/부수효과 제거)
 * - 주문 상태에 delayed/fault 추가 + 진행 동결 + 경보 알람.
 */

// 6 매크로 공정 단계
export const STAGES = [
  { key: "receive", label: "주문 수신", short: "주문 수신" },
  { key: "recipe", label: "레시피 로드", short: "레시피 로드" },
  { key: "preheat", label: "예열", short: "예열" },
  { key: "inject", label: "자동 투입", short: "자동 투입" },
  { key: "cook", label: "조리 / 시즈닝", short: "조리 / 시즈닝" },
  { key: "done", label: "완료", short: "완료" },
];

const COOK_SEC = 72; // 데모용 압축 조리 시간(초)
const AUTO_CONFIRM_SEC = 4;
const MAX_STATION_COUNT = 3; // 설비 최대 WOK 수 (확장 한도)
const STATION_COUNT = 1; // 표준 운영 모듈 수 (최대 3기 중 1기 가동)
const TOAST_MS = 4200;
const DELAY_FACTOR = 1.25; // 조리 경과가 이 배수를 넘으면 지연
const QUEUE_DELAY_SEC = COOK_SEC * 1.4; // 큐 대기가 이만큼 길면 지연
const IMMINENT_SEC = 30; // 완료 임박 임계

function cookProgressToStage(pct) {
  if (pct < 6) return 1;
  if (pct < 22) return 2;
  if (pct < 38) return 3;
  if (pct < 98) return 4;
  return 5;
}

const STAGE_NEXT_LABEL = {
  1: "예열 시작",
  2: "재료 자동 투입",
  3: "강불 시즈닝",
  4: "최종 마무리 → 완료",
  5: "픽업 호출",
};

const INITIAL_TANKS = [
  { id: 1, name: "기름", note: "오일 베이스", pct: 78, capacityKg: 1.5 },
  { id: 2, name: "춘장", note: "춘장 소스", pct: 45, capacityKg: 1.5 },
  { id: 3, name: "향신료", note: "간장 / 굴소스", pct: 92, capacityKg: 1.5 },
  { id: 4, name: "육수", note: "육수 / 다시", pct: 60, capacityKg: 1.5 },
  { id: 5, name: "채소", note: "물 · 전분", pct: 23, capacityKg: 1.5 },
];

const INITIAL_POWDERS = [
  { id: 1, name: "고추 가루", pct: 55, capacityG: 1000 },
  { id: 2, name: "설탕 / MSG", pct: 18, capacityG: 1000 },
  { id: 3, name: "마늘 분말", pct: 0, capacityG: 1000 },
  { id: 4, name: "후추 / 향신료", pct: 91, capacityG: 1000 },
  { id: 5, name: "전분 / 그 외", pct: 64, capacityG: 1000 },
];

export const RECIPES = {
  default: {
    version: "v2.4 · 본사 OTA",
    totalSec: 270,
    timeline: [
      { label: "예열 (285℃)", device: "WOK", tag: "WOK", offset: 0, dur: 15, kind: "heat" },
      { label: "양파·당근 투입", device: "디스펜서 #1·#2", tag: "INJ", offset: 15, dur: 30, kind: "inject" },
      { label: "강불 볶음", device: "WOK", tag: "WOK", offset: 45, dur: 30, kind: "heat" },
      { label: "춘장+돈육 투입", device: "디스펜서 #3·#4", tag: "INJ", offset: 75, dur: 20, kind: "inject" },
      { label: "중불 가열 / 시즈닝", device: "WOK", tag: "WOK", offset: 95, dur: 60, kind: "season" },
      { label: "소스 끓이기", device: "WOK", tag: "WOK", offset: 155, dur: 40, kind: "season" },
      { label: "면 토출", device: "보조 장치", tag: "AUX", offset: 195, dur: 25, kind: "aux" },
      { label: "최종 마무리 가열", device: "WOK", tag: "WOK", offset: 220, dur: 60, kind: "heat" },
      { label: "플레이팅 / 완료", device: "WOK", tag: "WOK", offset: 280, dur: 45, kind: "done" },
    ],
    ingredients: [
      { tank: 1, name: "양파", need: "30g" },
      { tank: 2, name: "당근", need: "20g" },
      { tank: 3, name: "춘장", need: "60g" },
      { tank: 4, name: "돈육", need: "80g" },
      { tank: 5, name: "면", need: "150g" },
    ],
  },
};

export const MANUAL_MENU = [
  { id: "jjajang", name: "짜장면", cat: "면류", price: 7000 },
  { id: "jjamppong", name: "짬뽕", cat: "면류", price: 8000 },
  { id: "yuni", name: "유니짜장", cat: "면류", price: 8500 },
  { id: "seafood-jjamppong", name: "해물짬뽕", cat: "면류", price: 11000 },
  { id: "tangsuyuk", name: "탕수육 소", cat: "사이드", price: 14000 },
  { id: "mapo", name: "마파두부", cat: "밥류", price: 9000 },
  { id: "japchae", name: "잡채밥", cat: "밥류", price: 9500 },
  { id: "egg-soup", name: "계란탕", cat: "탕류", price: 7500 },
];

let codeSeq = 24;
const nextCode = () => `A-${String(codeSeq++).padStart(3, "0")}`;
let alarmSeq = 1;
let orderUid = 1;

function makeAlarm(kind, step, title, detail, ts) {
  const d = new Date(ts);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(
    d.getSeconds(),
  ).padStart(2, "0")}`;
  return { id: `al-${alarmSeq++}`, kind, step, title, detail, time, ts };
}

const primaryMenuName = (order) => {
  const main = order.items.find((it) => it.cookable) ?? order.items[0];
  return main ? main.name : "주문";
};

const summarizeItems = (order) => order.items.map((it) => `${it.name} ${it.qty ?? 1}`).join("·");

// 완료된 주문 → 이력(History) 레코드. PRD §6.8 조리 기록/생산량/작업 로그의 원천 데이터.
function makeHistoryRecord(order, now) {
  const durationSec = order.cookStartedAt ? Math.max(1, Math.round((now - order.cookStartedAt) / 1000)) : COOK_SEC;
  return {
    id: `h-${order.uid}`,
    code: order.code,
    primary: primaryMenuName(order),
    summary: summarizeItems(order),
    table: order.table,
    channel: order.channel,
    stationId: order.stationId,
    completedAt: now,
    durationSec,
    result: "success",
    fault: null,
  };
}

// 운영 시작 전 누적 이력 시드 (당일 운영 맥락 제공)
function seedHistory(now) {
  const seeds = [
    { code: "A-018", menu: "짜장면", summary: "짜장면 2", table: "03", channel: "테이블 태블릿", station: 1, dur: 318, result: "success", ago: 6 },
    { code: "A-019", menu: "짬뽕", summary: "짬뽕 1·군만두 1", table: "08", channel: "포장", station: 1, dur: 372, result: "success", ago: 14 },
    { code: "A-020", menu: "마파두부", summary: "마파두부 1·공기밥 1", table: "11", channel: "테이블 태블릿", station: 1, dur: 351, result: "success", ago: 25 },
    { code: "A-021", menu: "탕수육", summary: "탕수육(소) 1", table: "05", channel: "쿠팡", station: 1, dur: 405, result: "fault", ago: 38, fault: "ALM-INGREDIENT-LOW" },
    { code: "A-022", menu: "유니짜장", summary: "유니짜장 2", table: "07", channel: "테이블 태블릿", station: 1, dur: 332, result: "success", ago: 52 },
    { code: "A-023", menu: "해물짬뽕", summary: "해물짬뽕 1", table: "02", channel: "배달의민족", station: 1, dur: 389, result: "success", ago: 67 },
  ];
  return seeds.map((s) => ({
    id: `h-seed-${s.code}`,
    code: s.code,
    primary: s.menu,
    summary: s.summary,
    table: s.table,
    channel: s.channel,
    stationId: s.station,
    completedAt: now - s.ago * 60000,
    durationSec: s.dur,
    result: s.result,
    fault: s.fault ?? null,
  }));
}

function makeOrder(payload, ts) {
  return {
    uid: orderUid++,
    code: nextCode(),
    table: payload.table ?? "07",
    channel: payload.channel ?? "테이블 태블릿",
    payment: payload.payment ?? "신용카드 완료",
    items: (payload.items ?? []).map((it) => ({
      name: it.name,
      qty: it.qty ?? 1,
      price: it.price ?? 0,
      options: it.options ?? "",
      cookable: it.cookable !== false,
    })),
    memo: payload.memo ?? "",
    total: payload.total ?? 0,
    estMinutes: payload.estMinutes ?? 7,
    paid: payload.paid ?? false, // 카운터 POS 결제 게이트 (true 여야 주방 자동 전송)
    paidAt: null,
    receivedAt: ts,
    status: "incoming",
    stationId: null,
    cookStartedAt: null,
    progress: 0,
    priority: Boolean(payload.priority),
    pausedAt: null,
    faultAt: null,
    completedAt: null,
  };
}

function seedOrders(now) {
  // 시드 2건만 가동 → WOK 03 은 '대기' 상태 모듈로 노출
  const seeds = [
    { items: [{ name: "마파두부", qty: 1, cookable: true }, { name: "공기밥", qty: 1, cookable: false }], table: "12", channel: "테이블 태블릿", payment: "신용카드 완료", total: 11000, estMinutes: 7, paid: true },
    { items: [{ name: "탕수육(소)", qty: 1, cookable: true }, { name: "짜장", qty: 2, cookable: true }], table: "05", channel: "쿠팡", payment: "선결제", total: 21000, estMinutes: 10, paid: true },
  ];
  return seeds.map((s, i) => {
    const o = makeOrder(s, now - (i + 1) * 1000);
    o.status = "queued";
    o.paidAt = o.receivedAt;
    return o;
  });
}

function createInitialWorld() {
  const now = Date.now();
  return {
    orders: seedOrders(now),
    stations: Array.from({ length: STATION_COUNT }, (_, i) => ({
      id: i + 1,
      name: `WOK 0${i + 1}`,
      orderUid: null,
      temp: 24,
      rpm: 0,
    })),
    tanks: INITIAL_TANKS,
    powders: INITIAL_POWDERS,
    alarms: [makeAlarm("info", 0, "주방 HMI 가동", "공정 엔진 정상 · 5채널 알림 ON", now)],
    history: seedHistory(now),
    toasts: [],
    mode: "auto",
    stats: { todayCount: 142, errors: 0, normalRate: 99.4, avgTimeSec: 342 },
    lastAckTs: 0, // 알람 '모두 확인' 시각
  };
}

function stageAlarm(order, stage, now) {
  const label = STAGES[stage]?.label ?? "";
  const kind = stage === 5 ? "done" : stage === 2 ? "ready" : "info";
  return makeAlarm(kind, stage + 1, `STEP 0${stage + 1} · ${label}`, `${primaryMenuName(order)} — ${STAGE_NEXT_LABEL[stage] ?? ""}`, now);
}

// 알람을 world에 병합 (로그 prepend 60개 cap, 토스트 만료 + 최근 4개)
function mergeAlarms(world, newAlarms, now) {
  const log = newAlarms.length ? [...newAlarms.slice().reverse(), ...world.alarms].slice(0, 60) : world.alarms;
  const toasts = [...world.toasts, ...newAlarms].filter((t) => now - t.ts < TOAST_MS).slice(-4);
  return { ...world, alarms: log, toasts };
}

/* ── 단일 순수 틱 트랜지션 ── */
function reduceTick(world) {
  const now = Date.now();
  const newAlarms = [];
  let { mode, stats } = world;
  let orders = world.orders;
  const justCompleted = [];

  // 1) 주문 진행
  orders = orders.map((o) => {
    if (o.status === "incoming" && mode === "auto" && now - o.receivedAt >= AUTO_CONFIRM_SEC * 1000) {
      // 결제 정책(선불/후불) 미정 — 결제 여부와 무관하게 주방 대기열로 자동 등록.
      // (POS 결제는 정보 기록용이며 주방 흐름을 막지 않는다.)
      newAlarms.push(makeAlarm("done", 1, `STEP 01 완료 · ${o.code}`, "조리 대기 목록 자동 등록", now));
      return { ...o, status: "queued" };
    }
    if (o.status === "cooking" && !o.pausedAt && !o.faultAt) {
      const elapsed = now - (o.cookStartedAt ?? now);
      const pct = Math.min(100, (elapsed / (COOK_SEC * 1000)) * 100);
      const prevStage = cookProgressToStage(o.progress);
      const curStage = cookProgressToStage(pct);
      if (curStage !== prevStage) newAlarms.push(stageAlarm(o, curStage, now));
      if (pct >= 100) {
        const done = { ...o, status: "done", progress: 100, completedAt: now };
        justCompleted.push(done);
        return done;
      }
      return { ...o, progress: pct };
    }
    return o;
  });

  // 2) 스테이션 동기화 + 텔레메트리 + 자동 배정 (동일 트랜지션 내, setState 중첩 없음)
  const cooking = new Set();
  let stations = world.stations.map((s) => {
    const o = orders.find((x) => x.uid === s.orderUid);
    if (!o || o.status === "done" || o.status === "rejected") {
      return { ...s, orderUid: null, temp: Math.max(24, s.temp - 40), rpm: 0 };
    }
    cooking.add(o.uid);
    const frozen = o.pausedAt || o.faultAt;
    const stage = cookProgressToStage(o.progress);
    const targetTemp = frozen ? (o.faultAt ? 0 : s.temp) : stage <= 2 ? 285 : stage === 3 ? 270 : 290;
    const targetRpm = frozen ? 0 : stage <= 1 ? 30 : stage === 3 ? 50 : stage === 5 ? 40 : 60 + (s.id === 2 ? 10 : 0);
    return {
      ...s,
      temp: Math.round(s.temp + (targetTemp - s.temp) * 0.4),
      rpm: Math.round(s.rpm + (targetRpm - s.rpm) * 0.4),
    };
  });

  if (mode === "auto") {
    const queued = orders
      .filter((o) => o.status === "queued" && !cooking.has(o.uid))
      .sort((a, b) => Number(b.priority) - Number(a.priority) || a.receivedAt - b.receivedAt);
    stations = stations.map((s) => {
      if (!s.orderUid && queued.length) {
        const pick = queued.shift();
        cooking.add(pick.uid);
        orders = orders.map((o) =>
          o.uid === pick.uid ? { ...o, status: "cooking", stationId: s.id, cookStartedAt: now, progress: 0 } : o,
        );
        newAlarms.push(makeAlarm("info", 2, `STEP 02 · ${pick.code} 배정`, `${s.name} 배정 · 레시피 로드`, now));
        return { ...s, orderUid: pick.uid, temp: 120, rpm: 30 };
      }
      return s;
    });
  }

  // 3) 완료 부수효과: 재고 차감 · 통계 · 픽업 알람 + 저잔량 경고 + 이력 기록
  let tanks = world.tanks;
  let powders = world.powders;
  let history = world.history;
  if (justCompleted.length) {
    const n = justCompleted.length;
    tanks = world.tanks.map((t) => ({ ...t, pct: Math.max(0, t.pct - 1.4 * n) }));
    powders = world.powders.map((p) => ({ ...p, pct: Math.max(0, p.pct - 0.8 * n) }));
    stats = { ...stats, todayCount: stats.todayCount + n };
    history = [...justCompleted.map((o) => makeHistoryRecord(o, now)), ...world.history].slice(0, 200);
    for (const o of justCompleted) {
      newAlarms.push(makeAlarm("pickup", 6, `STEP 06 완료 · ${o.code}`, `${primaryMenuName(o)} 조리 완료 — 테이블 ${o.table} 픽업 호출 발송`, now));
    }
    for (const t of tanks) {
      const prev = world.tanks.find((x) => x.id === t.id);
      if (prev && prev.pct > 30 && t.pct <= 30) {
        newAlarms.push(makeAlarm("warn", 0, `소스 통 #${t.id} 잔량 부족`, `${t.name} ${t.pct.toFixed(0)}% · 보충 권장`, now));
      }
    }
  }

  const next = { ...world, orders, stations, tanks, powders, stats, history };
  return mergeAlarms(next, newAlarms, now);
}

/* ────────────────── 모듈 스토어 ────────────────── */
let world = createInitialWorld();
let cachedSnapshot = computeSnapshot(world);
const listeners = new Set();

function emit() {
  cachedSnapshot = computeSnapshot(world);
  for (const l of listeners) l();
}

function setWorld(updater) {
  world = updater(world);
  emit();
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot() {
  return cachedSnapshot;
}

let intervalStarted = false;
function ensureStarted() {
  if (intervalStarted) return;
  intervalStarted = true;
  setInterval(() => setWorld(reduceTick), 1000);
}

function pushAlarmWorld(w, alarm) {
  const now = Date.now();
  return {
    ...w,
    alarms: [alarm, ...w.alarms].slice(0, 60),
    toasts: [...w.toasts, alarm].filter((t) => now - t.ts < TOAST_MS).slice(-4),
  };
}

/* ── 액션 (모듈 함수, 안정적 참조) ── */
export function placeOrder(payload) {
  const order = makeOrder(payload, Date.now());
  setWorld((w) =>
    pushAlarmWorld({ ...w, orders: [...w.orders, order] }, makeAlarm("info", 1, `STEP 01 · 신규 주문 ${order.code}`, `${summarizeItems(order)} — 조리 대기 등록 대기 중`, Date.now())),
  );
  return order.code;
}

function confirmOrder(uid) {
  setWorld((w) => {
    const o = w.orders.find((x) => x.uid === uid && x.status === "incoming");
    if (!o) return w;
    const orders = w.orders.map((x) => (x.uid === uid ? { ...x, status: "queued" } : x));
    return pushAlarmWorld({ ...w, orders }, makeAlarm("done", 1, `STEP 01 완료 · ${o.code}`, "조리 대기 목록 자동 등록", Date.now()));
  });
}

/* ── 카운터 POS 결제 액션 ── */
function recordPayment(uid, method = "신용카드") {
  setWorld((w) => {
    const o = w.orders.find((x) => x.uid === uid);
    if (!o || o.paid) return w;
    const now = Date.now();
    const orders = w.orders.map((x) => (x.uid === uid ? { ...x, paid: true, paidAt: now, payment: `${method} 완료` } : x));
    return pushAlarmWorld({ ...w, orders }, makeAlarm("done", 1, `결제 완료 · ${o.code}`, `테이블 ${o.table} · ${method} ${o.total.toLocaleString()}원`, now));
  });
}

// 결제 처리 후 주방 대기열로 즉시 전송 (incoming → paid → queued)
function payAndSend(uid, method = "신용카드") {
  setWorld((w) => {
    const o = w.orders.find((x) => x.uid === uid && x.status === "incoming");
    if (!o) return w;
    const now = Date.now();
    const orders = w.orders.map((x) =>
      x.uid === uid ? { ...x, paid: true, paidAt: now, payment: `${method} 완료`, status: "queued" } : x,
    );
    return pushAlarmWorld(
      { ...w, orders },
      makeAlarm("done", 1, `결제·전송 · ${o.code}`, `${method} ${o.total.toLocaleString()}원 — 주방 대기열 전송`, now),
    );
  });
}

function rejectOrder(uid) {
  setWorld((w) => {
    const o = w.orders.find((x) => x.uid === uid);
    if (!o) return w;
    const orders = w.orders.map((x) => (x.uid === uid ? { ...x, status: "rejected" } : x));
    return pushAlarmWorld({ ...w, orders }, makeAlarm("warn", 1, `주문 거부 · ${o.code}`, "운영자 수동 거부 처리", Date.now()));
  });
}

function assignToStation(uid, stationId) {
  setWorld((w) => {
    const station = w.stations.find((s) => s.id === stationId);
    if (!station || station.orderUid) return w;
    const now = Date.now();
    const stations = w.stations.map((s) => (s.id === stationId ? { ...s, orderUid: uid, temp: 120, rpm: 30 } : s));
    const orders = w.orders.map((o) =>
      o.uid === uid ? { ...o, status: "cooking", stationId, cookStartedAt: now, progress: 0 } : o,
    );
    const o = orders.find((x) => x.uid === uid);
    return pushAlarmWorld({ ...w, stations, orders }, makeAlarm("info", 2, `STEP 02 · ${o?.code} 배정`, `${station.name} 배정 · 레시피 로드 시작`, now));
  });
}

function advanceStage(uid) {
  setWorld((w) => {
    const orders = w.orders.map((o) => {
      if (o.uid !== uid || o.status !== "cooking" || o.pausedAt || o.faultAt) return o;
      const stage = cookProgressToStage(o.progress);
      const jump = { 1: 7, 2: 23, 3: 39, 4: 99 }[stage] ?? o.progress;
      const elapsedForJump = (jump / 100) * COOK_SEC * 1000;
      return { ...o, cookStartedAt: Date.now() - elapsedForJump, progress: jump };
    });
    return { ...w, orders };
  });
}

function togglePause(uid) {
  setWorld((w) => {
    const orders = w.orders.map((o) => {
      if (o.uid !== uid) return o;
      if (o.pausedAt) {
        const dur = Date.now() - o.pausedAt;
        return { ...o, pausedAt: null, cookStartedAt: (o.cookStartedAt ?? Date.now()) + dur };
      }
      return { ...o, pausedAt: Date.now() };
    });
    const o = w.orders.find((x) => x.uid === uid);
    const resuming = o?.pausedAt;
    return pushAlarmWorld(
      { ...w, orders },
      makeAlarm(resuming ? "info" : "warn", 0, `${o?.code} ${resuming ? "조리 재개" : "조리 일시 정지"}`, `WOK 0${o?.stationId} ${resuming ? "정상 가동" : "운영자 수동 정지"}`, Date.now()),
    );
  });
}

function toggleFault(uid) {
  setWorld((w) => {
    const o = w.orders.find((x) => x.uid === uid);
    if (!o) return w;
    const clearing = Boolean(o.faultAt);
    const orders = w.orders.map((x) => {
      if (x.uid !== uid) return x;
      if (x.faultAt) {
        const dur = Date.now() - x.faultAt;
        return { ...x, faultAt: null, cookStartedAt: (x.cookStartedAt ?? Date.now()) + dur };
      }
      return { ...x, faultAt: Date.now() };
    });
    return pushAlarmWorld(
      { ...w, orders },
      makeAlarm(clearing ? "info" : "error", 0, `${o.code} ${clearing ? "이상 해제" : "장비 이상 감지"}`, `WOK 0${o.stationId} ${clearing ? "정상 복귀 · 조리 재개" : "즉시 대응 필요 · 조리 정지"}`, Date.now()),
    );
  });
}

// 조리 취소 — 진행/대기 주문을 취소하고 WOK 해제
function cancelOrder(uid) {
  setWorld((w) => {
    const o = w.orders.find((x) => x.uid === uid);
    if (!o || o.status === "done" || o.status === "rejected") return w;
    const orders = w.orders.map((x) => (x.uid === uid ? { ...x, status: "rejected" } : x));
    return pushAlarmWorld(
      { ...w, orders },
      makeAlarm("warn", 0, `조리 취소 · ${o.code}`, `${primaryMenuName(o)} — 운영자 수동 취소 · WOK 해제`, Date.now()),
    );
  });
}

// 소스 수동 투입 (디스펜서 토출 → 잔량 차감)
function injectTank(id) {
  setWorld((w) => {
    const t = w.tanks.find((x) => x.id === id);
    if (!t) return w;
    const tanks = w.tanks.map((x) => (x.id === id ? { ...x, pct: Math.max(0, x.pct - 6) } : x));
    return pushAlarmWorld({ ...w, tanks }, makeAlarm("info", 0, `소스 투입 · #${id} ${t.name}`, "디스펜서 수동 투입 실행", Date.now()));
  });
}

// 분말 수동 투입
function injectPowder(id) {
  setWorld((w) => {
    const p = w.powders.find((x) => x.id === id);
    if (!p) return w;
    const powders = w.powders.map((x) => (x.id === id ? { ...x, pct: Math.max(0, x.pct - 5) } : x));
    return pushAlarmWorld({ ...w, powders }, makeAlarm("info", 0, `분말 투입 · P${id} ${p.name}`, "분말 디스펜서 수동 투입 실행", Date.now()));
  });
}

function refillPowder(id) {
  setWorld((w) => {
    const p = w.powders.find((x) => x.id === id);
    const powders = w.powders.map((x) => (x.id === id ? { ...x, pct: 100 } : x));
    return pushAlarmWorld({ ...w, powders }, makeAlarm("done", 0, `분말 P${id} 보충 완료`, `${p?.name} 잔량 100% 충전`, Date.now()));
  });
}

function refillTank(id) {
  setWorld((w) => {
    const t = w.tanks.find((x) => x.id === id);
    const tanks = w.tanks.map((x) => (x.id === id ? { ...x, pct: 100 } : x));
    return pushAlarmWorld({ ...w, tanks }, makeAlarm("done", 0, `소스 통 #${id} 보충 완료`, `${t?.name} 잔량 100% 충전`, Date.now()));
  });
}

function setMode(next) {
  setWorld((w) =>
    pushAlarmWorld(
      { ...w, mode: next },
      makeAlarm("info", 0, next === "auto" ? "자동 모드 전환" : "수동 모드 전환", next === "auto" ? "AI 자동 정렬·배정 가동" : "운영자 직접 제어", Date.now()),
    ),
  );
}

function dismissToast(id) {
  setWorld((w) => ({ ...w, toasts: w.toasts.filter((t) => t.id !== id) }));
}

function acknowledgeAlarms() {
  setWorld((w) => ({ ...w, lastAckTs: Date.now() }));
}

const ACTIONS = {
  placeOrder,
  confirmOrder,
  recordPayment,
  payAndSend,
  rejectOrder,
  assignToStation,
  advanceStage,
  togglePause,
  toggleFault,
  cancelOrder,
  injectTank,
  injectPowder,
  refillTank,
  refillPowder,
  setMode,
  dismissToast,
  acknowledgeAlarms,
};

/* ── 파생 스냅샷 (world 변경 시에만 재계산, 안정 참조) ── */
function computeSnapshot(w) {
  const now = Date.now();

  const decorate = (o) => {
    const stage = o.status === "cooking" ? cookProgressToStage(o.progress) : o.status === "done" ? 5 : 0;
    const elapsedSec = o.cookStartedAt ? Math.floor(((o.pausedAt ?? o.faultAt ?? now) - o.cookStartedAt) / 1000) : 0;
    const remainSec = Math.max(0, Math.round(((100 - o.progress) / 100) * COOK_SEC));
    let state = "normal";
    if (o.status === "cooking") {
      if (o.faultAt) state = "fault";
      else if (o.pausedAt) state = "paused";
      else if (elapsedSec > Math.round(COOK_SEC * DELAY_FACTOR)) state = "delayed";
      else if (remainSec <= IMMINENT_SEC) state = "imminent";
    } else if (o.status === "queued" && (now - o.receivedAt) / 1000 > QUEUE_DELAY_SEC) {
      state = "delayed";
    }
    return {
      ...o,
      stageIndex: stage,
      stageLabel: STAGES[stage]?.label ?? "대기",
      nextStepLabel: STAGE_NEXT_LABEL[stage] ?? "완료",
      elapsedSec,
      remainSec,
      state,
      primary: primaryMenuName(o),
      summary: summarizeItems(o),
    };
  };

  const incoming = w.orders.filter((o) => o.status === "incoming");
  const queued = w.orders
    .filter((o) => o.status === "queued")
    .sort((a, b) => Number(b.priority) - Number(a.priority) || a.receivedAt - b.receivedAt);
  const cooking = w.orders.filter((o) => o.status === "cooking");
  const done = w.orders.filter((o) => o.status === "done").sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
  const stationView = w.stations.map((s) => {
    const o = w.orders.find((x) => x.uid === s.orderUid);
    return { ...s, order: o ? decorate(o) : null };
  });

  const decoratedCooking = cooking.map(decorate);
  const decoratedQueued = queued.map(decorate);
  // 상단 배지 = 미확인 경고/오류 알람 수 ('모두 확인' 시 lastAckTs 이후만 카운트)
  const alertCount = w.alarms.filter(
    (a) => (a.kind === "warn" || a.kind === "error") && a.ts > w.lastAckTs,
  ).length;

  const d = new Date(now);
  const clock = {
    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`,
  };

  return {
    orders: w.orders,
    stations: w.stations,
    tanks: w.tanks,
    powders: w.powders,
    alarms: w.alarms,
    history: [...w.history].sort((a, b) => b.completedAt - a.completedAt),
    toasts: w.toasts,
    mode: w.mode,
    stats: w.stats,
    cookSec: COOK_SEC,
    stationCount: w.stations.length,
    maxStationCount: MAX_STATION_COUNT,
    clock,
    view: {
      incoming: incoming.map(decorate),
      queued: decoratedQueued,
      cooking: decoratedCooking,
      done: done.map(decorate),
      stations: stationView,
      activeCount: cooking.length,
      queueCount: queued.length,
      pendingAlarms: alertCount,
    },
  };
}

/* ── 구독 훅 ── */
export function useKitchenSystem() {
  ensureStarted();
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { ...snap, ...ACTIONS };
}
