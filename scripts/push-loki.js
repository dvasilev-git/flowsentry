const axios = require('axios');

/**
 * Push monitoring results to Grafana Cloud Loki
 * @param {Array} results - Array of monitoring results
 * @param {string} kind - Type of monitoring (uptime, synthetic, lighthouse)
 */
async function pushToLoki(results, kind = 'uptime') {
  if (!results || results.length === 0) {
    console.log('No results to push to Loki');
    return;
  }

  const streams = [{
    stream: { 
      job: 'flowsentry',
      kind: kind,
      region: 'github-actions'
    },
    values: results.map(result => [
      (Date.now() * 1000000).toString(), // Convert to nanoseconds
      JSON.stringify({
        timestamp: result.timestamp || new Date().toISOString(),
        client: result.client,
        domain: result.domain,
        url: result.url,
        path: result.path,
        status: result.status,
        responseTime: result.responseTime,
        success: result.success,
        error: result.error,
        kind: kind
      })
    ])
  }];

  try {
    await axios.post(process.env.GRAFANA_LOKI_URL, { streams }, {
      headers: { 
        'Content-Type': 'application/json'
      },
      auth: { 
        username: process.env.GRAFANA_LOKI_USER, 
        password: process.env.GRAFANA_API_KEY 
      },
      timeout: 10000
    });
    
    console.log(`✅ Successfully pushed ${results.length} ${kind} results to Loki`);
  } catch (error) {
    console.error(`❌ Failed to push ${kind} results to Loki:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

module.exports = { pushToLoki };
