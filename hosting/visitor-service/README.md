# Academic homepage visitor statistics API

This service contains only anonymous browser counters and country/region totals for Xiaowei Zhang's public GitHub Pages homepage. It contains no homepage copy, papers, email, accounts, or administrative endpoints.

- `GET /api/visitors` returns `{ total, since, countries: [{ country, visitors }] }`.
- `POST /api/visitors` accepts only `{ visitorId: <random UUID v4> }` from explicitly configured homepage origins.
- An identifier is kept in the homepage's own localStorage for at most one year. Cross-site cookies and account credentials are not sent.
- Country/region comes from Cloudflare edge metadata. IP addresses, exact coordinates, browser fingerprints, and account information are not stored.
- Local previews read totals without counting themselves. Do Not Track / Global Privacy Control and recognized crawlers are excluded.
- Public access, if approved by the owner, exposes anonymous aggregate totals only. The main Sites homepage's access is separate.

Country labels are formatted by the homepage: Mainland China; Taiwan, China; Hong Kong, China; Macau, China.

From the homepage repository root, run `node --experimental-strip-types --test tests/visitor-api.test.mjs` for CORS, deduplication, opt-out, local preview, input validation and failure handling checks.
