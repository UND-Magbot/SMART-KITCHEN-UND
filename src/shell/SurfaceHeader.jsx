/**
 * SurfaceHeader — 전 surface 공통 헤더 셸.
 *
 * 고객 태블릿 베이스라인(`.tablet-header`)에서 추출한 공통 헤더.
 * 좌측 브랜드(UND SMART KITCHEN) + 선택적 컨텍스트 라벨 + 우측 액션 슬롯 + 오렌지 언더라인.
 *
 * 베이스라인: SMART_Docs/03_Design/UIUX/02_고객_태블릿_베이스라인.md §2
 * 공통 스펙: SMART_Docs/03_Design/UIUX/01_공통_레이아웃_스펙.md §3
 *
 * 신규 surface(POS 등)는 이 컴포넌트를 사용한다.
 * 고객/주방 화면은 점진적으로 이 컴포넌트로 이관 가능(현재는 자체 헤더 유지).
 */
export default function SurfaceHeader({ context, actions }) {
  return (
    <header className="tablet-header surface-header">
      <div className="header-title">
        <div className="sidebar-logo">
          <strong>UND</strong>
          <span>SMART KITCHEN</span>
        </div>
        {context && <span className="surface-header-context">{context}</span>}
      </div>
      <div className="header-actions">{actions}</div>
    </header>
  );
}
