import { useMemo, useState } from "react";
import { Banknote, CreditCard, Smartphone, Trash2, Plus, Minus, Send, Bell } from "lucide-react";

import SurfaceHeader from "../shell/SurfaceHeader";
import { useKitchenSystem, MANUAL_MENU } from "../kitchen/useKitchenSystem";

const PAY_METHODS = [
  { id: "신용카드", label: "신용카드", icon: CreditCard },
  { id: "현금", label: "현금", icon: Banknote },
  { id: "간편결제", label: "간편결제", icon: Smartphone },
];

const won = (n) => `${(n ?? 0).toLocaleString()}원`;

const STATUS_BADGE = {
  incoming: { label: "결제 대기", tone: "pending" },
  queued: { label: "주방 대기", tone: "queued" },
  cooking: { label: "조리 중", tone: "cooking" },
  done: { label: "완료", tone: "done" },
  rejected: { label: "취소", tone: "rejected" },
};

export default function PosView() {
  const sys = useKitchenSystem();
  const { orders, clock, payAndSend, rejectOrder, placeOrder, view } = sys;

  const pending = useMemo(() => orders.filter((o) => o.status === "incoming"), [orders]);
  const sent = useMemo(
    () => orders.filter((o) => o.status === "queued" || o.status === "cooking").sort((a, b) => b.receivedAt - a.receivedAt),
    [orders],
  );

  const [selectedUid, setSelectedUid] = useState(null);
  const [method, setMethod] = useState("신용카드");
  const [walkCart, setWalkCart] = useState([]); // 직원 직접 주문 임시 카트

  // 선택 주문 결정: 명시 선택 > 첫 결제 대기 주문
  const selected = useMemo(() => {
    const byId = orders.find((o) => o.uid === selectedUid);
    if (byId && (byId.status === "incoming" || byId.status === "queued" || byId.status === "cooking")) return byId;
    return pending[0] ?? null;
  }, [orders, selectedUid, pending]);

  const walkTotal = walkCart.reduce((s, it) => s + it.price * it.qty, 0);

  // ── 직원 직접 주문 ──
  const addWalk = (menu) =>
    setWalkCart((prev) => {
      const hit = prev.find((x) => x.id === menu.id);
      if (hit) return prev.map((x) => (x.id === menu.id ? { ...x, qty: x.qty + 1 } : x));
      return [...prev, { id: menu.id, name: menu.name, price: menu.price, qty: 1, cookable: menu.cat !== "음료" }];
    });
  const stepWalk = (id, d) =>
    setWalkCart((prev) =>
      prev.flatMap((x) => (x.id === id ? (x.qty + d <= 0 ? [] : [{ ...x, qty: x.qty + d }]) : [x])),
    );
  const createWalkOrder = () => {
    if (!walkCart.length) return;
    placeOrder({
      items: walkCart.map((x) => ({ name: x.name, qty: x.qty, price: x.price, cookable: x.cookable })),
      total: walkTotal,
      table: "포장",
      channel: "카운터 직접",
      paid: false,
    });
    setWalkCart([]);
  };

  // ── 결제 ──
  const onPay = () => {
    if (!selected || selected.status !== "incoming") return;
    payAndSend(selected.uid, method);
    setSelectedUid(null);
  };
  const onCancel = () => {
    if (!selected || selected.status !== "incoming") return;
    rejectOrder(selected.uid);
    setSelectedUid(null);
  };

  const supply = selected ? Math.round(selected.total / 1.1) : 0;
  const vat = selected ? selected.total - supply : 0;
  const isPending = selected?.status === "incoming";

  return (
    <section className="pos-screen" aria-label="카운터 POS">
      <SurfaceHeader
        context="카운터 POS"
        actions={
          <>
            <div className="header-clock" aria-label="현재 시각">
              <span>{clock.date}</span>
              <b>{clock.time}</b>
            </div>
            <span className="pos-staff-chip"><Bell size={14} /> 김직원 · 근무중</span>
            <span className="table-chip">알람 {view.pendingAlarms}</span>
          </>
        }
      />

      <div className="pos-shell">
        {/* 좌: 주문 큐 보드 */}
        <aside className="pos-queue" aria-label="주문 큐">
          <div className="pos-queue-group">
            <div className="pos-queue-head">
              결제 대기 <span className="pos-count pending">{pending.length}</span>
            </div>
            {pending.length === 0 && <p className="pos-queue-empty">대기 중인 결제가 없습니다.</p>}
            {pending.map((o) => (
              <button
                key={o.uid}
                type="button"
                className={`pos-order-card${selected?.uid === o.uid ? " active" : ""}`}
                onClick={() => setSelectedUid(o.uid)}
              >
                <div className="pos-order-top">
                  <strong>{o.code}</strong>
                  <span className={`pos-badge ${STATUS_BADGE[o.status].tone}`}>{STATUS_BADGE[o.status].label}</span>
                </div>
                <div className="pos-order-sub">
                  <span className="table-chip sm">TABLE {o.table}</span>
                  <span>{o.channel}</span>
                </div>
                <div className="pos-order-foot">
                  <span className="pos-order-items">{o.items.map((it) => `${it.name} ${it.qty}`).join(" · ")}</span>
                  <b>{won(o.total)}</b>
                </div>
              </button>
            ))}
          </div>

          <div className="pos-queue-group">
            <div className="pos-queue-head">
              진행 중 <span className="pos-count">{sent.length}</span>
            </div>
            {sent.length === 0 && <p className="pos-queue-empty">진행 중인 주문이 없습니다.</p>}
            {sent.map((o) => (
              <button
                key={o.uid}
                type="button"
                className={`pos-order-card slim${selected?.uid === o.uid ? " active" : ""}`}
                onClick={() => setSelectedUid(o.uid)}
              >
                <div className="pos-order-top">
                  <strong>{o.code}</strong>
                  <span className={`pos-badge ${STATUS_BADGE[o.status].tone}`}>{STATUS_BADGE[o.status].label}</span>
                </div>
                <div className="pos-order-foot">
                  <span className="pos-order-items">TABLE {o.table} · {o.items.map((it) => it.name).join(", ")}</span>
                  <b>{won(o.total)}</b>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* 중: 주문 상세 + 직원 직접 주문 */}
        <div className="pos-detail">
          {selected ? (
            <>
              <div className="pos-detail-head">
                <div>
                  <h2>{selected.code}</h2>
                  <p>
                    <span className="table-chip">TABLE {selected.table}</span> {selected.channel} ·{" "}
                    {selected.paid ? `${selected.payment}` : "미결제"}
                  </p>
                </div>
                <span className={`pos-badge lg ${STATUS_BADGE[selected.status].tone}`}>
                  {STATUS_BADGE[selected.status].label}
                </span>
              </div>

              <ul className="pos-item-list">
                {selected.items.map((it, i) => (
                  <li key={i}>
                    <span className="pos-item-name">
                      {it.name}
                      {it.options ? <small> {it.options}</small> : null}
                      {!it.cookable ? <em className="pos-item-tag">조리 외</em> : null}
                    </span>
                    <span className="pos-item-qty">×{it.qty}</span>
                    <span className="pos-item-price">{won((it.price ?? 0) * it.qty)}</span>
                  </li>
                ))}
              </ul>
              {selected.memo && <div className="pos-memo">요청사항: {selected.memo}</div>}
            </>
          ) : (
            <div className="pos-empty">
              <p className="pos-empty-title">선택된 주문이 없습니다</p>
              <p className="pos-empty-sub">좌측 결제 대기 목록에서 주문을 선택하거나, 아래에서 직원 직접 주문을 생성하세요.</p>
            </div>
          )}

          {/* 직원 직접 주문 */}
          <div className="pos-walkin">
            <div className="pos-walkin-head">직원 직접 주문 (워크인 / 포장)</div>
            <div className="pos-walkin-menu">
              {MANUAL_MENU.map((m) => (
                <button key={m.id} type="button" className="pos-menu-chip" onClick={() => addWalk(m)}>
                  <span>{m.name}</span>
                  <small>{won(m.price)}</small>
                </button>
              ))}
            </div>
            {walkCart.length > 0 && (
              <div className="pos-walkin-cart">
                {walkCart.map((x) => (
                  <div key={x.id} className="pos-walkin-row">
                    <span>{x.name}</span>
                    <div className="pos-qty">
                      <button type="button" onClick={() => stepWalk(x.id, -1)} aria-label="수량 감소"><Minus size={14} /></button>
                      <b>{x.qty}</b>
                      <button type="button" onClick={() => stepWalk(x.id, 1)} aria-label="수량 증가"><Plus size={14} /></button>
                    </div>
                    <b>{won(x.price * x.qty)}</b>
                  </div>
                ))}
                <button type="button" className="pos-walkin-create" onClick={createWalkOrder}>
                  <Plus size={16} /> 주문 생성 · {won(walkTotal)}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 우: 결제 패널 */}
        <aside className="pos-pay" aria-label="결제">
          <div className="pos-pay-head">결제</div>
          <div className="pos-pay-summary">
            <div className="pos-pay-row"><span>공급가액</span><span>{won(supply)}</span></div>
            <div className="pos-pay-row"><span>부가세 (10%)</span><span>{won(vat)}</span></div>
            <div className="pos-pay-row total"><span>결제 금액</span><b>{won(selected?.total ?? 0)}</b></div>
          </div>

          <div className="pos-pay-methods" role="group" aria-label="결제 수단">
            {PAY_METHODS.map((pm) => {
              const Icon = pm.icon;
              return (
                <button
                  key={pm.id}
                  type="button"
                  className={`pos-method${method === pm.id ? " active" : ""}`}
                  onClick={() => setMethod(pm.id)}
                  disabled={!isPending}
                >
                  <Icon size={18} />
                  <span>{pm.label}</span>
                </button>
              );
            })}
          </div>

          {isPending ? (
            <>
              <button type="button" className="pos-cta-pay" onClick={onPay}>
                <Send size={18} /> 결제 완료 · 주방 전송
              </button>
              <button type="button" className="pos-cta-cancel" onClick={onCancel}>
                <Trash2 size={16} /> 주문 취소
              </button>
            </>
          ) : (
            <div className="pos-pay-sent">
              {selected
                ? `${STATUS_BADGE[selected.status]?.label} · ${selected.payment ?? "결제 완료"} — 주방으로 전송됨`
                : "주문을 선택하면 결제를 진행할 수 있습니다."}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
