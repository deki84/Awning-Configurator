# Gemeinsame Basis: Node 22 auf Alpine, also klein.
# corepack liefert genau die pnpm-Version aus "packageManager" in package.json.
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

# ---------- Stufe 1: bauen ----------
FROM base AS build

# Erst nur die package.json-Dateien und die Lockdatei kopieren.
# Docker merkt sich diese Schicht: Solange sich die Abhängigkeiten nicht
# ändern, wird "pnpm install" beim nächsten Build übersprungen.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY services/order-service/package.json services/order-service/

# Nur den order-service und alles, was er braucht, installieren (die drei Punkte)
RUN pnpm install --frozen-lockfile --filter @markise/order-service...

# Jetzt den eigentlichen Code kopieren und bündeln
COPY packages/shared packages/shared
COPY services/order-service services/order-service
RUN pnpm --filter @markise/order-service build

# ---------- Stufe 2: ausführen ----------
FROM base AS runtime
ENV NODE_ENV=production

# Nur die Pakete für den Betrieb installieren, ohne Vitest, TypeScript und esbuild
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY services/order-service/package.json services/order-service/
RUN pnpm install --frozen-lockfile --prod --filter @markise/order-service...

# Aus Stufe 1 nur die fertige JavaScript-Datei übernehmen
COPY --from=build /app/services/order-service/dist services/order-service/dist

WORKDIR /app/services/order-service

# Nicht als root laufen: Wird der Service angegriffen, hat der Angreifer weniger Rechte
USER node

EXPOSE 4002
CMD ["node", "dist/server.js"]