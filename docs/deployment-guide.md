# Deployment Guide — Warranty intake (flow L2, track SE), tag v1.0

This guide starts a complete system (web UI + API + MySQL database with sample data) from an empty folder using
only Docker and Git. The two commands that build and start everything are steps 3 and 4 of section 2.

## 1. Requirements

- Operating system: Windows 10/11, macOS or Linux. Tested on Windows 11 with Docker Desktop (WSL 2 backend).
- Docker Engine 24 or newer with Docker Compose v2 — check with `docker compose version` (tested with Docker 29.9.2, Compose v5.6.1).
- Git 2.30 or newer.
- Internet access for the first build (pulls `mysql:8.0` and `node:24-alpine`, about 1.5 GB) and about 2 GB of free disk space.
- Port **3000** free on your machine (if it is taken, set `APP_PORT` — see section 6).
- Node.js and MySQL do **not** need to be installed.

## 2. Setup steps

1. `git clone --branch v1.0 https://github.com/Huy1725/cdtn1-nguyenquochuy-l2.git`
2. `cd cdtn1-nguyenquochuy-l2`
3. `cp .env.example .env` (Windows cmd: `copy .env.example .env`)
4. `docker compose up -d --build` (the first build takes a few minutes; later starts take seconds)

Nothing else is needed: the tables and the sample data are loaded automatically the first time the database starts.

## 3. Environment variables

Defined in `.env` (created from `.env.example`). The sample values work as they are; change them for any real deployment.

| Name | Meaning | Sample value | Required |
|---|---|---|---|
| `DB_PASSWORD` | Password of the MySQL `root` account (Docker) or of your own MySQL account (`npm start` without Docker) | `change-me-db-password` | yes |
| `JWT_SECRET` | Key that signs login tokens; at least 32 characters — the app refuses to start otherwise | `change-me-to-a-random-string-of-at-least-32-characters` | yes |
| `DB_NAME` | Database name | `warranty_l2` | yes |
| `APP_PORT` | Port of the app on your machine (Docker only) | `3000` | no (default 3000) |
| `DB_HOST` | Database host. Docker sets it to `db` by itself | `localhost` | only without Docker |
| `DB_PORT` | Database port (Docker uses 3306) | `3306` | no |
| `DB_USER` | Database account. Docker uses `root` by itself | `root` | only without Docker |
| `PORT` | Port the app listens on inside the process (Docker uses 3000) | `3000` | no |
| `CORS_ORIGIN` | Browser origin allowed by CORS; only needed when the UI runs on another origin (`npm run dev`) | `http://localhost:5173` | no |
| `VITE_API_BASE_URL` | API address for the Vite dev server; empty means same origin | `http://localhost:3000` | no |

If a required variable is missing or `JWT_SECRET` is too short, the app stops at start-up and prints only the **name** of the problem
(for example `Thieu bien moi truong: JWT_SECRET - xem .env.example`), never a value.

## 4. Sample data

Loaded automatically, in this order, from `migrations/` and `seeds/`, **only when the database volume is empty** (first start, or after `docker compose down -v`):

| Table | Rows after loading |
|---|---:|
| `customer` | 101 (customer `0901234567` "Nguyen AB" plus 100 generated customers) |
| `device` | 139 (each customer has 1–2 devices; `A001` belongs to "Nguyen AB", bought 2026-01-15, 12 months warranty) |
| `issue_category` | 6 |
| `staff` | 2 |
| `ticket`, `ticket_status_log` | 0 (create tickets in the UI) |

Demo logins (sample data, stored only as scrypt hashes):

| Username | Password | Name |
|---|---|---|
| `nv01` | `matkhau01` | Nguyen Van An |
| `nv02` | `matkhau02` | Tran Thi Binh |

To compare the counts (works in cmd, PowerShell and bash; use your own `DB_PASSWORD` if you changed it, and ignore the harmless "password on the command line" warning):
`docker compose exec db mysql -uroot -pchange-me-db-password warranty_l2 -e "SELECT COUNT(*) FROM customer"` → `101`.

## 5. Verify it works

Run these in order. Each line shows the expected result.

| # | Command or action | Expected result |
|---|---|---|
| 1 | `docker compose ps` | Both services `db` and `app` show **`(healthy)`** in the STATUS column. Right after step 4 the app may still show `health: starting` — wait about 5 seconds and run it again |
| 2 | `curl http://localhost:3000/health` | `{"status":"ok","db":"up"}` (connection refused in the first second after step 4 is normal; retry) |
| 3 | `curl -i http://localhost:3000/api/tickets` | `HTTP/1.1 401` and `{"error":{"code":"UNAUTHORIZED",…}}` (the API is protected) |
| 4 | Open `http://localhost:3000` in a browser, log in as `nv01` / `matkhau01` | The intake screen appears; searching phone `0901234567` shows "Nguyen AB" and device `A001` |
| 5 | `docker compose exec app npm test` | Ends with `ℹ tests 34`, `ℹ pass 34`, `ℹ fail 0` (12 test cases + 22 regression tests, about 5 seconds) |

In **Windows PowerShell** type `curl.exe` instead of `curl` (there `curl` is an alias of `Invoke-WebRequest`, which does not accept `-i`). cmd, Git Bash, macOS and Linux accept plain `curl`.

To run one test case only: `docker compose exec app npm run tc -- TC-07` → `✔ TC-07 …`, `ℹ pass 1`.
The tests create and drop their own scratch database `warranty_l2_test`; they never touch the data in `warranty_l2`.
The lines `.env not found. Continuing without it.` in the output are normal inside the container: the settings come from Compose, not from a file.

