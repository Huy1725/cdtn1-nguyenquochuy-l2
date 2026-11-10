# API documentation — Warranty intake (flow L2)

Track SE · Assignment 3 · tag `v1.0`

Base URL when started with Docker: `http://localhost:3000` (host port is `APP_PORT`). All bodies are JSON (`content-type: application/json`).
Every request/response example below was copied from a real run of the system started with `docker compose up -d --build`
on a fresh database (the sample data of `docs/deployment-guide.md`). Only the token string is shortened (`eyJ…`) and
some long lists are cut where marked.

| # | Method and path | Auth |
|---|---|---|
| 1 | `GET /health` | none |
| 2 | `POST /api/auth/login` | none |
| 3 | `GET /api/auth/me` | token |
| 4 | `GET /api/categories` | token |
| 5 | `GET /api/customers?phone=` | token |
| 6 | `POST /api/customers` | token |
| 7 | `PATCH /api/customers/{id}` | token |
| 8 | `DELETE /api/customers/{id}` | token |
| 9 | `GET /api/customers/{id}/devices` | token |
| 10 | `POST /api/tickets` | token |
| 11 | `GET /api/tickets` | token |
| 12 | `GET /api/tickets/{id}` | token |
| 13 | `PATCH /api/tickets/{id}/status` | token + ticket owner |

## Conventions

**Authentication.** Log in with endpoint 2, then send `Authorization: Bearer <token>` on every other `/api` request.
The token is an HS256 JWT valid for 8 hours (`expires_in: 28800`); its payload holds only the staff id, issue time and expiry.
There are no cookies. Without a valid token every endpoint except 1 and 2 answers `401 UNAUTHORIZED`.

**Error format.** Every error has the same shape. `fields` lists the invalid input fields (empty for other errors).
The body never contains a stack trace, table name or connection string.

```json
{ "error": { "code": "VALIDATION_FAILED", "message": "Du lieu khong hop le", "fields": { "phone": "So dien thoai phai gom dung 10 chu so" } } }
```

**Common error codes** (they can happen on any `/api` endpoint with a body or a token):

| HTTP | `error.code` | Meaning |
|---|---|---|
| 400 | `INVALID_JSON` | The body is not valid JSON |
| 401 | `UNAUTHORIZED` | No token, a malformed token, a wrong signature or an expired token |
| 404 | `NOT_FOUND` | The route does not exist (`GET /api/nope`) |
| 500 | `INTERNAL_ERROR` | Unexpected server error (for example the database is down); the message is always the generic `Loi may chu` |

**Time.** Ticket timestamps (`received_at`, `due_date`, `changed_at`) are ISO-8601 UTC. `customer.created_at` is returned as
`YYYY-MM-DD HH:mm:ss` in UTC (not ISO-8601) — a known inconsistency.

**Enumerations.** `priority`: `CAO` (due in 24 h), `TRUNG_BINH` (72 h), `THAP` (120 h); Sundays (UTC+7) are skipped when counting hours.
`status`: `MOI`, `DANG_XU_LY`, `HOAN_TAT`, `HUY`. `warranty_status`: `CON_BAO_HANH`, `HET_BAO_HANH`, `KHONG_XAC_DINH`.

---

## 1. `GET /health`

**Description.** Liveness check used by Docker and by operators: reports whether the app can reach its database.

**Authentication.** None (it sits outside `/api`).

**Parameters.** None.

**Success response** — `200`:

```json
{ "status": "ok", "db": "up" }
```

**Errors.**

| HTTP | Body | When |
|---|---|---|
| 503 | `{ "status": "degraded", "db": "down" }` | The database does not answer within 2 seconds |

**Notes.** The 503 body never contains the reason. `docker compose ps` shows the `app` service as `healthy` only while this endpoint answers 200.

---

## 2. `POST /api/auth/login`

**Description.** Exchanges a staff username and password for a token.

**Authentication.** None.

**Request body.**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `username` | string | yes | 1–50 characters |
| `password` | string | yes | 1–200 characters, kept exactly as typed (no trimming) |

```json
{ "username": "nv01", "password": "matkhau01" }
```

