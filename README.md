# SMART Kitchen

SMART Kitchen 실제 제품/애플리케이션 코드 저장소다.

## 저장소 역할

- 코드 루트: `C:\projects\SMART_KITCHEN`
- 문서 루트: `C:\Workspace\Obsidian\PMO_Vault\Projects\SMART_Docs`

이 저장소는 실제 제품 코드와 코드 실행에 필요한 설정만 관리한다. 기획 문서, SSOT, PMO 기록, 생성 산출물, mockup, 레거시 문서 생성 스크립트는 `SMART_Docs`에서 관리한다.

## 현재 상태

이전에 사용하던 문서 생성 스크립트는 아래 위치로 이관했다.

```text
C:\Workspace\Obsidian\PMO_Vault\Projects\SMART_Docs\Development\Legacy_Document_Scripts
```

생성 산출물은 아래 위치에서 관리한다.

```text
SMART_Docs\PMO\Source_Documents
SMART_Docs\PMO\Generated_Documents
SMART_Docs\Assets\Mockups
```

## Mockup 중심 프로토타입

현재 구현 방향은 세부 백엔드/DB/장비 제어를 확정하기 전, `SMART_Docs\Assets\Mockups` 이미지를 기준으로 고객 태블릿, 주방 HMI, 점주 운영 화면의 흐름을 검증하는 React/Vite 프로토타입이다.

고객 태블릿은 mockup 이미지를 단순히 보여주는 방식이 아니라, 태블릿에서 바로 사용할 수 있는 주문 UI로 코드 구현한다. 화면 주변의 참고 mockup 목록과 검증 패널은 제거하고, `고객 태블릿 / 주방 HMI / 점주 운영` 카테고리 내비게이션으로 전환한다.

현재 프로토타입 범위:

- 고객 태블릿: 실사용 UI, 메뉴/옵션/장바구니/주문 요청/주문 완료/직원 호출 흐름
- 주방 HMI: 주문 큐, 공정 단계, 웍 제어 시뮬레이터 상태
- 점주 운영: KPI, 동기화 상태, 리포트 다운로드 흐름

## 로컬 실행

의존성을 설치한 뒤 Vite 개발 서버를 실행한다.

```powershell
npm.cmd install
npm.cmd run dev
```

브라우저에서 아래 주소로 확인한다.

```text
http://127.0.0.1:5173
```

프로덕션 빌드는 아래 명령으로 확인한다.

```powershell
npm.cmd run build
```

## Vercel 배포

Vercel 프로젝트는 Git 원격 저장소의 `prototype` 브랜치를 기준으로 배포한다.

```powershell
git checkout prototype
git pull origin prototype
git push origin prototype
```

`prototype` 브랜치에 새 커밋이 push되면 Vercel에서 자동으로 새 배포가 생성된다. 배포 결과와 URL은 Vercel 프로젝트의 `Deployments` 탭에서 확인한다.

## Git 운영

- 코드 Git: `C:\projects\SMART_KITCHEN`
- 문서 Git: `C:\Workspace\Obsidian\PMO_Vault`

코드 변경은 이 저장소에서 커밋한다. 문서, PMO, SSOT, 프롬프트, 자산, 레거시 스크립트 변경은 Vault 저장소에서 커밋한다.
