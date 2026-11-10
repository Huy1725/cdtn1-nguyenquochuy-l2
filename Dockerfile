# API + web UI for the warranty intake flow (L2). One image: Node serves the API and the built React UI.
# Node 24 satisfies "engines" in package.json (>= 22.9, needs --env-file-if-exists).
FROM node:24-alpine

WORKDIR /app

# 1. Lock files first: dependencies are reinstalled only when package-lock.json changes (layer cache).
#    devDependencies stay installed: vite builds the UI here, and the tests run inside the container.
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build the React UI into /app/dist (served by src/server.js).
COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build

# 3. Tests, SQL and helper scripts: `docker compose exec app npm test` needs all of them
#    (the integration tests rebuild a scratch database from migrations/ and seeds/).
COPY tests ./tests
COPY scripts ./scripts
COPY migrations ./migrations
COPY seeds ./seeds

# 4. Do not run as root.
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
