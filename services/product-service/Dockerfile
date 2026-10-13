# Gemeinsame Basis: Node 22 auf Alpine.
# corepack liefert genau die pnpm-Version aus "packageManager" in package.json.
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ---------- Stufe 1: bauen ----------
FROM base AS build

# Erst nur Manifeste und Lockdatei, damit "pnpm install" im Cache bleibt,
# solange sich die Abhängigkeiten nicht ändern
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY services/product-service/package.json services/product-service/
RUN pnpm install --frozen-lockfile --filter @markise/product-service...

# Dann den Code kopieren und bündeln
COPY packages/shared packages/shared
COPY services/product-service services/product-service
RUN pnpm --filter @markise/product-service build

# ---------- Stufe 2: ausführen ----------
FROM base AS runtime
ENV NODE_ENV=production

# Nur die Pakete für den Betrieb, ohne Test- und Build-Werkzeuge
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY services/product-service/package.json services/product-service/
RUN pnpm install --frozen-lockfile --prod --filter @markise/product-service...

# Aus Stufe 1 nur die fertige JavaScript-Datei übernehmen
COPY --from=build /app/services/product-service/dist services/product-service/dist

WORKDIR /app/services/product-service

# Nicht als root laufen
USER node

EXPOSE 4001
CMD ["node", "dist/server.js"]