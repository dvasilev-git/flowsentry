const fs = require('fs');
const path = require('path');

async function generateStatusPage() {
  console.log('📊 Generating status page...');
  
  // Read the latest monitoring results
  const resultsDir = './results';
  const statusPageDir = './status-page';
  
  // Create status-page directory
  if (!fs.existsSync(statusPageDir)) {
    fs.mkdirSync(statusPageDir);
  }
  
  // Read sites configuration
  const sites = JSON.parse(fs.readFileSync('./config/sites.json', 'utf8'));
  
  // Read latest uptime results
  let uptimeResults = [];
  if (fs.existsSync(resultsDir)) {
    const files = fs.readdirSync(resultsDir)
      .filter(file => file.startsWith('uptime-') && file.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length > 0) {
      const latestFile = files[0];
      uptimeResults = JSON.parse(fs.readFileSync(path.join(resultsDir, latestFile), 'utf8'));
    }
  }
  
  // Calculate status for each site
  const siteStatuses = sites.sites.map(site => {
    const siteResults = uptimeResults.filter(result => result.client === site.client);
    const successCount = siteResults.filter(result => result.success).length;
    const totalCount = siteResults.length;
    const uptime = totalCount > 0 ? (successCount / totalCount * 100).toFixed(2) : '0.00';
    const status = uptime >= 99.0 ? 'operational' : uptime >= 95.0 ? 'degraded' : 'outage';
    
    return {
      name: site.client,
      domain: site.domain,
      status,
      uptime: `${uptime}%`,
      lastCheck: siteResults.length > 0 ? siteResults[0].timestamp : 'Never',
      urls: site.urls.map(url => ({
        name: url.name,
        path: url.path,
        status: siteResults.find(r => r.url === url.name)?.success ? 'up' : 'down'
      }))
    };
  });
  
  // Generate HTML status page
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlowSentry Status</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: #2c3e50;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .operational { background-color: #28a745; }
        .degraded { background-color: #ffc107; }
        .outage { background-color: #dc3545; }
        .site {
            padding: 20px;
            border-bottom: 1px solid #eee;
        }
        .site:last-child { border-bottom: none; }
        .site-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .site-status {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }
        .urls {
            margin-top: 12px;
        }
        .url {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        .url:last-child { border-bottom: none; }
        .url-status {
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 12px;
            background: #e9ecef;
        }
        .url-status.up { background: #d4edda; color: #155724; }
        .url-status.down { background: #f8d7da; color: #721c24; }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6c757d;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 FlowSentry Status</h1>
            <p>Real-time monitoring of your websites</p>
        </div>
        
        ${siteStatuses.map(site => `
        <div class="site">
            <div class="site-name">${site.name}</div>
            <div class="site-status">
                <span class="status-indicator ${site.status}"></span>
                <span>${site.status.charAt(0).toUpperCase() + site.status.slice(1)} - ${site.uptime} uptime</span>
            </div>
            <div class="urls">
                ${site.urls.map(url => `
                <div class="url">
                    <span>${url.name} (${site.domain}${url.path})</span>
                    <span class="url-status ${url.status}">${url.status.toUpperCase()}</span>
                </div>
                `).join('')}
            </div>
        </div>
        `).join('')}
        
        <div class="footer">
            <p>Last updated: ${new Date().toLocaleString()}</p>
            <p>Powered by FlowSentry Monitoring</p>
        </div>
    </div>
</body>
</html>`;
  
  // Write the status page
  fs.writeFileSync(path.join(statusPageDir, 'index.html'), html);
  
  // Also create a simple JSON API
  const apiData = {
    status: 'operational',
    timestamp: new Date().toISOString(),
    sites: siteStatuses
  };
  
  fs.writeFileSync(path.join(statusPageDir, 'api.json'), JSON.stringify(apiData, null, 2));
  
  console.log('✅ Status page generated successfully');
  console.log(`📄 HTML: ${path.join(statusPageDir, 'index.html')}`);
  console.log(`📊 API: ${path.join(statusPageDir, 'api.json')}`);
}

// Run if called directly
if (require.main === module) {
  generateStatusPage()
    .then(() => {
      console.log('🎯 Status page generation completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error generating status page:', error);
      process.exit(1);
    });
}

module.exports = { generateStatusPage };
