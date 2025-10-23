# Outside‑In Website Monitoring — **Free Demo** Offering

This README is a working spec you can hand to Cursor/agents to scaffold infra, scripts, and docs for a no‑access (black‑box) website monitoring service. It's platform‑agnostic (WordPress, Shopify, Webflow, custom, etc.).

---

## 0) TL;DR (What we deliver)

**For ~10 sites, at near‑zero cost**

* Uptime + latency for **2 critical URLs** per site (home + checkout/login) from **2 regions**
* **1 synthetic "mystery shopper" flow** per site (e.g., add‑to‑cart → reach checkout) with screenshots on failure
* **Daily Lighthouse** audits for **3 pages** per site (home / product or landing page / blog or article)
* **Status page** (public or private) showing green/red + incident notes
* **Smart alerts** (burn‑rate style) to avoid noise
* **Weekly email summary**: uptime %, slowdowns, top 1–2 fixes

> **No server access required.** All checks are outside‑in.

---

## 1) Target customers & packs

* **E‑commerce Pack** (Shopify/WooCommerce/BigCommerce/Magento)

  * Checks: home, category, product, add‑to‑cart → checkout (stop before payment)
* **Agency Pack** (marketing/content sites at scale)

  * Checks: home, landing page(s), blog/article, contact form submit to test inbox
* **SaaS Pack** (B2B apps)

  * Checks: home, pricing, login reachability, dashboard render (staging/demo tenant if needed)

Each pack uses the same core stack; only URLs/flows differ.

---

## 2) Scope of the **Free Demo** (per site)

* **2 uptime/latency probes** (home + checkout or login), every **10 minutes**, from **EU** and **US**
* **1 browser synthetic flow** (hourly): add‑to‑cart → checkout page load (no payment), 8s target; capture screenshots on failure
* **Daily Lighthouse audits** on 3 pages (store results; compare to prior run)
* **Status page** with components per URL/flow
* **Alerts** only when sustained impact threatens SLOs (see §6)
* **Weekly summary** email (plain English)

Upgrade paths: more URLs, higher frequency, more regions, additional flows (forms, search), and optional "Pro" with read‑only server metrics.

---

## 3) SLOs, indicators & thresholds (plain language)

* **Availability SLO:** 99.9%/30 days. Home + checkout/login return 2xx/3xx within **≤ 2.5s**.
* **Checkout Flow SLO:** 99.5%/30 days. Synthetic flow completes (to checkout page) **≤ 8s**.
* **Performance guardrails:** Web Vitals targets per Lighthouse

  * LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 (desktop/mobile tracked)

> **Error budget:** allowed failure (e.g., 99.9% → ~43 min/month). **Burn rate** = how fast the budget is being spent.

---

## 4) Architecture (Option A: mostly SaaS / Free‑tier)

```
[Grafana Cloud Synthetics]  -->  Dashboards + Alerts (EU/US probes)
        |                              |
        | (failures, timings)          v
   [Screenshots (Grafana / S3 optional)]   
        
[Lighthouse CI via GitHub Actions] --> JSON artifacts (repo or S3)
        
[Status Page (Upptime or Grafana plugin)]
        
[Email/Slack] weekly summaries + alerts
```

**Why this first:** fastest to ship, minimal infra, fits 10 sites within free limits when you tune frequencies (see §8).

---

## 5) Architecture (Option B: self‑hosted probes on AWS)

```
[EC2 or Fargate in EU + US]
  - blackbox-exporter (HTTP)
  - k6 (browser synthetics)
          |  push
          v
    [Prometheus or Grafana Cloud Metrics]
          |
      [Alertmanager] --> Slack/Email/SMS
          |
   [S3] screenshots + Lighthouse JSON
          |
    [Status page]
```

**Why/when:** need more control, higher frequencies, private code, or additional regions.

---

## 6) Alerting (burn‑rate pattern)

Use multi‑window thresholds so alerts fire only for meaningful, sustained issues.

* **Page now (urgent):** burn rate > **14.4** over **1h** **and** **6h**
* **Severe (ticket):** burn rate > **6** over **6h** **and** **24h**
* **Warning (summary):** burn rate > **3** over **24h** **and** **3d**

