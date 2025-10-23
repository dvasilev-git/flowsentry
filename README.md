# FlowSentry — Outside-In Website Monitoring

**Free demo monitoring service for e-commerce, agencies, and SaaS sites**

Monitor website uptime, performance, and user flows without server access. Perfect for agencies managing multiple client sites or e-commerce businesses wanting to catch checkout issues before customers do.

---

## 🚀 Quick Start

**Want to build this right now?** Start with our **POC implementation guide**:

👉 **[POC-README.md](./POC-README.md)** — 30-minute setup using GitHub Actions + Grafana Cloud + Upptime

* Zero infrastructure costs
* Runs on free tiers
* Complete step-by-step guide
* Ready-to-use scripts and configurations

---

## 📋 What We Deliver

**For ~10 sites, at near-zero cost:**

- ✅ **Uptime + latency** for 2 critical URLs per site (home + checkout/login) from 2 regions
- ✅ **Synthetic "mystery shopper" flows** (e.g., add-to-cart → checkout) with screenshots on failure  
- ✅ **Daily Lighthouse audits** for 3 pages per site (performance scores)
- ✅ **Status page** (public or private) showing green/red + incident notes
- ✅ **Smart alerts** (burn-rate style) to avoid noise
- ✅ **Weekly email summaries** with uptime %, slowdowns, and top fixes

> **No server access required.** All checks are outside-in.

---

## 🎯 Target Customers

### E-commerce Pack
- **Shopify/WooCommerce/BigCommerce/Magento**
- Checks: home, category, product, add-to-cart → checkout (stop before payment)

### Agency Pack  
- **Marketing/content sites at scale**
- Checks: home, landing page(s), blog/article, contact form submit

### SaaS Pack
- **B2B applications**
- Checks: home, pricing, login reachability, dashboard render

---

## 🏗️ Architecture Options

### Option A: SaaS/Free-Tier (Recommended for POC)
```
GitHub Actions → Grafana Cloud → Upptime Status Page
```
- **Cost**: $0/month for 10 sites
- **Setup time**: 30 minutes
- **Best for**: Quick demos, agencies, small businesses

### Option B: Self-Hosted AWS
```
EC2/Fargate → Prometheus → Alertmanager → Status Page
```
- **Cost**: ~$20-50/month
- **Setup time**: 2-3 hours  
- **Best for**: Enterprise, high-frequency monitoring, custom requirements

---

## 📊 SLOs & Thresholds

- **Availability SLO**: 99.9%/30 days (≤2.5s response time)
- **Checkout Flow SLO**: 99.5%/30 days (≤8s completion)
- **Performance**: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1

**Smart Alerting**: Burn-rate based thresholds prevent alert fatigue:
- **Critical**: Burn rate >14.4 over 1h AND 6h
- **Warning**: Burn rate >3 over 24h AND 3d

---

## 🛠️ Implementation

### For POC (Recommended)
1. **Start here**: [POC-README.md](./POC-README.md)
2. **Time**: 30 minutes setup
3. **Cost**: $0/month
4. **Result**: Working monitoring for 1-2 sites

### For Production
1. **Full spec**: [README-FULL-SPEC.md](./README-FULL-SPEC.md)  
2. **Time**: 1 week implementation
3. **Cost**: $0-50/month depending on scale
4. **Result**: Production-ready monitoring service

---

## 📈 Scaling Path

```
POC (1-2 sites) → Demo (10 sites) → Production (100+ sites)
     ↓                ↓                    ↓
  GitHub Actions   Grafana Cloud      Self-hosted/AWS
  Free tiers       Free tier          Paid infrastructure
  30 min setup     1 week setup       2-3 weeks setup
```

---

## 🎯 Ready to Start?

**Choose your path:**

1. **🚀 Quick POC** → [POC-README.md](./POC-README.md) (30 min, $0)
2. **📋 Full Specification** → [README-FULL-SPEC.md](./README-FULL-SPEC.md) (comprehensive guide)
3. **💬 Questions?** → Open an issue or start with the POC

---

## 📚 Documentation

- **[POC-README.md](./POC-README.md)** — Step-by-step implementation guide
- **[README-FULL-SPEC.md](./README-FULL-SPEC.md)** — Complete technical specification
- **Architecture diagrams** — See both options detailed
- **Code templates** — Ready-to-use scripts and configurations
- **Troubleshooting** — Common issues and solutions

---

## 🤝 Contributing

This is a working specification for building a monitoring service. Feel free to:

- Use the POC guide to build your own version
- Contribute improvements to the implementation
- Share your experience and results
- Suggest additional features or integrations

---

**Ready to catch website issues before your customers do?** 

👉 **[Start with the POC guide](./POC-README.md)**