## 6. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Bind for 0.0.0.0:3000 failed: port is already allocated` | Another program uses port 3000 | Put `APP_PORT=3001` in `.env`, run `docker compose up -d` again, use `http://localhost:3001` |
| App exits at start-up with `Thieu bien moi truong: …` | `.env` is missing a required variable | Compare `.env` with `.env.example`; read the log with `docker compose logs app --tail 50` |
| After changing `DB_PASSWORD` the app cannot log in to MySQL, or tables are empty/missing | The database volume already exists, so MySQL ignores the new password and the init scripts do not run again | `docker compose down -v` then `docker compose up -d --build` (this deletes the database data) |
| `app` shows `health: starting` right after `docker compose up` | The command returns as soon as the containers have started, not when the app is ready | Wait about 5 seconds, then run `docker compose ps` again |
| `app` stays `unhealthy` | The database is unreachable | `docker compose ps`, then `docker compose logs db --tail 50`; `curl http://localhost:3000/health` returns 503 until the database is back |
| `env file .env not found` | Step 3 was skipped | Run step 3 |

To stop everything and delete the data: `docker compose down -v`.

## 7. Notes for a real deployment

- **HTTPS.** The prototype speaks plain HTTP on localhost. In a real deployment put it behind a reverse proxy that terminates TLS
  (nginx, Caddy or a cloud load balancer) and expose only the proxy. The app uses no cookies and keeps tokens in the `Authorization`
  header, never in the URL.
- **Secrets.** Replace every sample value in `.env`; generate `JWT_SECRET` with
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Delete or change the two demo accounts.
- **Database access.** No database port is published to the host; only the `app` service can reach it. In this setup the app connects as
  MySQL `root` because the integration tests must create a scratch database; a real deployment should create a limited account
  for the app and run the tests elsewhere.
- **Monitoring.** `GET /health` is the health endpoint. Server errors (HTTP 500) are logged as one JSON line with the method,
  path (without query string) and error code — never request data: `docker compose logs app`.

## 8. Optional: demo deployment on Render (free plan)

A public demo of this repository runs on Render's free plan: **https://warranty-l2-nguyenquochuy.onrender.com** — log in as `nv01` / `matkhau01`.
It is a demo, not a production setup, and it does not change sections 1–7: the normal package is still `Dockerfile` + `docker-compose.yml`.

Why a separate image: Render's free plan has no managed MySQL and no persistent disk. [`deploy/render/Dockerfile`](../deploy/render/Dockerfile) therefore
builds **one** image that runs MySQL 8.0 (schema and sample data already loaded at build time) and the Node app together. You will notice two consequences:

- The data **resets to the sample data** whenever Render restarts or redeploys the service; tickets created in the demo are not kept.
- A free service sleeps after 15 minutes without traffic; the first request afterwards takes about a minute while Render wakes it up.

**Steps done to deploy**

1. Open https://dashboard.render.com and sign in with the GitHub account that owns the repository.
2. Click **New +** → **Blueprint**, press **Connect** next to `cdtn1-nguyenquochuy-l2`, type any Blueprint name (for example `warranty-l2-blueprint`), keep branch `main` and leave **Blueprint Path** empty (the default is `render.yaml`).
3. Check the preview — one web service `warranty-l2-nguyenquochuy`, Docker runtime, **Free** plan, region Singapore — and click **Deploy Blueprint**.
   Nothing has to be typed: Render creates the two secrets itself (`generateValue` in [`render.yaml`](../render.yaml)).
4. Wait until the service shows **Live** (the first build took 1 minute 15 seconds). Render builds `deploy/render/Dockerfile` and switches to the new version only after `GET /health` answers 200.
5. Verify as in section 5: `curl https://warranty-l2-nguyenquochuy.onrender.com/health` → `{"status":"ok","db":"up"}`;
   `curl -i https://warranty-l2-nguyenquochuy.onrender.com/api/tickets` → `401`; open the URL in a browser and log in as `nv01`.
   If a deploy fails, read the service's **Logs** tab: the entrypoint names the variable that is missing or invalid.
   Screenshots: `docs/screenshots/render-1-curl.png` … `render-4-ticket.png` (checks and web UI on the public address) and `render-5-service.png`, `render-6-env.png` (Render dashboard; the secret values are hidden).

**Environment variables on Render** (service → **Environment**; they come from [`render.yaml`](../render.yaml)):

| Name | Value on Render | Secret |
|---|---|---|
| `DB_PASSWORD` | random value generated by Render; password of the MySQL account `app` | yes |
| `JWT_SECRET` | random value generated by Render (44 characters; the app needs at least 32) | yes |
| `DB_USER` | `app` | no |
| `DB_NAME` | `warranty_l2` | no |
| `PORT` | set by Render (10000); the app listens on it | no |

The image itself fixes `DB_HOST=127.0.0.1` and `DB_PORT=3306`, because MySQL runs inside the same container.
No secret is stored in the repository or in the image; both secrets are read from these variables when the container starts.

**Security notes.** MySQL listens on 127.0.0.1 only and its `root` password is random at every start (nobody knows it). The app connects as `app`, which can only
SELECT, INSERT, UPDATE and DELETE in `warranty_l2` — the limited account recommended in section 7. Render terminates HTTPS at its load balancer and forwards plain HTTP
to the container, which is the reverse proxy with a TLS certificate described in section 7. The two demo accounts are public sample data and the demo holds no real data.
