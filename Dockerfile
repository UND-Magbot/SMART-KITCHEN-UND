# syntax=docker/dockerfile:1

# ── build stage: Vite 정적 빌드 ──────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# 의존성 레이어 캐시: lock 파일만 먼저 복사
COPY package.json package-lock.json ./
RUN npm ci

# 소스 복사 후 프로덕션 빌드 (dist/ 생성)
COPY . .
RUN npm run build

# ── serve stage: nginx 정적 서빙 ─────────────────────────────
FROM nginx:1.27-alpine AS serve

# SPA 라우팅·gzip·캐시 설정
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 산출물만 복사
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# 컨테이너 헬스체크 (compose healthcheck 와 별개로 이미지 자체 보증)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