**PromQL sketch (conceptual):**

```promql
# Example for availability; budget for 99.9% = 0.001
# bad_ratio_W = fraction of failed probes over window W
burn_1h  = bad_ratio_1h  / 0.001
burn_6h  = bad_ratio_6h  / 0.001
burn_24h = bad_ratio_24h / 0.001
```

Use analogous ratios for the synthetic flow success metric.

---

## 7) Implementation plan (1 week)

**Day 1–2**

* Create one reusable **Grafana folder** + dashboards (variables: `client`, `region`, `flow`)
* Define **probe templates**: 2 URLs per site, 10‑min interval, EU/US
* Prepare **k6 browser** base script with tokenized selectors
* Stand up **status page** skeleton (Upptime or Grafana plugin)

**Day 3**

* Add **Lighthouse CI** workflow (daily) for 3 pages/site
* Wire artifact storage (repo/S3) and trend panel in Grafana

**Day 4**

* Add **Alertmanager routes** per client; burn‑rate rules
* Draft weekly **Markdown summary** template

**Day 5**

* Simulate an incident: verify screenshot capture, alert routes, status update, and weekly summary output
* Polish onboarding script/CLI (see §10)

---

## 8) Frequency & free‑tier budgeting (for ~10 sites)

* **API probes:** 2 URLs/site × 10 sites × every 10 min ≈ **86,400** executions/month total
* **Browser flows:** 1 flow/site × 10 sites × every 60 min ≈ **7,200** executions/month total
* **Lighthouse:** 3 pages/site × 10 sites × daily = **900** runs/month

> These example frequencies are designed to fit within common free‑tier limits for a 10‑site demo. If you increase frequency or sites, plan for paid tiers or self‑hosted probes.

---

## 9) Costs (ballpark; verify current pricing separately)

* **Option A (mostly SaaS):** typically ≈ **€0/month** for 10‑site demo when kept within free tiers; minimal artifact storage in repo
* **Option B (AWS self‑hosted):** 2 tiny instances (EU/US) + small S3 bucket often ≈ **low two‑digits €/month**
* **Add‑ons:** extra regions, higher frequency, SMS vendors, etc. increase cost

> Keep screenshots small, purge weekly. Prefer hourly synthetics for demos; tighten for paid tiers.

---

## 10) Onboarding CLI (example)

```bash
./add-site \
  --client "Acme" \
  --domain "shop.example.com" \
  --probes "/,/checkout" \
  --flow "checkout" \
  --lh-pages "/,/products/demo,/blog" \
  --regions "eu-central,us-east"
```

**What it should do:**

1. Create Grafana folder/dashboards/alerts for the client
2. Register 2 probes (EU/US), 10‑min interval
3. Generate a tokenized **k6** script for the checkout flow
4. Append the 3 pages to the **Lighthouse CI** job
5. Add components to the **status page**

---

## 11) AI & MCP agent graph (practical glue)

* **Grafana MCP:** create/update folders, dashboards, alerts from JSON templates
* **k6 MCP:** update selectors when the theme changes; re‑run flow to validate
* **Status Page MCP:** add incident notes; toggle components
* **Prometheus/Grafana Query MCP:** pull SLOs for weekly report
* **Slack/Email MCP:** post weekly summaries; DM approvals for scripted changes
* **Docs MCP (Notion/Confluence):** publish post‑incident write‑up & monthly report

**Example agent prompts**

* *"Create client 'Acme', EU/US probes for / and /checkout, hourly checkout flow, Lighthouse pages /, /products/demo, /blog."*
* *"Selectors changed: update k6 cart button to `#add-to-cart` and re‑test in EU/US; attach screenshots."*

---

## 12) Templates & snippets

### 12.1 k6 browser (tokenized)

