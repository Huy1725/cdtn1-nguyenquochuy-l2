# OPTIONAL demo image for a FREE Render web service (Deployment Guide, section 8).
# It is NOT used by docker compose: the normal package (Dockerfile + docker-compose.yml) is unchanged.
#
# One container runs two processes: MySQL 8.0 (schema + sample data already loaded) and the Node app (API + web UI).
# Why: Render's free tier has no managed MySQL and no persistent disk, so the database lives inside the container
# and RESETS to the sample data whenever Render restarts or spins the service down. Build context = repository root.
#
# No secret is baked into this image: DB_PASSWORD and JWT_SECRET are read from the platform's environment variables
# when the container starts (see entrypoint.sh and render.yaml).

# ---- Stage 1: build the web UI and keep production dependencies only ----
FROM node:24-bookworm-slim AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ---- Stage 2: MySQL 8.0 base image + the Node runtime ----
FROM mysql:8.0
COPY --from=build /usr/local/bin/node /usr/local/bin/node

WORKDIR /app
COPY --from=build /build/node_modules ./node_modules
COPY --from=build /build/dist ./dist
COPY package.json ./
COPY src ./src
COPY migrations ./migrations
COPY seeds ./seeds
# Demo-only sample tickets (14 tickets with history); loaded by bake-db.sh, never by docker compose.
COPY deploy/render/demo-tickets.sql ./demo-tickets.sql

COPY deploy/render/mysql.cnf /etc/mysql/conf.d/render.cnf
COPY deploy/render/bake-db.sh deploy/render/entrypoint.sh /usr/local/bin/

# Create the data directory and load migrations/ + seeds/ NOW, on the build machine, so a cold start on the free
# instance (0.1 CPU) only has to start MySQL instead of initialising it.
RUN chmod +x /usr/local/bin/bake-db.sh /usr/local/bin/entrypoint.sh && /usr/local/bin/bake-db.sh

USER mysql
# 10000 is Render's default PORT; Render passes its own value at run time, so this default only matters for "docker run".
ENV PORT=10000 NODE_OPTIONS=--max-old-space-size=128
EXPOSE 10000

# Render passes its own PORT (10000 by default); this check only matters for a local "docker run".
HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=6 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||10000)+'/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
