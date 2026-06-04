import {
  Activity,
  AlertTriangle,
  Bell,
  BellRing,
  BookOpen,
  Boxes,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Cloud,
  Cpu,
  Droplet,
  Flame,
  Hand,
  History,
  LayoutDashboard,
  Soup,
  Megaphone,
  Pause,
  PhoneCall,
  Play,
  Plus,
  Settings,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { MANUAL_MENU, RECIPES, STAGES, useKitchenSystem } from "./useKitchenSystem";

const NAV = [
  { id: "dash", code: "DASH", label: "대시", icon: LayoutDashboard },
  { id: "operate", code: "OPER", label: "운영", icon: Brain },
  { id: "queue", code: "QUEUE", label: "대기", icon: Activity },
  { id: "recipe", code: "RECIPE", label: "레시피", icon: BookOpen },
  { id: "stock", code: "STOCK", label: "재고", icon: Boxes },
  { id: "alarm", code: "ALARM", label: "알람", icon: Bell },
  { id: "history", code: "HIST", label: "이력", icon: History },
  { id: "setup", code: "SETUP", label: "설정", icon: Settings },
];

const fmtSec = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const fmtEta = (s) => (s >= 60 ? `${Math.ceil(s / 60)}분 후 완성` : `${s}초 후 완성`);
const won = (n) => `₩${Number(n).toLocaleString()}`;

// AUTO 라이브 카드 — 자동 단계 브레드크럼 (mockup: 예열 OK · 투입 OK · 시즈닝 진행 · 마무리 대기)
const AUTO_SUBSTEPS = [
  { label: "예열", stage: 2 },
  { label: "투입", stage: 3 },
  { label: "시즈닝", stage: 4 },
  { label: "마무리", stage: 5 },
];

function AutoStageTrail({ stageIndex }) {
  return (
    <div className="auto-trail" aria-label="자동 공정 단계">
      {AUTO_SUBSTEPS.map((s) => {
        const status = stageIndex > s.stage ? "ok" : stageIndex === s.stage ? "run" : "wait";
        return (
          <span className={`trail-chip ${status}`} key={s.label}>
            {s.label} {status === "ok" ? "OK" : status === "run" ? "진행" : "대기"}
          </span>
        );
      })}
    </div>
  );
}

// WOK 상태별 배지/스타일 (색 + 텍스트 병행 — 색약 대응)
const WOK_STATE = {
  normal: { label: "조리 중", cls: "st-cooking" },
  imminent: { label: "완료 임박", cls: "st-imminent" },
  paused: { label: "일시 정지", cls: "st-paused" },
  delayed: { label: "지연 발생", cls: "st-delayed" },
  fault: { label: "장비 이상", cls: "st-fault" },
};

// 위험·비가역 액션용 길게누르기 버튼 (오조작 방지)
function HoldButton({ onConfirm, children, className = "", holdMs = 1600, label }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const start = () => {
    setHolding(true);
    timer.current = setTimeout(() => {
      setHolding(false);
      onConfirm();
    }, holdMs);
  };
  const cancel = () => {
    setHolding(false);
    clearTimeout(timer.current);
  };
  return (
    <button
      className={`hold-btn ${className} ${holding ? "holding" : ""}`}
      style={{ "--hold-ms": `${holdMs}ms` }}
      type="button"
      aria-label={label}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
    >
      <span className="hold-fill" aria-hidden="true" />
      <span className="hold-label">{children}</span>
    </button>
  );
}

function ProgressBar({ value, label, size = "" }) {
  const pct = Math.round(value);
  return (
    <div
      className={`bar ${size}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <i style={{ width: `${value}%` }} />
    </div>
  );
}

function ProcessStepper({ activeStage }) {
  return (
    <ol className="hmi-stepper" aria-label="조리 공정 단계">
      {STAGES.map((stage, idx) => {
        const state = idx < activeStage ? "done" : idx === activeStage ? "active" : "todo";
        return (
          <li className={`step ${state}`} key={stage.key} aria-current={state === "active" ? "step" : undefined}>
            <span className="dot">{state === "done" ? <Check size={15} strokeWidth={3} /> : String(idx + 1).padStart(2, "0")}</span>
            <span className="step-label">{stage.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

const gasPressure = (rpm) => (rpm > 0 ? (2.0 + rpm / 75).toFixed(1) : "0.0");

// 대시보드 KPI 카드 (오늘 요약)
function KpiCard({ icon: Icon, label, value, tone = "" }) {
  return (
    <div className={`kpi-card ${tone}`}>
      <span className="kpi-icon">{Icon ? <Icon size={18} /> : <span className="kpi-won">₩</span>}</span>
      <div className="kpi-body">
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

// WOK 상태 컴팩트 모듈 (대시보드 스트립)
function WokMini({ station, onStart, onPause, onCancel, onFault, queuedNext }) {
  const o = station.order;
  if (!o) {
    return (
      <article className="wok-card idle">
        <header className="wc-head">
          <h4 className="wc-title">{station.name}</h4>
          <span className="wok-badge off">대기</span>
        </header>
        {queuedNext && onStart ? (
          <button className="wm-start" type="button" onClick={() => onStart(queuedNext.uid, station.id)}>
            <Play size={18} />
            <span>
              <b>{queuedNext.primary}</b>
              <small>#{queuedNext.code} · 즉시 조리 시작</small>
            </span>
          </button>
        ) : (
          <div className="wm-empty">
            <Flame size={22} />
            <span>대기 주문 없음</span>
          </div>
        )}
      </article>
    );
  }
  const st = WOK_STATE[o.state] ?? WOK_STATE.normal;
  const frozen = o.state === "paused" || o.state === "fault";
  return (
    <article className={`wok-card ${st.cls}${o.state === "fault" ? " alarmed" : ""}`}>
      <header className="wc-head">
        <h4 className="wc-title">{station.name}</h4>
        <div className="wc-head-right">
          <span className={`wok-badge ${st.cls}`}>{st.label}</span>
          {onPause && (
            <button
              className="wok-ctrl"
              type="button"
              onClick={() => onPause(o.uid)}
              aria-label={o.state === "paused" ? "조리 재개" : "조리 일시 정지"}
              title={o.state === "paused" ? "재개" : "중단"}
            >
              {o.state === "paused" ? <Play size={14} /> : <Pause size={14} />}
            </button>
          )}
          {onFault && (
            <HoldButton
              className="wok-ctrl danger"
              onConfirm={() => onFault(o.uid)}
              label={o.state === "fault" ? "이상 해제 (길게 누르기)" : "장비 이상 보고 (길게 누르기)"}
              holdMs={o.state === "fault" ? 800 : 1600}
            >
              <AlertTriangle size={14} />
            </HoldButton>
          )}
          {onCancel && (
            <HoldButton className="wok-ctrl danger" onConfirm={() => onCancel(o.uid)} label="조리 취소 (길게 누르기)" holdMs={1200}>
              <X size={14} />
            </HoldButton>
          )}
        </div>
      </header>

      <div className="wc-code">#{o.code} · 테이블 {o.table}</div>
      <h3 className="wc-menu">{o.primary}</h3>

      <div className="wc-prog-head">
        <span>조리 진행률</span>
        <strong className="wc-pct">{Math.round(o.progress)} %</strong>
      </div>
      <ProgressBar value={o.progress} label={`${station.name} ${o.primary} 진행률`} />

      <div className="wc-readout">
        <div className="wc-cell">
          <small>온도</small>
          <strong>{station.temp}℃</strong>
          <span>목표 285℃</span>
        </div>
        <div className="wc-cell">
          <small>회전 RPM</small>
          <strong>{station.rpm}</strong>
          <span>범위 50~80</span>
        </div>
        <div className="wc-cell">
          <small>경과 시간</small>
          <strong>{frozen ? "—:—" : fmtSec(o.elapsedSec)}</strong>
          <span>{frozen ? "정지" : `남은 ${fmtSec(o.remainSec)}`}</span>
        </div>
      </div>

      <div className="wc-next">
        <small>다음 단계</small>
        <strong>{frozen ? (o.state === "fault" ? "장비 이상 · 대응 필요" : "일시 정지됨") : o.nextStepLabel}</strong>
      </div>
    </article>
  );
}

const LEVEL_STATUS = { low: "부족", mid: "주의", ok: "정상" };

// 잔량 레벨 행 (소스/분말 공용) — 큰 수치 + 두꺼운 바 + 상태칩, 부족 시 강조
function LevelRow({ item, compact = false, onInject, onRefill, unit = "%" }) {
  const level = item.pct <= 30 ? "low" : item.pct <= 55 ? "mid" : "ok";
  const hasActs = Boolean(onInject || onRefill);
  // 소스=percent, 분말=gram (device-control-interface-spec §9). 바 너비는 잔량 비율(pct) 유지.
  const display = unit === "g" ? `${Math.round((item.pct / 100) * (item.capacityG ?? 1000))}g` : `${Math.round(item.pct)}%`;
  return (
    <div className={`lvl-row ${level}${compact ? " compact" : ""}${hasActs ? " has-acts" : ""}`}>
      <span className="lvl-name">{item.name}</span>
      <div
        className="lvl-bar"
        role="progressbar"
        aria-valuenow={Math.round(item.pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${item.name} 잔량 ${LEVEL_STATUS[level]}`}
      >
        <i className={`lv-${level}`} style={{ width: `${item.pct}%` }} />
      </div>
      <div className="lvl-right">
        <strong className={`lvl-pct lv-${level}`}>{display}</strong>
        {!compact && <span className={`lvl-chip ${level}`}>{LEVEL_STATUS[level]}</span>}
      </div>
      {hasActs && (
        <div className="lvl-acts">
          {level === "low"
            ? onRefill && (
                <button type="button" className="lvl-act refill" onClick={() => onRefill(item.id)} aria-label={`${item.name} 보충`}>
                  보충
                </button>
              )
            : onInject && (
                <button type="button" className="lvl-act inject" onClick={() => onInject(item.id)} aria-label={`${item.name} 투입`}>
                  투입
                </button>
              )}
        </div>
      )}
    </div>
  );
}

const lowCount = (list) => list.filter((x) => x.pct <= 30).length;
// 잔량 배지 — 빈 칸(EMPTY) 우선, 그다음 부족(LOW). 대시에 표시되는 상위 n개 기준.
function levelBadge(list, n = 4) {
  const vis = list.slice(0, n);
  const empty = vis.filter((x) => x.pct <= 0).length;
  const low = vis.filter((x) => x.pct > 0 && x.pct <= 30).length;
  if (empty > 0) return <span className="badge warn">EMPTY {empty}</span>;
  if (low > 0) return <span className="badge warn">LOW {low}</span>;
  return <span className="badge ok">정상</span>;
}
const URGENT_KINDS = new Set(["warn", "error"]); // 긴급(경고/오류) 알림 우선 정렬용

/* ───────────────────────── DASH (대시보드 오버뷰) ───────────────────────── */
// 조리 과정 플로우 — 6단계 노드 + 방향 커넥터 (완료✓ → 진행중 → 대기). v11/v12 기준.
function ProcessFlow({ order, frozen }) {
  const stageIndex = order.stageIndex;
  const fillPct = STAGES.length > 1 ? Math.min(100, (stageIndex / (STAGES.length - 1)) * 100) : 0;
  return (
    <div className="proc">
      <div className="proc-top">
        <span className="proc-lab">조리 과정 · {STAGES.length}단계</span>
        <div className="proc-rem">
          <strong className="rm">{frozen ? "—:—" : fmtSec(order.remainSec)}</strong>
          <small>남음</small>
          <strong className="pc">{Math.round(order.progress)}%</strong>
        </div>
      </div>
      <div className="flow" style={{ "--fill": `${fillPct}%` }}>
        {STAGES.map((s, i) => {
          const state = i < stageIndex ? "done" : i === stageIndex ? "cur" : "todo";
          const tag = state === "done" ? "완료" : state === "cur" ? (frozen ? (order.state === "fault" ? "정지" : "일시정지") : "진행중") : "대기";
          return (
            <div className={`fnode ${state}`} key={s.key}>
              <span className="fcircle">{state === "done" ? "✓" : i + 1}</span>
              <span className="fname">{s.short}</span>
              <span className="ftag">{tag}</span>
            </div>
          );
        })}
      </div>
      <div className="proc-foot">
        <span className="lb">다음 단계</span>
        <span className="nm">{frozen ? (order.state === "fault" ? "장비 이상 · 대응 필요" : "재개 대기") : order.nextStepLabel}</span>
      </div>
    </div>
  );
}

// 자동 투입 시퀀스 — 레시피 재료를 진행률에 따라 완료/투입중/대기로 표시
function InjectSequence({ progress }) {
  const ings = RECIPES.default.ingredients;
  const exact = (progress / 100) * ings.length;
  const doneCount = Math.min(ings.length, Math.floor(exact));
  return (
    <div className="inj-card">
      <div className="inj-head">
        <span className="ih">자동 투입 시퀀스</span>
        <span className="badge ok">{doneCount} / {ings.length} 완료</span>
      </div>
      <div className="inj-seq">
        {ings.map((g, i) => {
          const state = i < doneCount ? "done" : i === doneCount ? "cur" : "todo";
          return (
            <div className={`inj ${state}`} key={g.tank}>
              <div className="st">
                <span className="ic">{state === "done" ? "✓" : state === "cur" ? "●" : ""}</span>
                <span className="nm">{g.name}</span>
              </div>
              <span className="qt">{g.need}{state === "cur" ? " · 투입중" : ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DashView({ system }) {
  const { view, tanks, powders, stats, alarms, togglePause, toggleFault, assignToStation, cancelOrder, injectTank, injectPowder, refillTank, refillPowder } = system;
  const station = view.stations[0]; // 오토웍 ↔ HMI 1:1 — 담당 WOK 1대
  const o = station?.order ?? null;
  const nextQueued = view.queued[0] ?? null;
  const frozen = Boolean(o && (o.state === "paused" || o.state === "fault"));
  const recentEvents = alarms.slice(0, 2);
  const cleanTitle = (t) => t.replace(/^STEP \d+[^·]*· /, "");
  // 긴급정지: 한 번 클릭 + 확인 알림창(되돌리기 어려운 동작). 이상 해제는 즉시 실행.
  const handleEstop = () => {
    if (o?.state === "fault") { toggleFault(o.uid); return; }
    if (window.confirm(`${station?.name ?? "WOK"} 긴급정지를 실행하시겠습니까?\n진행 중인 조리가 즉시 중단됩니다.`)) {
      toggleFault(o.uid);
    }
  };
  return (
    <div className="hmi-view dash2">
      <div className="d2-grid">
        <article className={`d2-wok${o ? " on" : ""}${o?.state === "fault" ? " fault" : ""}`}>
          <header className="d2-wok-head">
            <div className="t">
              <span className="wt">{station?.name}</span>
              <span className="sub">{o ? "ONLINE · 레시피 v2.4" : "ONLINE · 대기"}</span>
            </div>
            <span className={`badge ${o ? "active" : "muted"}`}>{o ? "COOKING" : "IDLE"}</span>
          </header>

          {o ? (
            <div className="d2-body">
              <div className="d2-col">
                <div>
                  <div className="d2-meta">
                    <span>#{o.code} · 테이블 {o.table}</span>
                    <span>{o.channel}</span>
                  </div>
                  <div className="d2-dish">{o.primary}<small>{o.summary}</small></div>
                </div>
                <ProcessFlow order={o} frozen={frozen} />
                <InjectSequence progress={o.progress} />
              </div>

              <div className="d2-col">
                <div className="d2-tele">
                  <div><span>온도</span><strong>{station.temp}<i>℃</i></strong></div>
                  <div><span>회전</span><strong>{station.rpm}<i>RPM</i></strong></div>
                  <div><span>경과</span><strong>{frozen ? "—:—" : fmtSec(o.elapsedSec)}</strong></div>
                </div>
                <div className="d2-cstep">
                  <div className="now">{o.stageLabel}</div>
                  <div className="meta">
                    목표 285℃ · {frozen ? (o.state === "fault" ? "장비 이상 · 즉시 대응" : "일시 정지됨") : `남은 ${fmtSec(o.remainSec)}`}
                  </div>
                </div>
                <div className="d2-actions">
                  <button className="d2-btn" type="button" onClick={() => togglePause(o.uid)}>
                    {o.state === "paused" ? <Play size={15} /> : <Pause size={15} />}
                    {o.state === "paused" ? "재개" : "일시정지"}
                  </button>
                  <button className="d2-btn danger" type="button" onClick={() => cancelOrder(o.uid)}>
                    취소
                  </button>
                  <button className="d2-btn estop" type="button" onClick={handleEstop}>
                    {o.state === "fault" ? "이상 해제" : "긴급정지"}
                  </button>
                </div>
                <div className="d2-evt">
                  <div className="eh">
                    <b>{station.name} 이벤트</b>
                    <span className={`badge ${o.state === "fault" ? "danger" : "ok"}`}>{o.state === "fault" ? "이상" : "정상"}</span>
                  </div>
                  {recentEvents.map((a) => (
                    <div className={`row ${URGENT_KINDS.has(a.kind) ? "warn" : ""}`} key={a.id}>
                      <time>{a.time.slice(0, 5)}</time>
                      <span>{cleanTitle(a.title)}</span>
                    </div>
                  ))}
                </div>
                <div className="d2-pickup">
                  <b>완료 시 → 테이블 {o.table} 픽업 호출 자동</b>
                  <small>{nextQueued ? `다음: #${nextQueued.code} ${nextQueued.summary}` : "다음 대기 없음"}</small>
                </div>
              </div>
            </div>
          ) : (
            <div className="d2-idle">
              <Flame size={28} />
              <p>배정 대기 중</p>
              {nextQueued ? (
                <button className="d2-start" type="button" onClick={() => assignToStation(nextQueued.uid, station.id)}>
                  <Play size={16} /> {nextQueued.primary} 조리 시작
                </button>
              ) : (
                <small>대기 주문이 없습니다</small>
              )}
            </div>
          )}
        </article>

        <aside className="d2-queue">
          <header>
            <h4>조리 대기 큐</h4>
            <span className="badge muted">{station?.name}</span>
          </header>
          <div className="d2-q-note">순서·우선순위·배정은 운영 관제가 결정 · 읽기 전용</div>
          <div className="d2-q-list">
            {view.queued.length === 0 && <p className="d2-q-empty">대기 주문이 없습니다</p>}
            {view.queued.map((q, i) => {
              const startable = i === 0 && !o;
              return (
                <div className={`d2-qc${i === 0 ? " next" : ""}${q.state === "delayed" ? " delayed" : ""}`} key={q.uid}>
                  <div className="qt">
                    <strong>#{q.code}</strong>
                    <span className={`badge ${i === 0 ? "ok" : "muted"}`}>{i === 0 ? "다음" : "대기"}</span>
                  </div>
                  <p className="qn">{q.summary}</p>
                  {startable ? (
                    <button className="d2-qstart" type="button" onClick={() => assignToStation(q.uid, station.id)}>
                      <Play size={12} /> 조리 시작 ▶
                    </button>
                  ) : (
                    <small className="qd">약 {q.estMinutes}분 후</small>
                  )}
                </div>
              );
            })}
          </div>
          <div className="d2-q-foot">
            <div><small>오늘 완료</small><strong>{stats.todayCount}</strong></div>
            <div><small>평균 조리</small><strong className="accent">{fmtSec(stats.avgTimeSec)}</strong></div>
          </div>
        </aside>

        <section className="d2-mat">
          <article className="d2-mcard">
            <header>
              <h3>소스 잔량 · %</h3>
              {lowCount(tanks) > 0 ? <span className="badge warn">LOW {lowCount(tanks)}</span> : <span className="badge ok">정상</span>}
            </header>
            <div className="lvl-list">
              {tanks.slice(0, 4).map((t) => (
                <LevelRow key={t.id} item={t} compact onInject={injectTank} onRefill={refillTank} />
              ))}
            </div>
          </article>
          <article className="d2-mcard">
            <header>
              <h3>분말 잔량 · g</h3>
              {levelBadge(powders)}
            </header>
            <div className="lvl-list">
              {powders.slice(0, 4).map((p) => (
                <LevelRow key={p.id} item={p} compact unit="g" onInject={injectPowder} onRefill={refillPowder} />
              ))}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

/* ───────────────────────── AUTO ───────────────────────── */
function AutoView({ system }) {
  const { view, stats } = system;
  const station = view.stations[0]; // 1:1 — 담당 WOK 1대
  const order = station?.order;
  const [estopOpen, setEstopOpen] = useState(false);
  const confirmEstop = () => {
    if (order) system.toggleFault(order.uid);
    setEstopOpen(false);
  };
  return (
    <div className="hmi-view auto">
      <div className="view-title">
        <h2>
          자동 조리 모드 <span className="badge-green">AUTO</span>
        </h2>
        <p>운영 관제가 담당 WOK에 배정한 주문을 자동 수신 · 자동 조리 · 자동 픽업 호출 (배정 · 우선순위는 운영 관제 권한)</p>
      </div>
      <div className="auto-grid">
        {/* LEFT: 운영 관제 배정 대기열 (읽기 전용) */}
        <section className="auto-queue">
          <header>
            <h3>운영 관제 배정 대기열</h3>
            <span className="pill outline">읽기 전용</span>
          </header>
          <p className="section-mini accent">담당 WOK 조리 중 · {view.cooking.length}건</p>
          {view.cooking.map((o) => (
            <div className="auto-active" key={o.uid}>
              <div className="aa-head">
                <strong>#{o.code}</strong>
                <span className="badge-green sm">AUTO</span>
              </div>
              <p>{o.summary}</p>
              <small className="accent">
                WOK 0{o.stationId} · {Math.round(o.progress)}%
              </small>
            </div>
          ))}
          <p className="section-mini blue">운영 관제 배정 대기 · {view.queued.length}건</p>
          {view.queued.map((o) => (
            <div className="auto-waiting" key={o.uid}>
              <strong>#{o.code}</strong>
              <p>{o.summary}</p>
              <small>{o.estMinutes}분 후 완성</small>
            </div>
          ))}
          <p className="auto-note">
            순서 · 우선순위 · 오토웍 배정은 <b>운영 관제</b>가 결정합니다. 이 화면은 자기 WOK 배정분을 읽기 전용으로 표시하고 조리 시작 · 개입만 수행합니다.
          </p>
        </section>

        {/* CENTER: 담당 WOK 1대 라이브 + 개입 */}
        <section className="auto-live">
          <header className="live-head">
            <h3>담당 WOK 라이브 · {station?.name ?? "WOK 01"} 전담</h3>
            <span className="pill light">{order ? "AUTO 조리 중" : "대기"}</span>
          </header>
          {order ? (
            <div className="auto-wok on solo">
              <div className="aw-headline">
                <p className="aw-menu">{order.primary}</p>
                <span className="aw-eta accent">
                  {order.state === "fault" ? "정지" : order.state === "paused" ? "일시정지" : fmtEta(order.remainSec)}
                </span>
              </div>
              <div className="aw-telemetry">
                <div>
                  <span>가열 온도</span>
                  <strong>{station.temp}℃</strong>
                </div>
                <div>
                  <span>회전 RPM</span>
                  <strong>{station.rpm}</strong>
                </div>
                <div>
                  <span>통신</span>
                  <strong className="green">ONLINE</strong>
                </div>
              </div>
              <ProgressBar value={order.progress} size="lg" label={`${station.name} 진행률`} />
              <div className="aw-foot">
                <span>{Math.round(order.progress)}% 진행</span>
                <span className="accent">{order.nextStepLabel}</span>
              </div>
              <AutoStageTrail stageIndex={order.stageIndex} />
              <div className="auto-intervene">
                <button className="ai-pause" type="button" onClick={() => system.togglePause(order.uid)}>
                  {order.state === "paused" ? "재시작" : "일시 정지"}
                </button>
                <button className="ai-estop" type="button" onClick={() => setEstopOpen(true)}>
                  긴급 정지
                </button>
              </div>
              <p className="auto-note">개입 시 다음 배정 자동 인수가 보류됩니다 · 긴급정지 1터치 시 확인 후 정지 (모드 무관 상시)</p>
            </div>
          ) : (
            <div className="auto-wok idle solo">
              <div className="aw-empty">운영 관제 배정 대기 중</div>
            </div>
          )}
        </section>

        {/* RIGHT: 담당 WOK 자동화 통계 + AI 권장(premium) */}
        <aside className="auto-stats">
          <header>
            <h3>담당 WOK 자동화 통계</h3>
            <span className="pill outline">오늘 · {station?.name ?? "WOK 01"}</span>
          </header>
          {[
            ["이 WOK 자동 처리", `${stats.todayCount} 건`, "전량 자동", "green"],
            ["평균 조리 시간", fmtSec(stats.avgTimeSec), "표준 대비 -12s", "green"],
            ["가동률", "86%", "안정 가동", "green"],
            ["이상 자동 멈춤", `${stats.errors} 건`, "정상", "green"],
          ].map(([k, v, sub, tone]) => (
            <div className="stat-card" key={k}>
              <span>{k}</span>
              <div className="stat-row">
                <strong>{v}</strong>
                <small className={tone}>{sub}</small>
              </div>
            </div>
          ))}
          <div className="ai-reco premium">
            <div className="air-head">
              <strong>
                <Sparkles size={14} /> AI 권장
              </strong>
              <span className="pill ghost">참고</span>
            </div>
            <p className="air-title">17시 짜장 수요 +25% 예상 — 춘장 소스 통 사전 점검</p>
            <small>매장 합산 재고 · 발주 결정은 운영 관제 권한 · 점검 요청 전달됨</small>
            <div className="air-tags">
              <span className="badge-green sm">● 점검 요청 전달</span>
              <span className="pill ghost">재고 안전</span>
            </div>
          </div>
        </aside>
      </div>

      {estopOpen && (
        <div className="hmi-estop-scrim" role="dialog" aria-modal="true" aria-label="긴급 정지 확인">
          <div className="hmi-estop-modal">
            <div className="em-bar" />
            <div className="em-body">
              <span className="em-step">긴급 정지 · 확인 요청</span>
              <h3>긴급 정지를 실행하시겠습니까?</h3>
              <p>
                확정 시 <b>{station?.name ?? "WOK 01"}</b>이 즉시 안전 정지되고 진행 중 조리는 중단됩니다. 신규 배정도 차단됩니다.
              </p>
              <div className="em-target">
                <div>
                  <span>대상 설비</span>
                  <b>{station?.name ?? "WOK 01"} 전담</b>
                </div>
                <div>
                  <span>현재 조리</span>
                  <b>{order ? `#${order.code} · ${order.primary}` : "없음"}</b>
                </div>
                <div>
                  <span>진행 상태</span>
                  <b>{order ? `조리중 · ${Math.round(order.progress)}%` : "대기"}</b>
                </div>
              </div>
              <div className="em-actions">
                <button className="em-cancel" type="button" onClick={() => setEstopOpen(false)}>
                  취소
                </button>
                <button className="em-confirm" type="button" onClick={confirmEstop}>
                  긴급 정지 실행
                </button>
              </div>
              <small className="em-hint">1터치 → 본 확인 → 실행의 2단계로 오작동을 방지합니다</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── MANUAL ───────────────────────── */
// 주문 태블릿(시후 XI HU)과 통일한 WOK 조리가능 메뉴 — 면류·볶음류만 (04_PRD §6.1)
const WOK_MENU = [
  { id: "la-galbi", name: "시후 LA 갈비 짬뽕", cat: "면류", price: 30000 },
  { id: "abalone", name: "시후 활전복 짬뽕", cat: "면류", price: 23000 },
  { id: "mongolian", name: "몽골리안 누들", cat: "면류", price: 18000 },
  { id: "yuni", name: "유니 짜장면", cat: "면류", price: 15000 },
  { id: "lobster", name: "차이나타운 랍스터 볶음", cat: "프리미엄", price: 130000 },
  { id: "mala", name: "마라우육", cat: "프리미엄", price: 70000 },
  { id: "fish-paprika", name: "어향 파프리카", cat: "신메뉴", price: 50000 },
  { id: "kkanpung", name: "크리스피 깐풍 립", cat: "신메뉴", price: 55000 },
];
// 표준 레시피에 쓰이는 소스 4구 / 분말 4구 (대시 v8~v11 잔량 4구와 통일)
const SAUCE_4 = [["#1", "기름", "78%"], ["#2", "춘장", "45%"], ["#3", "향신료", "92%"], ["#4", "육수", "60%"]];
const POWDER_4 = [["P1", "고추 가루", "550g"], ["P2", "마늘 분말", "680g"], ["P3", "후추·향신", "910g"], ["P4", "설탕·MSG", "280g"]];

function ManualView() {
  const [selected, setSelected] = useState(WOK_MENU[0]);
  const [portion, setPortion] = useState("2인분");
  const [spice, setSpice] = useState(2);
  const [temp, setTemp] = useState(285);
  const [rpm, setRpm] = useState(60);
  const [running, setRunning] = useState(false);
  const [estopOpen, setEstopOpen] = useState(false);
  const reasons = ["시식 / 품질 점검", "직원식", "신메뉴 테스트", "긴급 추가", "레시피 보정"];
  const [reason, setReason] = useState(reasons[0]);

  // OPER-05: 긴급 정지 = 1터치 → 확인 모달 → 확정 시 정지
  const confirmEstop = () => {
    setRunning(false);
    setEstopOpen(false);
  };

  return (
    <div className="hmi-view manual">
      <div className="view-title">
        <h2>
          수동 조리 모드 <span className="badge-amber">MANUAL</span>
        </h2>
        <p>주문 태블릿(시후) WOK 조리가능 메뉴 · 온도 · RPM · 소스 4구 · 분말 4구 직접 제어 · 자동 배정 일시 중지</p>
      </div>
      <div className="manual-reasons">
        <span className="muted">사유 선택</span>
        {reasons.map((r) => (
          <button className={`reason-chip ${reason === r ? "on" : ""}`} key={r} type="button" onClick={() => setReason(r)}>
            {r}
          </button>
        ))}
      </div>
      <div className="manual-grid">
        <section className="manual-menu">
          <header>
            <h3>메뉴 선택 · WOK 조리가능</h3>
            <span className="pill outline">{WOK_MENU.length}종</span>
          </header>
          <div className="mm-grid">
            {WOK_MENU.map((m) => (
              <button
                className={`mm-card ${selected.id === m.id ? "on" : ""}`}
                key={m.id}
                type="button"
                onClick={() => setSelected(m)}
              >
                <strong className="mm-name">{m.name}</strong>
                <span className="mm-cat">{m.cat}</span>
                <span className="mm-price">{won(m.price)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="manual-detail">
          <header className="live-head">
            <h3>선택 메뉴 — {selected.name}</h3>
            <span className="pill light">WOK 01 배정</span>
          </header>
          <div className="md-row">
            <span>분량</span>
            <div className="seg">
              {["1인분", "2인분", "3인분"].map((p) => (
                <button className={portion === p ? "on" : ""} key={p} type="button" onClick={() => setPortion(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="md-row">
            <span>매운맛</span>
            <div className="seg">
              {[0, 1, 2, 3].map((n) => (
                <button className={spice === n ? "on red" : ""} key={n} type="button" onClick={() => setSpice(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="md-extra">
            <span>추가 재료</span>
            <div className="extra-list">
              <button className="extra on" type="button">계란 +500</button>
              <button className="extra" type="button">곱빼기 +1000</button>
              <button className="extra" type="button">야채 추가 +500</button>
            </div>
          </div>
          <div className="md-spec">
            <div>
              <span>표준 조리시간</span>
              <strong>약 4분 30초</strong>
            </div>
            <div>
              <span>예상 사용량</span>
              <strong>춘장 60g · 면 150g</strong>
            </div>
          </div>
          <button className={`md-start ${running ? "running" : ""}`} type="button" onClick={() => setRunning((v) => !v)}>
            {running ? <Pause size={16} /> : <Play size={16} />} {running ? "수동 조리 진행 중" : "수동 조리 시작 (WOK 01 배정)"}
          </button>
        </section>

        <section className="manual-control">
          <header>
            <h3>수동 설비 제어 (WOK 01)</h3>
            <span className="badge-green">{running ? "RUNNING" : "READY"}</span>
          </header>
          <div className="mc-readout">
            <div>
              <small>온도</small>
              <strong className="accent">{temp}℃ / 285℃</strong>
            </div>
            <div>
              <small>회전</small>
              <strong className="accent">{rpm} RPM</strong>
            </div>
          </div>
          <div className="mc-slider-block">
            <div className="mc-slider-head">
              <span>가열 온도</span>
              <strong className="accent">{temp}℃ <em>/ 0~320</em></strong>
            </div>
            <div className="bar">
              <i style={{ width: `${(temp / 320) * 100}%` }} />
            </div>
            <div className="mc-steps">
              <button type="button" onClick={() => setTemp((t) => Math.max(0, t - 5))}>− 5℃</button>
              <button type="button" onClick={() => setTemp((t) => Math.max(0, t - 1))}>− 1℃</button>
              <button className="up" type="button" onClick={() => setTemp((t) => Math.min(320, t + 1))}>+ 1℃</button>
              <button className="up" type="button" onClick={() => setTemp((t) => Math.min(320, t + 5))}>+ 5℃</button>
            </div>
          </div>
          <div className="mc-slider-block">
            <div className="mc-slider-head">
              <span>WOK 회전 속도</span>
              <strong className="accent">{rpm} RPM <em>/ 0~90</em></strong>
            </div>
            <div className="bar">
              <i style={{ width: `${(rpm / 90) * 100}%` }} />
            </div>
            <div className="mc-steps">
              <button type="button" onClick={() => setRpm((r) => Math.max(0, r - 5))}>− 5</button>
              <button className="up" type="button" onClick={() => setRpm((r) => Math.min(90, r + 5))}>+ 5</button>
            </div>
          </div>
          <div className="mc-spray">
            <span>소스 통 4구 분사 <em>percent 차감</em></span>
            <div className="spray-row spray-4">
              {SAUCE_4.map(([n, lbl, lv]) => (
                <button className="spray-btn" key={n} type="button">
                  <strong className="accent">{n}</strong>
                  <small>{lbl}</small>
                  <span>{lv}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mc-spray">
            <span>분말 디스펜서 4구 투입 <em>gram 차감</em></span>
            <div className="spray-row spray-4">
              {POWDER_4.map(([n, lbl, lv]) => (
                <button className="spray-btn pw" key={n} type="button">
                  <strong className="blue">{n}</strong>
                  <small>{lbl}</small>
                  <span>{lv}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mc-actions">
            <button className="mc-amber" type="button" onClick={() => setRunning(false)}>일시 정지</button>
            <button className="mc-red" type="button" onClick={() => setEstopOpen(true)}>긴급 정지</button>
            <button className="mc-green" type="button" onClick={() => setRunning(false)}>자동 복귀</button>
          </div>
        </section>
      </div>

      {estopOpen && (
        <div className="hmi-estop-scrim" role="dialog" aria-modal="true" aria-label="긴급 정지 확인">
          <div className="hmi-estop-modal">
            <div className="em-bar" />
            <div className="em-body">
              <span className="em-step">긴급 정지 · 확인 요청</span>
              <h3>긴급 정지를 실행하시겠습니까?</h3>
              <p>
                확정 시 <b>WOK 01</b>이 즉시 안전 정지되고 진행 중 조리는 중단됩니다. 신규 배정도 차단됩니다.
              </p>
              <div className="em-target">
                <div>
                  <span>대상 설비</span>
                  <b>WOK 01 전담</b>
                </div>
                <div>
                  <span>선택 메뉴</span>
                  <b>{selected.name}</b>
                </div>
                <div>
                  <span>현재 상태</span>
                  <b>{running ? "조리중" : "대기"}</b>
                </div>
              </div>
              <div className="em-actions">
                <button className="em-cancel" type="button" onClick={() => setEstopOpen(false)}>
                  취소
                </button>
                <button className="em-confirm" type="button" onClick={confirmEstop}>
                  긴급 정지 실행
                </button>
              </div>
              <small className="em-hint">1터치 → 본 확인 → 실행의 2단계로 오작동을 방지합니다</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── QUEUE ───────────────────────── */
function QueueView({ system }) {
  const { view, confirmOrder, rejectOrder, assignToStation } = system;
  const incoming = view.incoming[0];
  const freeStation = view.stations.find((s) => !s.order);
  const cooking = view.cooking;
  return (
    <div className="hmi-view queue">
      <ProcessStepper activeStage={incoming ? 1 : view.cooking[0]?.stageIndex ?? 1} />
      <div className="queue-grid q3">
        {/* col1: 신규 주문 수신 */}
        <section className={`new-order ${incoming ? "has" : "empty"}`}>
          {incoming ? (
            <>
              <div className="no-head">
                <span className="badge-orange">INCOMING</span>
                <small>{new Date(incoming.receivedAt).toLocaleTimeString("ko-KR", { hour12: false })} 접수</small>
              </div>
              <p className="no-kicker">신규 주문 수신</p>
              <h2 className="no-code">#{incoming.code}</h2>
              <div className="no-facts">
                <div>
                  <small>채널</small>
                  <strong>{incoming.channel}</strong>
                </div>
                <div>
                  <small>위치</small>
                  <strong>테이블 {incoming.table}</strong>
                </div>
                <div>
                  <small>결제</small>
                  <strong>{incoming.payment}</strong>
                </div>
                <div>
                  <small>예상 완성</small>
                  <strong>약 {incoming.estMinutes}분</strong>
                </div>
              </div>
              <div className="no-auto">
                <div>
                  <strong className="accent">자동 확인까지 등록 진행 중</strong>
                  <small>잠시 후 조리 대기에 자동 등록 · 거부하려면 우측 버튼</small>
                </div>
                <div className="no-auto-btns">
                  <button className="orange-btn" type="button" onClick={() => confirmOrder(incoming.uid)}>
                    주문 확인
                  </button>
                  <button className="ghost-btn" type="button" onClick={() => rejectOrder(incoming.uid)}>
                    거부
                  </button>
                </div>
              </div>
              <p className="auto-note">
                신규 주문은 <b>운영 관제</b>가 WOK 01에 배정한 건이며 미확인 시 자동 확인되어 대기열에 들어갑니다. 확인 즉시 무조건 조리되지 않고, 거부 시 운영 관제로 반송됩니다.
              </p>
            </>
          ) : (
            <div className="no-empty">
              <BellRing size={34} />
              <p>신규 주문 대기 중</p>
              <small>고객 태블릿/운영 관제에서 배정되면 여기에 표시됩니다</small>
            </div>
          )}
        </section>

        {/* col2: 주문 내역 */}
        <aside className="order-detail">
          <header>
            <h3>주문 내역 {incoming && `· #${incoming.code}`}</h3>
            {incoming && <span className="pill outline">테이블 {incoming.table}</span>}
          </header>
          {incoming ? (
            <>
              <div className="od-list">
                {incoming.items.map((it, i) => (
                  <div className="od-item" key={i}>
                    <div>
                      <strong>
                        {it.name} {it.qty > 1 ? `${it.qty}` : ""}
                      </strong>
                      {it.options && <small>{it.options}</small>}
                    </div>
                    <b>{won(it.price * it.qty)}</b>
                  </div>
                ))}
                {incoming.memo && (
                  <div className="od-memo">
                    <small>고객 요청 메모</small>
                    <strong>{incoming.memo}</strong>
                  </div>
                )}
              </div>
              <div className="od-total">
                <span>총 주문 금액 · {incoming.items.length}개 품목</span>
                <strong>{won(incoming.total)}</strong>
              </div>
              <p className="auto-note">결제 방식(선불/후불)은 정보로 표시되며, 조리 시작 가능 여부와 무관합니다. 코스 메뉴는 현재 제공 단계 아이템만 조리 대상입니다.</p>
            </>
          ) : (
            <p className="queue-empty">표시할 주문 내역이 없습니다</p>
          )}
        </aside>

        {/* col3: 조리 대기 — WOK 01 배정분 (읽기 전용) */}
        <section className="queue-side">
          <header>
            <h3>조리 대기 · WOK 01 배정분</h3>
            <span className="pill outline">읽기 전용</span>
          </header>
          <p className="section-mini accent">조리 중 · {cooking.length}건</p>
          {cooking.length === 0 && <p className="queue-empty">조리 중인 주문이 없습니다</p>}
          {cooking.map((o) => (
            <div className="qs-cooking" key={o.uid}>
              <div className="qs-top">
                <strong>#{o.code}</strong>
                <span className="badge-orange sm">조리중</span>
              </div>
              <p>{o.summary}</p>
              <small className="accent">
                WOK 0{o.stationId} · {Math.round(o.progress)}% · {fmtEta(o.remainSec)} 후 완료
              </small>
            </div>
          ))}
          <p className="section-mini blue">운영 관제 배정 순서 · {view.queued.length}건</p>
          {view.queued.length === 0 && <p className="queue-empty">대기 중인 주문이 없습니다</p>}
          {view.queued.map((o, i) => (
            <div className={`qs-wait ${i === 0 ? "next" : ""}`} key={o.uid}>
              <div className="qs-top">
                <strong>#{o.code}</strong>
                {i === 0 ? <span className="badge-green sm">NEXT</span> : <span className="qs-ord">대기</span>}
              </div>
              <p>{o.summary}</p>
              <small>대기 {i + 1}</small>
            </div>
          ))}
          {freeStation && view.queued[0] && (
            <button className="orange-btn" type="button" onClick={() => assignToStation(view.queued[0].uid, freeStation.id)}>
              ▶ {freeStation.name} 조리 시작
            </button>
          )}
          <p className="auto-note">
            대기 순서 · 우선순위 · 재배정은 <b>운영 관제</b>가 결정하며 HMI에서 변경할 수 없습니다. WOK 01이 비면 NEXT 주문을 시작하거나 자동 인수됩니다.
          </p>
        </section>
      </div>
    </div>
  );
}

/* ───────────────────────── RECIPE ───────────────────────── */
function RecipeView({ system }) {
  const cooking = system.view.cooking[0];
  const recipe = RECIPES.default;
  const totalSec = recipe.totalSec;
  const ticks = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270];
  const progress = cooking ? Math.round(cooking.progress) : 0;
  const stageCount = recipe.timeline.length;
  const curStage = (cooking?.stageIndex ?? 0) + 1;
  const stageLabel = cooking?.nextStepLabel ?? recipe.timeline[0].label;
  const verNo = recipe.version.split(" ")[0];
  return (
    <div className="hmi-view recipe">
      <ProcessStepper activeStage={cooking?.stageIndex ?? 1} />
      {/* 레시피 헤더 카드 — 메뉴명 + OTA 배지 + 총시간 + 진행 */}
      <section className="recipe-hero">
        <div className="rh-left">
          <h2>
            {cooking?.primary ?? "유니짜장"} <small>Recipe Sequence Loaded</small>
          </h2>
          <p>
            주문 #{cooking?.code ?? "A-024"} · WOK 0{cooking?.stationId ?? 1} 배정 · 본사 표준 공정 {stageCount}단계 · 디스펜서 {recipe.ingredients.length}구 매핑
          </p>
        </div>
        <div className="rh-right">
          <span className="badge-premium">● {recipe.version}</span>
          <div className="rh-kpi">
            <span>총 조리시간</span>
            <strong className="accent">{fmtSec(totalSec)}</strong>
          </div>
          <div className="rh-kpi">
            <span>현재 진행</span>
            <strong>{progress}%</strong>
          </div>
        </div>
      </section>

      <div className="recipe-grid">
        <div className="recipe-main">
          <section className="gantt-board">
            <header>
              <h3>레시피 단계 타임라인</h3>
              <span className="pill outline">총 {fmtSec(totalSec)}</span>
            </header>
            <div className="gantt">
              <div className="gantt-axis">
                <span className="axis-spacer" />
                <div className="axis-ticks">
                  {ticks.map((t) => (
                    <span key={t}>{fmtSec(t)}</span>
                  ))}
                </div>
              </div>
              {recipe.timeline.map((row) => (
                <div className="gantt-row" key={row.label}>
                  <div className="gantt-label">
                    <span>{row.label}</span>
                    <span className={`gantt-tag tag-${row.kind}`}>{row.device}</span>
                  </div>
                  <div className="gantt-track">
                    <span
                      className={`gantt-bar kind-${row.kind}`}
                      style={{ left: `${(row.offset / totalSec) * 100}%`, width: `${(row.dur / totalSec) * 100}%` }}
                    >
                      {row.dur}s
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="recipe-ingredients">
            <header>
              <h3>필요 재료 · 소스 통 매핑</h3>
              <small className="green">· 잔량 모두 충분 — 가동 준비 완료</small>
            </header>
            <div className="ing-row">
              {recipe.ingredients.map((ing) => (
                <div className="ing-card" key={ing.tank}>
                  <div className="ing-head">
                    <span>#{ing.tank}</span>
                    <span className="badge-green sm">OK</span>
                  </div>
                  <strong>{ing.name}</strong>
                  <small>필요 {ing.need}</small>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 우측 패널 — 동기화 / 메타 / OTA 이력 */}
        <aside className="recipe-side">
          <div className="rs-card">
            <span className="rs-title">현재 조리 동기화</span>
            <strong className="rs-sync-top">
              {curStage} / {stageCount} 단계 진행 중
            </strong>
            <p className="rs-sync-now">
              현재 <b>{stageLabel}</b>
            </p>
            <div className="rs-bar">
              <i style={{ width: `${progress}%` }} />
            </div>
            <div className="rs-foot">
              <span>{cooking ? `${fmtEta(cooking.remainSec)} 남음` : "대기"}</span>
              <span className="accent">{progress}%</span>
            </div>
          </div>
          <div className="rs-card">
            <span className="rs-title">레시피 메타</span>
            <div className="rs-kv">
              <span>레시피 ID</span>
              <b>default · {cooking?.primary ?? "유니짜장"}</b>
            </div>
            <div className="rs-kv">
              <span>배포 버전</span>
              <b className="premium">{verNo}</b>
            </div>
            <div className="rs-kv">
              <span>총 단계</span>
              <b>{stageCount} 단계</b>
            </div>
            <div className="rs-kv">
              <span>총 조리시간</span>
              <b>{fmtSec(totalSec)}</b>
            </div>
            <div className="rs-kv">
              <span>디스펜서 매핑</span>
              <b>{recipe.ingredients.length} 구</b>
            </div>
          </div>
          <div className="rs-card">
            <span className="rs-title">본사 OTA 버전 이력</span>
            <div className="rs-ver cur">
              <b>v2.4 · 현재 배포</b>
              <small>2026-05-28 · 시즈닝 타이밍 보정</small>
            </div>
            <div className="rs-ver">
              <b>v2.3</b>
              <small>2026-04-11 · 예열 온도 285℃ 상향</small>
            </div>
            <div className="rs-ver">
              <b>v2.2</b>
              <small>2026-03-02 · 면 토출량 150g 표준화</small>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ───────────────────────── STOCK ───────────────────────── */
function StockView({ system }) {
  const { tanks, powders, refillTank } = system;
  return (
    <div className="hmi-view stock">
      <div className="view-title">
        <h2>재고 관리 — 소스 통 · 분말 디스펜서</h2>
        <p>실시간 잔량 모니터링 · 30% 이하 자동 발주 대기</p>
      </div>
      <div className="stock-grid">
        <section className="stock-col">
          <header>
            <h3>5구 소스 통 — 소스 / 액체</h3>
            <span className="pill outline">실시간</span>
          </header>
          {tanks.map((t) => {
            const level = t.pct <= 30 ? "low" : t.pct <= 55 ? "mid" : "ok";
            return (
              <div className="stock-line" key={t.id}>
                <div className="sl-head">
                  <span>
                    #{t.id} {t.note}
                  </span>
                  <strong className={`lv-${level}`}>{Math.round(t.pct)}%</strong>
                </div>
                <div className="tank-bar">
                  <i className={`lv-${level}`} style={{ width: `${t.pct}%` }} />
                </div>
                <div className="sl-foot">
                  <small>
                    {((t.pct / 100) * t.capacityKg).toFixed(2)} / {t.capacityKg} L
                  </small>
                  {level === "low" ? (
                    <button className="refill-btn" type="button" onClick={() => refillTank(t.id)}>
                      보충
                    </button>
                  ) : (
                    <small className="green">정상</small>
                  )}
                </div>
              </div>
            );
          })}
        </section>
        <section className="stock-col">
          <header>
            <h3>분말 디스펜서 — 향신료 / 분말 재료</h3>
            <span className="pill outline">실시간</span>
          </header>
          {powders.map((p) => {
            const level = p.pct <= 30 ? "low" : p.pct <= 55 ? "mid" : "ok";
            return (
              <div className="stock-line" key={p.id}>
                <div className="sl-head">
                  <span>
                    P{p.id} {p.name}
                  </span>
                  <strong className={`lv-${level}`}>{Math.round(p.pct)}%</strong>
                </div>
                <div className="tank-bar">
                  <i className={`lv-${level}`} style={{ width: `${p.pct}%` }} />
                </div>
                <div className="sl-foot">
                  <small>
                    {Math.round((p.pct / 100) * p.capacityG)} / {p.capacityG} g
                  </small>
                  {level === "low" ? <small className="accent">● 자동 발주 대기</small> : <small className="green">정상</small>}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}

/* ───────────────────────── ALARM ───────────────────────── */
const ALARM_KINDS = {
  done: { label: "단계 완료", cls: "k-done", icon: CheckCircle2 },
  ready: { label: "다음 단계 안내", cls: "k-blue", icon: ChevronRight },
  info: { label: "흐름 정보", cls: "k-blue", icon: Bell },
  warn: { label: "재고 / 경고", cls: "k-warn", icon: AlertTriangle },
  error: { label: "장비 / 오류", cls: "k-error", icon: AlertTriangle },
  pickup: { label: "픽업 호출", cls: "k-orange", icon: PhoneCall },
  ai: { label: "AI 추천", cls: "k-purple", icon: Sparkles },
};

function AlarmView({ system }) {
  const channels = [
    ["화면 토스트", "주방 HMI 우상단 슬라이드 알림 · 4초 표시", Megaphone, "green"],
    ["사운드 알림", "단계별 톤 '딩-동' · 음량 70%", Volume2, "green"],
    ["음성 호출", "'픽업 준비 완료' 자동 음성 안내", PhoneCall, "green"],
    ["점주 모바일 푸시", "이상/경고만 발송 · 정상 단계는 미발송", Bell, "orange"],
    ["본사 클라우드 로그", "전 단계 자동 기록 · 90일 보관", Cloud, "blue"],
  ];
  return (
    <div className="hmi-view alarm">
      <div className="view-title">
        <h2>
          단계 완료 / 작업 알림 시스템 <span className="badge-orange sm">ALARM CENTER</span>
        </h2>
        <p>각 단계 완료 시 '토스트 · 사운드 · 음성 호출 · 점주 푸시 · 본사 로그' 5채널로 동시 알림 발송</p>
      </div>
      <div className="alarm-grid">
        <section className="alarm-log">
          <header>
            <h3>실시간 알림 로그</h3>
            <span className="pill outline">{system.alarms.length}건</span>
          </header>
          <div className="alarm-scroll">
            {system.alarms.map((a) => {
              const kind = ALARM_KINDS[a.kind] ?? ALARM_KINDS.info;
              const Icon = kind.icon;
              return (
                <div className={`alarm-item ${kind.cls}`} key={a.id}>
                  <span className="ai-icon">
                    <Icon size={16} />
                  </span>
                  <div className="ai-body">
                    <div className="ai-top">
                      <strong>{a.title}</strong>
                      <small>{a.time}</small>
                    </div>
                    <p>{a.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <aside className="alarm-side">
          <section className="alarm-channels">
            <header>
              <h3>알림 발송 채널 (5채널 동시 발송)</h3>
              <span className="badge-green sm">5 / 5 ON</span>
            </header>
            {channels.map(([name, desc, Icon, tone]) => (
              <div className="channel-row" key={name}>
                <span className={`ch-dot ${tone}`} />
                <div>
                  <strong>{name}</strong>
                  <small>{desc}</small>
                </div>
                <span className="ch-toggle on" />
              </div>
            ))}
          </section>
          <section className="alarm-types">
            <header>
              <h3>알림 유형 (색상 / 우선순위 구분)</h3>
            </header>
            <div className="types-grid">
              {Object.values(ALARM_KINDS)
                .filter((v, i, arr) => arr.findIndex((x) => x.label === v.label) === i)
                .map((k) => {
                  const Icon = k.icon;
                  return (
                    <div className={`type-card ${k.cls}`} key={k.label}>
                      <Icon size={15} />
                      <strong>{k.label}</strong>
                    </div>
                  );
                })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

/* ───────────────────────── SETUP ───────────────────────── */
function SetupView({ system }) {
  const { mode, setMode } = system;
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [sound, setSound] = useState(true);
  const [push, setPush] = useState(true);
  const groups = [
    {
      title: "조리 운영",
      icon: Flame,
      rows: [
        { k: "기본 운영 모드", v: mode === "auto" ? "자동 (AI 분배)" : "수동", toggle: () => setMode(mode === "auto" ? "manual" : "auto"), state: mode === "auto" },
        { k: "신규 주문 자동 확인", v: autoConfirm ? "4초 후 자동 등록" : "수동 확인", toggle: () => setAutoConfirm((v) => !v), state: autoConfirm },
        { k: "WOK 동시 가동 수", v: `${system.stationCount} 스테이션 가동 · 최대 ${system.maxStationCount}기`, state: true, fixed: true },
      ],
    },
    {
      title: "알림 / 사운드",
      icon: Volume2,
      rows: [
        { k: "사운드 알림", v: sound ? "ON · 70%" : "OFF", toggle: () => setSound((v) => !v), state: sound },
        { k: "점주 모바일 푸시", v: push ? "이상/경고만" : "OFF", toggle: () => setPush((v) => !v), state: push },
      ],
    },
    {
      title: "장비 / 시스템",
      icon: Cpu,
      rows: [
        { k: "레시피 OTA 버전", v: "v2.4 · 본사 동기화", state: true, fixed: true },
        { k: "본사 클라우드 로그", v: "90일 보관 · 정상", state: true, fixed: true },
        { k: "디바이스", v: "Windows Industrial PC · 10\" HMI", state: true, fixed: true },
      ],
    },
  ];
  return (
    <div className="hmi-view setup">
      <div className="view-title">
        <h2>
          시스템 설정 <span className="badge-orange sm">SETUP</span>
        </h2>
        <p>주방 HMI 운영 · 알림 · 장비 환경 설정</p>
      </div>
      <div className="setup-grid">
        {groups.map((g) => {
          const Icon = g.icon;
          return (
            <section className="setup-card" key={g.title}>
              <header>
                <Icon size={18} />
                <h3>{g.title}</h3>
              </header>
              {g.rows.map((row) => (
                <div className="setup-row" key={row.k}>
                  <div>
                    <strong>{row.k}</strong>
                    <small>{row.v}</small>
                  </div>
                  {row.fixed ? (
                    <span className="setup-fixed">고정</span>
                  ) : (
                    <button
                      className={`setup-toggle ${row.state ? "on" : ""}`}
                      type="button"
                      onClick={row.toggle}
                      aria-pressed={row.state}
                    >
                      <i />
                    </button>
                  )}
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// 자동/수동 통합 운영 뷰 — 한 메뉴에서 모드 전환 + 해당 현황 관리
function ControlView({ system }) {
  const { mode, setMode } = system;
  return (
    <div className="hmi-view operate">
      <div className="mode-segment" role="tablist" aria-label="조리 운영 모드">
        <button
          className={mode === "auto" ? "active" : ""}
          onClick={() => mode !== "auto" && setMode("auto")}
          role="tab"
          aria-selected={mode === "auto"}
          type="button"
        >
          <Brain size={18} />
          <span>자동 <small>AI 자동 정렬 · 배정 · 픽업</small></span>
        </button>
        <button
          className={mode === "manual" ? "active" : ""}
          onClick={() => mode !== "manual" && setMode("manual")}
          role="tab"
          aria-selected={mode === "manual"}
          type="button"
        >
          <Hand size={18} />
          <span>수동 <small>운영자 직접 WOK 제어</small></span>
        </button>
      </div>
      {mode === "auto" ? <AutoView system={system} /> : <ManualView system={system} />}
    </div>
  );
}

/* ───────────────────────── HISTORY (이력) ───────────────────────── */
const HISTORY_TABS = [
  { id: "cook", label: "조리 기록" },
  { id: "error", label: "오류 이력" },
  { id: "log", label: "작업 로그" },
];

const fmtClock = (ts) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

function AlarmRow({ alarm }) {
  const kind = ALARM_KINDS[alarm.kind] ?? ALARM_KINDS.info;
  const Icon = kind.icon;
  return (
    <div className={`alarm-item ${kind.cls}`}>
      <span className="ai-icon">
        <Icon size={16} />
      </span>
      <div className="ai-body">
        <div className="ai-top">
          <strong>{alarm.title}</strong>
          <small>{alarm.time}</small>
        </div>
        <p>{alarm.detail}</p>
      </div>
    </div>
  );
}

// 운영 이력 — 조리 기록 / 생산량 / 오류 이력 / 작업 로그 (PRD §6.8). 스토어 실데이터 기반.
function HistoryView({ system }) {
  const { history, alarms, stats } = system;
  const [tab, setTab] = useState("cook");

  const total = history.length;
  const faults = history.filter((h) => h.result !== "success").length;
  const successRate = total ? Math.round(((total - faults) / total) * 1000) / 10 : 100;
  const errorLog = alarms.filter((a) => a.kind === "warn" || a.kind === "error");

  const byMenu = {};
  for (const h of history) byMenu[h.primary] = (byMenu[h.primary] ?? 0) + 1;
  const menuRanks = Object.entries(byMenu)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxRank = menuRanks[0]?.[1] || 1;

  const kpis = [
    { k: "오늘 누적 생산", v: `${stats.todayCount}건`, sub: "전 채널 합산", tone: "green" },
    { k: "평균 조리 시간", v: fmtSec(stats.avgTimeSec), sub: "완료 기준", tone: "green" },
    { k: "조리 성공률", v: `${successRate}%`, sub: `오류 ${faults}건 제외`, tone: faults ? "warn" : "green" },
    { k: "오류 발생", v: `${errorLog.length}건`, sub: "경고/오류 로그", tone: errorLog.length ? "warn" : "green" },
  ];

  return (
    <div className="hmi-view history">
      <div className="view-title">
        <h2>
          운영 이력 · 기록 <span className="badge-green sm">HISTORY</span>
        </h2>
        <p>조리 기록 · 생산량 · 오류 이력 · 작업 로그를 한 화면에서 추적 — 운영/품질/유지보수 KPI의 원천 데이터</p>
      </div>

      <div className="hist-kpis">
        {kpis.map((c) => (
          <div className="stat-card" key={c.k}>
            <span>{c.k}</span>
            <div className="stat-row">
              <strong>{c.v}</strong>
              <small className={c.tone}>{c.sub}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="hist-body">
        <section className="hist-main">
          <div className="hist-tabs" role="tablist" aria-label="이력 분류">
            {HISTORY_TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={tab === t.id ? "active" : ""}
                type="button"
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "cook" && (
            <div className="hist-table" role="table" aria-label="조리 기록">
              <div className="ht-head" role="row">
                <span>완료</span>
                <span>주문</span>
                <span>메뉴</span>
                <span>WOK</span>
                <span>채널</span>
                <span>조리시간</span>
                <span>결과</span>
              </div>
              {history.length === 0 && (
                <p className="queue-empty">완료된 조리 기록이 없습니다 · 조리가 끝나면 자동 기록됩니다</p>
              )}
              {history.map((h) => (
                <div className={`ht-row ${h.result !== "success" ? "fault" : ""}`} role="row" key={h.id}>
                  <span>{fmtClock(h.completedAt)}</span>
                  <strong>#{h.code}</strong>
                  <span className="ht-menu">{h.summary}</span>
                  <span>WOK 0{h.stationId}</span>
                  <span>{h.channel}</span>
                  <span>{fmtSec(h.durationSec)}</span>
                  <span>
                    {h.result === "success" ? (
                      <span className="badge-green sm">완료</span>
                    ) : (
                      <span className="badge-amber" title={h.fault ?? "조리 오류"}>오류</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === "error" && (
            <div className="alarm-scroll">
              {errorLog.length === 0 && <p className="queue-empty">기록된 오류·경고가 없습니다</p>}
              {errorLog.map((a) => (
                <AlarmRow alarm={a} key={a.id} />
              ))}
            </div>
          )}

          {tab === "log" && (
            <div className="alarm-scroll">
              {alarms.length === 0 && <p className="queue-empty">작업 로그가 없습니다</p>}
              {alarms.map((a) => (
                <AlarmRow alarm={a} key={a.id} />
              ))}
            </div>
          )}
        </section>

        <aside className="hist-side">
          <section className="hist-rank">
            <header>
              <h3>메뉴별 생산량</h3>
              <span className="pill outline">{total}건</span>
            </header>
            {menuRanks.length === 0 && <p className="queue-empty">집계할 생산 기록이 없습니다</p>}
            {menuRanks.map(([name, n], i) => (
              <div className="rank-row" key={name}>
                <span className="rank-no">{i + 1}</span>
                <div className="rank-bar-wrap">
                  <div className="rank-top">
                    <strong>{name}</strong>
                    <b>{n}건</b>
                  </div>
                  <div className="rank-bar">
                    <i style={{ width: `${(n / maxRank) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </section>
          <section className="hist-export">
            <header>
              <h3>이력 보관 · 내보내기</h3>
            </header>
            <p className="hist-note">본사 클라우드 로그 90일 보관 · 전 단계 자동 기록</p>
            <button className="ghost-btn" type="button" disabled>
              CSV 내보내기 (준비 중)
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

const VIEWS = {
  dash: DashView,
  operate: ControlView,
  queue: QueueView,
  recipe: RecipeView,
  stock: StockView,
  alarm: AlarmView,
  history: HistoryView,
  setup: SetupView,
};

export default function KitchenHmi() {
  const system = useKitchenSystem();
  const [active, setActive] = useState("dash");
  const [alarmOpen, setAlarmOpen] = useState(false);
  const View = VIEWS[active] ?? DashView;

  return (
    <section className="hmi-screen">
      <div className="hmi-device">
        <header className="hmi-topbar">
          <div className="hmi-brand">
            <span className="hmi-logo">UND</span>
            <strong>SMART KITCHEN</strong>
            <em>— 주방 운영 화면</em>
          </div>
          <div className="hmi-status">
            <span className="wok-pill">● WOK 01 전담</span>
            <span className={`mode-pill ${system.mode}`} title="운영 모드는 SETUP에서 변경">
              ● {system.mode === "auto" ? "AUTO 모드" : "MANUAL 모드"}
            </span>
            {system.mode === "manual" && <span className="admin-pill">관리자 권한</span>}
            <span className="status-ok">● 정상 운영</span>
            <div className="alarm-bell">
              <button
                className={`status-alarm ${system.view.pendingAlarms ? "on" : ""}`}
                type="button"
                onClick={() => setAlarmOpen((o) => !o)}
                aria-haspopup="dialog"
                aria-expanded={alarmOpen}
                title={system.view.pendingAlarms ? `미확인 알림 ${system.view.pendingAlarms}건` : "알림 없음"}
              >
                <Bell size={13} /> 알림 확인
              </button>
              {alarmOpen && (
                <>
                  <div className="alarm-pop-backdrop" onClick={() => setAlarmOpen(false)} />
                  <div className="alarm-pop" role="dialog" aria-label="긴급 알림 목록">
                    <header>
                      <strong>긴급 · 알림</strong>
                      {system.view.pendingAlarms > 0 ? (
                        <span className="pill danger">긴급 {system.view.pendingAlarms}</span>
                      ) : (
                        <span className="pill outline">정상</span>
                      )}
                    </header>
                    <div className="alarm-pop-list">
                      {system.alarms.length === 0 && <p className="queue-empty">새 알림이 없습니다</p>}
                      {[...system.alarms]
                        .sort(
                          (a, b) =>
                            (URGENT_KINDS.has(b.kind) ? 1 : 0) - (URGENT_KINDS.has(a.kind) ? 1 : 0),
                        )
                        .slice(0, 8)
                        .map((a) => {
                          const kind = ALARM_KINDS[a.kind] ?? ALARM_KINDS.info;
                          const Icon = kind.icon;
                          return (
                            <div className={`dash-alarm-row ${kind.cls}`} key={a.id}>
                              <Icon size={14} />
                              <div>
                                <strong>{a.title}</strong>
                                <small>
                                  {a.detail} · {a.time}
                                </small>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    <div className="alarm-pop-foot">
                      <button
                        className="alarm-pop-all"
                        type="button"
                        onClick={() => {
                          setActive("alarm");
                          setAlarmOpen(false);
                        }}
                      >
                        전체 보기
                      </button>
                      <button
                        className="alarm-ack"
                        type="button"
                        onClick={() => {
                          system.acknowledgeAlarms();
                          setAlarmOpen(false);
                        }}
                      >
                        모두 확인
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <time>
              {system.clock.date} {system.clock.time}
            </time>
          </div>
        </header>
        <div className="hmi-body">
          <nav className="hmi-nav" aria-label="주방 HMI 메뉴">
            {NAV.map((n) => (
              <button
                className={active === n.id ? "active" : ""}
                key={n.id}
                type="button"
                onClick={() => setActive(n.id)}
              >
                <span className="nav-label">{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="hmi-main">
            <View system={system} onNavigate={setActive} />
          </div>
        </div>
        {/* 이벤트 토스트 — 우상단 슬라이드 (성공/정보/경고). 4초 자동 소멸, 탭 시 즉시 닫기 */}
        {system.toasts.length > 0 && (
          <div className="hmi-toasts" aria-live="polite">
            {system.toasts.map((t) => {
              const kind = ALARM_KINDS[t.kind] ?? ALARM_KINDS.info;
              const Icon = kind.icon;
              return (
                <button className={`hmi-toast ${kind.cls}`} key={t.id} type="button" onClick={() => system.dismissToast(t.id)}>
                  <Icon size={16} />
                  <div>
                    <strong>{t.title}</strong>
                    <small>
                      {t.detail} · {t.time}
                    </small>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
