# Grafana Cloud Setup for FlowSentry

This guide will help you set up Grafana Cloud integration for your FlowSentry monitoring system.

## 🎯 What You'll Get

- **📊 Real-time dashboards** showing uptime, response times, and synthetic flow success
- **🚨 Smart alerts** when websites go down or become slow
- **📈 Historical data** to track trends and performance over time
- **📧 Email notifications** for critical issues

## 📋 Prerequisites

1. **Grafana Cloud account** (free tier: 10k metrics, 50GB logs)
2. **GitHub repository** with FlowSentry monitoring setup
3. **Admin access** to your GitHub repository

## 🚀 Step-by-Step Setup

### Step 1: Get Grafana Cloud Credentials

1. **Sign up** at [grafana.com](https://grafana.com) (free tier)
2. **Go to**: Your Grafana Cloud instance → "Send logs"
3. **Copy these values**:
   - **Loki URL**: `https://logs-xxx.grafana.net/loki/api/v1/push`
   - **Username**: Your logs username (usually your instance ID)
   - **API Key**: Go to "My Account" → "Security" → "Service Accounts" → Create new with "Editor" role

### Step 2: Add GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
- `GRAFANA_API_KEY` = Your API key from Step 1
- `GRAFANA_LOKI_URL` = Your Loki URL from Step 1  
- `GRAFANA_LOKI_USER` = Your Loki username from Step 1

### Step 3: Import Dashboard

1. **Go to**: Your Grafana Cloud instance → Dashboards → Import
2. **Upload**: `grafana-dashboard.json` from this repository
3. **Configure**: Set the data source to your Loki instance
4. **Save**: The dashboard will show your monitoring data

### Step 4: Set Up Alerts

1. **Go to**: Your Grafana Cloud instance → Alerting → Alert Rules
2. **Import**: `grafana-alerts.yaml` from this repository
3. **Configure**: Set up notification channels (email, Slack, etc.)
4. **Test**: Trigger a test alert to verify notifications work

## 📊 Dashboard Panels

Your dashboard will include:

### **Overall Uptime**
- Shows total uptime percentage across all monitored sites
- Color-coded: Green (99%+), Yellow (95-99%), Red (<95%)

### **Uptime by Client**
- Individual uptime percentages for each client
- Helps identify which sites are having issues

### **Response Time Trends**
- Line chart showing response times over time
- Grouped by client and URL for easy comparison

### **Recent Failures**
- Table showing recent failed checks
- Includes client, URL, and domain information

### **Synthetic Flow Success Rate**
- Success rate for synthetic checkout flows
- Critical for e-commerce monitoring

## 🚨 Alert Rules

### **Website Down Alert**
- **Trigger**: When uptime drops below 90% for 5 minutes
- **Severity**: Critical
- **Action**: Immediate email notification

### **Slow Response Alert**
- **Trigger**: When response time exceeds 5 seconds for 10 minutes
- **Severity**: Warning
- **Action**: Email notification

### **Synthetic Flow Failing**
- **Trigger**: When synthetic checkout flow fails >20% for 15 minutes
- **Severity**: Critical
- **Action**: Immediate email notification

### **Synthetic Flow Slow**
- **Trigger**: When 95th percentile response time >30 seconds for 30 minutes
- **Severity**: Warning
- **Action**: Email notification

## 🔧 LogQL Queries

You can use these LogQL queries in Grafana to create custom panels:

### **Uptime Percentage**
```logql
sum(rate({job="flowsentry",kind="uptime"} | json | success=1 [5m])) / 
sum(rate({job="flowsentry",kind="uptime"} | json [5m])) * 100
```

### **Response Time by Client**
```logql
avg_over_time({job="flowsentry",kind="uptime"} | json | unwrap responseTime [5m]) by (client, url)
```

### **Recent Failures**
```logql
{job="flowsentry",kind="uptime"} | json | success=0 | line_format "{{.client}} - {{.url}} ({{.domain}}{{.path}})"
```

### **Synthetic Flow Duration**
```logql
quantile_over_time(0.95, {job="flowsentry",kind="synthetic"} | json | unwrap duration [1h]) by (client)
```

## 📧 Notification Setup

### **Email Notifications**
1. **Go to**: Grafana → Alerting → Notification channels
2. **Add**: Email notification channel
3. **Configure**: SMTP settings (or use Grafana Cloud's built-in email)
4. **Test**: Send test notification

### **Slack Integration**
1. **Create**: Slack webhook URL
2. **Add**: Slack notification channel in Grafana
3. **Configure**: Webhook URL and channel
4. **Test**: Send test message

## 🧪 Testing Your Setup

### **1. Verify Data Flow**
1. **Check**: GitHub Actions logs for "Successfully pushed X results to Loki"
2. **Verify**: Grafana dashboard shows data
3. **Confirm**: LogQL queries return results

### **2. Test Alerts**
1. **Temporarily**: Break one of your monitored sites
2. **Wait**: 5-10 minutes for alerts to trigger
3. **Check**: Email/Slack notifications arrive
4. **Fix**: The site and verify alerts clear

### **3. Validate Dashboard**
1. **Check**: All panels show data
2. **Verify**: Time ranges work correctly
3. **Confirm**: Refresh rates are appropriate

## 🔧 Troubleshooting

### **No Data in Dashboard**
- **Check**: GitHub Actions logs for Loki push errors
- **Verify**: Secrets are set correctly
- **Confirm**: Loki URL and credentials are valid

### **Alerts Not Firing**
- **Check**: Alert rule expressions are correct
- **Verify**: Notification channels are configured
- **Test**: Manual alert rule evaluation

### **High Data Usage**
- **Monitor**: Grafana Cloud usage dashboard
- **Optimize**: Reduce log verbosity if needed
- **Consider**: Upgrading to paid tier if approaching limits

## 📈 Scaling Up

### **Add More Sites**
1. **Update**: `config/sites.json` with new sites
2. **Commit**: Changes to trigger monitoring
3. **Verify**: New data appears in dashboard

### **Custom Queries**
1. **Create**: New LogQL queries for specific metrics
2. **Add**: Custom panels to dashboard
3. **Share**: Queries with team members

### **Advanced Alerting**
1. **Create**: Custom alert rules for specific use cases
2. **Set up**: Different notification channels for different severities
3. **Implement**: Escalation policies for critical alerts

## 🎯 Next Steps

1. **✅ Set up Grafana Cloud** (this guide)
2. **📊 Import dashboard** and verify data
3. **🚨 Configure alerts** and test notifications
4. **📈 Monitor trends** and optimize thresholds
5. **🔄 Iterate** based on your monitoring needs

## 🆘 Support

If you run into issues:

1. **Check**: GitHub Actions logs for errors
2. **Verify**: All secrets are set correctly
3. **Test**: LogQL queries in Grafana
4. **Review**: Grafana Cloud documentation

**Your FlowSentry monitoring system is now fully integrated with Grafana Cloud!** 🎉

---

**Ready to start?** Begin with Step 1 and work through each section. The entire setup should take about 15 minutes.