**Success response** — `200` (token shortened):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs…",
  "expires_in": 28800,
  "staff": { "staff_id": 1, "username": "nv01", "full_name": "Nguyen Van An" }
}
```

**Errors.**

| HTTP | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `username` or `password` missing or empty. Example body `{"username":"nv01"}` → `"fields":{"password":"Truong bat buoc, khong duoc de trong"}` |
| 401 | `INVALID_CREDENTIALS` | Wrong password **or** unknown username (same message, so usernames cannot be probed): `{"error":{"code":"INVALID_CREDENTIALS","message":"Sai ten dang nhap hoac mat khau","fields":{}}}` |

**Notes.** Passwords are stored only as scrypt hashes. The demo accounts are `nv01`/`matkhau01` and `nv02`/`matkhau02` (sample data).
There is no rate limit on this endpoint (a known limitation of the prototype).

---

## 3. `GET /api/auth/me`

**Description.** Returns the staff member the token belongs to.

**Authentication.** Token.

**Parameters.** None.

**Success response** — `200`:

```json
{ "staff_id": 1, "username": "nv01", "full_name": "Nguyen Van An" }
```

**Errors.** `401 UNAUTHORIZED` (see Conventions).

**Notes.** The web UI calls this on page load to decide whether to show the login page.

---

## 4. `GET /api/categories`

**Description.** Lists the six issue categories used to classify a ticket.

**Authentication.** Token.

**Parameters.** None.

**Success response** — `200`:

```json
[
  { "category_id": 1, "category_name": "Pin", "description": "Chai pin, phong pin, sac khong vao, loi cong sac" },
  { "category_id": 2, "category_name": "Man hinh", "description": "Vo, soc, mat cam ung, loi hien thi" },
  { "category_id": 3, "category_name": "Vao nuoc / Hu hong vat ly", "description": "Vao nuoc, roi vo, bien dang" }
]
```

(items 4–6 — `Phan mem`, `Nguon`, `Khac` — cut here; the real response has all six.)

**Errors.** `401 UNAUTHORIZED`.

**Notes.** The list is static sample data.

---

## 5. `GET /api/customers?phone={phone}`

**Description.** Looks up a customer by phone number (user story US1).

**Authentication.** Token.

**Parameters.**

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| `phone` | query | string | yes | exactly 10 digits |

**Success response** — `200` when found:

```json
{ "customer_id": 1, "full_name": "Nguyen AB", "phone": "0901234567", "email": "ab@example.com", "segment": "STANDARD", "created_at": "2026-11-10 08:29:24" }
```

When no customer has that number the answer is still `200` with the body `null` (the UI then opens the "new customer" form, US2).

**Errors.**

| HTTP | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `phone` is not 10 digits: `?phone=abc` → `"fields":{"phone":"So dien thoai phai gom dung 10 chu so"}`. Injection strings such as `' OR '1'='1` are rejected the same way |
| 401 | `UNAUTHORIZED` | See Conventions |

**Notes.** The query is parameterised; phone numbers are unique (rule QT-01).

---

## 6. `POST /api/customers`

**Description.** Creates a customer record (user story US2).

**Authentication.** Token.

**Request body.**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `phone` | string | yes | exactly 10 digits, unique |
| `full_name` | string | yes | 1–120 characters |
| `email` | string | no | up to 120 characters |
| `segment` | string | no | up to 20 characters |

```json
{ "phone": "0988776655", "full_name": "Le Thi Mai", "email": "mai@example.com" }
```

**Success response** — `201`:

```json
{ "customer_id": 102, "full_name": "Le Thi Mai", "phone": "0988776655", "email": "mai@example.com", "segment": null, "created_at": "2026-11-10 08:29:52" }
```

**Errors.**

| HTTP | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Body `{"phone":"123"}` → `"fields":{"phone":"So dien thoai phai gom dung 10 chu so","full_name":"Truong bat buoc, khong duoc de trong"}` |
| 409 | `CUSTOMER_EXISTS` | The phone number is already registered: `{"error":{"code":"CUSTOMER_EXISTS","message":"So dien thoai da ton tai","fields":{"phone":"So dien thoai da ton tai"}}}` |
| 401 | `UNAUTHORIZED` | See Conventions |

**Notes.** A duplicate phone never creates a second record and never changes the existing one (rule QT-01).

---

## 7. `PATCH /api/customers/{id}`

**Description.** Updates the given fields of a customer.

**Authentication.** Token.

**Parameters.** Path `id`: positive integer. Body: any of `phone`, `full_name`, `email`, `segment` with the constraints of endpoint 6; at least one field.

```json
{ "full_name": "Le Thi Mai Anh" }
```

**Success response** — `200`:

```json
{ "customer_id": 102, "full_name": "Le Thi Mai Anh", "phone": "0988776655", "email": "mai@example.com", "segment": null, "created_at": "2026-11-10 08:29:52" }
```

**Errors.**

| HTTP | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Bad id, empty body, or a field breaks its constraint |
| 404 | `CUSTOMER_NOT_FOUND` | No customer with that id |
| 409 | `CUSTOMER_EXISTS` | The new `phone` belongs to another customer |
| 401 | `UNAUTHORIZED` | See Conventions |

**Notes.** Unknown body fields are ignored; only the four columns above can ever be updated.

---

## 8. `DELETE /api/customers/{id}`

**Description.** Deletes a customer that has no devices and no tickets.

**Authentication.** Token.

**Parameters.** Path `id`: positive integer.

**Success response** — `200`:

```json
{ "customer_id": 102, "deleted": true }
```

**Errors.**

| HTTP | `error.code` | When |
|---|---|---|
| 404 | `CUSTOMER_NOT_FOUND` | Deleting the same id again: `{"error":{"code":"CUSTOMER_NOT_FOUND","message":"Khong tim thay khach hang","fields":{}}}` |
| 409 | `CUSTOMER_IN_USE` | The customer already has devices or tickets: `{"error":{"code":"CUSTOMER_IN_USE","message":"Khach hang da co thiet bi hoac phieu, khong the xoa","fields":{}}}` |
| 401 | `UNAUTHORIZED` | See Conventions |

**Notes.** Tickets are never deleted (rule QT-13): a ticket is cancelled by changing its status to `HUY` (endpoint 13).

---

## 9. `GET /api/customers/{id}/devices`

**Description.** Lists the devices a customer bought.

**Authentication.** Token.

**Parameters.** Path `id`: positive integer.

**Success response** — `200`:

```json
[ { "device_id": 1, "customer_id": 1, "serial_no": "A001", "purchase_date": "2026-01-15", "warranty_months": 12 } ]
```

**Errors.**

| HTTP | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `id` is not a positive integer: `GET /api/customers/abc/devices` → `"fields":{"customer_id":"Phai la so nguyen duong"}` |
| 404 | `CUSTOMER_NOT_FOUND` | No customer with that id |
| 401 | `UNAUTHORIZED` | See Conventions |

A customer who owns no device returns `200` with `[]`.

**Notes.** `serial_no` is unique across the system.

---

## 10. `POST /api/tickets`

**Description.** Receives a device for warranty service: creates a ticket in status `MOI`, suggests the issue category from the description,
computes the committed due date from the priority, and writes the first history entry (user stories US3–US7).

**Authentication.** Token. The logged-in staff member becomes the ticket's owner (`received_by`) and the author of the first history entry;
`changed_by` / `received_by` sent in the body are ignored.

**Request body.**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `customer_id` | integer | yes | an existing customer |
| `device_id` | integer | yes, unless `external_device` is true | a device of that customer |
| `issue_desc` | string | yes | 1–2000 characters |
| `priority` | string | yes | `CAO`, `TRUNG_BINH` or `THAP` |
| `category_id` | integer | no | an existing category; when omitted it is suggested from `issue_desc` |
| `external_device` | boolean | no | `true` for a device not bought in the store (US3-AC2) |
| `serial_no` | string | yes if `external_device` | up to 50 characters, must not exist yet |
| `source_note` | string | yes if `external_device` | up to 500 characters, where the device came from |

```json
{ "customer_id": 1, "device_id": 1, "issue_desc": "May bi vao nuoc, khong len nguon", "priority": "CAO" }
```

**Success response** — `201`:

```json
{
  "ticket_id": 1, "ticket_code": "BH-000001/2026", "customer_id": 1, "device_id": 1, "category_id": 3,
  "issue_desc": "May bi vao nuoc, khong len nguon", "priority": "CAO", "status": "MOI",
  "received_at": "2026-11-10T08:29:52.000Z", "due_date": "2026-11-11T08:29:52.000Z",
  "received_by": 1, "received_by_name": "Nguyen Van An",
  "serial_no": "A001", "warranty_status": "CON_BAO_HANH",
  "status_log": [
    { "log_id": 1, "ticket_id": 1, "from_status": null, "to_status": "MOI", "note": null,
      "changed_at": "2026-11-10T08:29:52.000Z", "changed_by": 1, "changed_by_name": "Nguyen Van An" }
  ]
}
```

External-device example (`"external_device": true, "serial_no": "EXT-IMEI-0001", "source_note": "Mua tai cua hang khac", "priority": "THAP"`) →
`201` with `"warranty_status": "KHONG_XAC_DINH"`, `"due_date": "2026-11-16T08:30:14.000Z"` (120 hours, Sunday skipped) and
the first history note `"Thiet bi ngoai - nguon goc: Mua tai cua hang khac"`.

**Errors.**

| HTTP | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Missing/invalid field, e.g. body `{"customer_id":1,"priority":"CAO"}` → `"fields":{"issue_desc":"Truong bat buoc, khong duoc de trong","device_id":"Truong bat buoc, khong duoc de trong"}`; external device without `serial_no` → `"fields":{"serial_no":"Truong bat buoc, khong duoc de trong"}` |
| 400 | `INVALID_JSON` | Body is not JSON |
| 409 | `DEVICE_EXISTS` | `external_device` with a `serial_no` that is already registered |
| 422 | `INVALID_REFERENCE` | Unknown customer or category, or the device does not belong to the customer: `device_id: 999999` → `"fields":{"device_id":"Thiet bi khong thuoc khach hang nay"}` |
| 401 | `UNAUTHORIZED` | See Conventions |

**Notes.** `ticket_code` is generated by the server (`BH-<6-digit id>/<year>`), never sent by the client. `warranty_status` is computed from the
device's purchase date and warranty months by calendar day in Vietnam time (UTC+7): the last day is still covered (rule US5).

---

## 11. `GET /api/tickets`

**Description.** Lists tickets, newest first, optionally filtered by status.

**Authentication.** Token. Every staff member sees all tickets.

**Parameters.**

| Name | In | Type | Required | Constraints |
|---|---|---|---|---|
| `status` | query | string | no | `MOI`, `DANG_XU_LY`, `HOAN_TAT`, `HUY` |
| `page` | query | integer | no | ≥ 1, default 1 |
| `size` | query | integer | no | ≥ 1, default 20, capped at 100 |

Example: `GET /api/tickets?status=MOI&page=1&size=5`

**Success response** — `200`:

```json
{
  "items": [
    { "ticket_id": 1, "ticket_code": "BH-000001/2026", "customer_id": 1, "device_id": 1, "category_id": 3,
      "issue_desc": "May bi vao nuoc, khong len nguon", "priority": "CAO", "status": "MOI",
      "received_at": "2026-11-10T08:29:52.000Z", "due_date": "2026-11-11T08:29:52.000Z", "received_by": 1 }
  ],
  "total": 1, "page": 1, "size": 5
}
```

**Errors.** `400 VALIDATION_FAILED` (invalid `status`, `page` or `size`), `401 UNAUTHORIZED`.

**Notes.** List items are the plain ticket rows: they do not include `serial_no`, `warranty_status`, `received_by_name` or `status_log` (use endpoint 12).
`total` counts all tickets matching the filter, not only the current page.

---

## 12. `GET /api/tickets/{id}`

**Description.** Returns one ticket with its warranty status and full status history (user story US7).

**Authentication.** Token.

**Parameters.** Path `id`: positive integer.

**Success response** — `200`: the same body as the `201` response of endpoint 10, with one history entry per status change.

**Errors.**

| HTTP | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `id` is not a positive integer |
| 404 | `TICKET_NOT_FOUND` | `GET /api/tickets/999999` → `{"error":{"code":"TICKET_NOT_FOUND","message":"Khong tim thay phieu","fields":{}}}` |
| 401 | `UNAUTHORIZED` | See Conventions |

**Notes.** History entries are append-only; there is no endpoint to edit or delete one (rule QT-13).

---

## 13. `PATCH /api/tickets/{id}/status`

**Description.** Changes a ticket's status (including cancelling it with `HUY`) and appends one history entry with the optional note.

**Authentication.** Token, and the caller must be the staff member who received the ticket (`received_by`).

**Request body.**

| Field | Type | Required | Constraints |
|---|---|---|---|
| `status` | string | yes | `MOI`, `DANG_XU_LY`, `HOAN_TAT` or `HUY` |
| `note` | string | no | up to 1000 characters |

```json
{ "status": "DANG_XU_LY", "note": "Da goi bao khach" }
```

**Success response** — `200`: the full ticket (as endpoint 12) with `"status": "DANG_XU_LY"` and a second history entry
`{ "log_id": 2, "from_status": "MOI", "to_status": "DANG_XU_LY", "note": "Da goi bao khach", "changed_by": 1, "changed_by_name": "Nguyen Van An", … }`.

**Errors.**

| HTTP | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | `{"status":"XONG"}` → `"fields":{"status":"Trang thai khong hop le"}` |
| 401 | `UNAUTHORIZED` | See Conventions |
| 403 | `FORBIDDEN` | Another staff member (here `nv02`) tries to change the ticket: `{"error":{"code":"FORBIDDEN","message":"Chi nhan vien tiep nhan phieu nay moi duoc doi trang thai","fields":{}}}` — the ticket is not changed |
| 404 | `TICKET_NOT_FOUND` | No ticket with that id |

**Notes.** Setting the status the ticket already has returns it unchanged and writes no history entry. The order of transitions
(for example `HOAN_TAT` back to `MOI`) is not restricted — the specification does not define a state machine.
The `changed_by` of the new entry always comes from the token, never from the body.