```javascript
import { chromium } from 'k6/experimental/browser';
import { check } from 'k6';

export default async function () {
  const browser = chromium.launch();
  const page = browser.newPage();

  await page.goto('https://{{DOMAIN}}/');
  await page.click('{{PRODUCT_LINK_SELECTOR}}');
  await page.click('{{ADD_TO_CART_SELECTOR}}');
  await page.goto('https://{{DOMAIN}}/cart');
  await page.click('{{PROCEED_TO_CHECKOUT_SELECTOR}}');

  const ok = await page.waitForSelector('{{CHECKOUT_FIELD_SELECTOR}}', { timeout: 8000 });
  check(ok, { 'checkout reachable under 8s': (el) => !!el });

  await browser.close();
}
```

### 12.2 Lighthouse CI (GitHub Actions) — daily

```yaml
name: lighthouse-daily
on:
  schedule: [ { cron: '30 3 * * *' } ]  # daily 03:30 UTC
  workflow_dispatch: {}

jobs:
  lhci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install Node
        uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Install Lighthouse CI
        run: npm i -g @lhci/cli
      - name: Run Lighthouse
        run: |
          lhci autorun \
            --collect.url=https://{{DOMAIN}}{{LH_PAGE_1}} \
            --collect.url=https://{{DOMAIN}}{{LH_PAGE_2}} \
            --collect.url=https://{{DOMAIN}}{{LH_PAGE_3}} \
            --upload.target=filesystem \
            --upload.outputDir=./lhci-artifacts/{{CLIENT}}/$(date +%F)
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: lhci-{{CLIENT}}
          path: lhci-artifacts/
```

### 12.3 Weekly summary (Markdown template)

```markdown
# Weekly Web Health — {{Client}} ({{Week Range}})

**Uptime:** {{uptime_percent}} (targets: 99.9% availability, 99.5% checkout)
**Incidents:** {{incident_count}} — {{brief_list}}

## Highlights
- Fastest page (p95): {{fastest}}
- Slowest page (p95): {{slowest}}
- Checkout flow: {{flow_success_rate}} success, p95 {{flow_p95}} s

## Top 2 Fixes
1. {{fix_one}}
2. {{fix_two}}

_Attachments: 2 charts + failing screenshot (if any)_
```

### 12.4 Status page components (example)

* **Homepage (EU)**, **Homepage (US)**
* **Checkout (EU)**, **Checkout (US)**
* **Synthetic: Checkout Flow**

---

## 13) Onboarding intake (ask the client)

* Domain + **key pages** (home, checkout/login, product/landing, blog/article)
* **Regions** where customers are (EU/US/APAC)
* Preferred **alert channel** (email/Slack/SMS) and **business hours**
* If e‑commerce: test product URL or selector for add‑to‑cart
* Status page: **public or private**?

---

## 14) Sales copy (short email)

**Subject:** Catch checkout issues in minutes — outside‑in monitoring (free demo)

Hi {{Name}},
We run a tiny "mystery shopper" every hour that adds to cart and reaches checkout, plus uptime checks from EU/US and a daily speed audit of your key pages. If something breaks, you get a clear alert with a screenshot — not noise. There's a simple status page and a weekly one‑pager with the top fixes.
No server access required. Want me to switch it on for your site this week?

Best,
{{You}}

---

## 15) Roadmap / Upsells

* Extra regions (APAC), more flows (forms, search), higher frequencies
* "Pro" plan: read‑only server metrics (PHP/DB/cache), Cron Bodyguard, WooCommerce health
* Incident concierge (agent drafts status updates & post‑incident notes)

---

## 16) ToS & ethics

* Monitor only for **site owners** or with explicit permission
* Respect robots and platform terms; keep synthetic rates modest
* Avoid payment submission on production; stop at checkout page

---

## 17) Cursor tasks (ready prompts)

1. **Terraform module:** "Create a `site` module that provisions Grafana folder, two HTTP checks (EU/US, 10‑min), one browser flow (hourly), Alertmanager routes, and status page components."
2. **CLI:** "Implement `add-site` that calls the Terraform module and updates the Lighthouse GH Action matrix."
3. **k6 script generator:** "Build a small script that fills tokenized selectors and outputs a site‑specific `checkout.spec.js`."
4. **Weekly report bot:** "Query Grafana/Prometheus for the past 7 days and render `weekly.md` using the template in §12.3; email it."

---

**End of README**
