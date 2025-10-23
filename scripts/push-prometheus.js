const axios = require('axios');

/**
 * Push monitoring results to Grafana Cloud Prometheus via remote write
 * @param {Array} results - Array of monitoring results
 * @param {string} kind - Type of monitoring (uptime, synthetic, lighthouse)
 */
async function pushToPrometheus(results, kind = 'uptime') {
  if (!results || results.length === 0) {
    console.log('No results to push to Prometheus');
    return;
  }

  // Convert results to Prometheus time series format
  const timeSeries = [];
  const timestamp = Date.now();

  for (const result of results) {
    const labels = {
      client: result.client,
      domain: result.domain,
      url: result.url,
      path: result.path || '',
      region: 'github-actions'
    };

    if (kind === 'uptime') {
      // Uptime status (1 = up, 0 = down)
      timeSeries.push({
        metric: {
          __name__: 'flowsentry_uptime_status',
          ...labels
        },
        value: [timestamp, result.success ? '1' : '0']
      });

      // Response time in seconds
      timeSeries.push({
        metric: {
          __name__: 'flowsentry_response_time_seconds',
          ...labels
        },
        value: [timestamp, (result.responseTime / 1000).toString()]
      });

      // HTTP status code
      timeSeries.push({
        metric: {
          __name__: 'flowsentry_http_status_code',
          ...labels
        },
        value: [timestamp, result.status.toString()]
      });

      // Check counter (total checks)
      timeSeries.push({
        metric: {
          __name__: 'flowsentry_checks_total',
          ...labels,
          status: result.success ? 'success' : 'failure'
        },
        value: [timestamp, '1']
      });

    } else if (kind === 'synthetic') {
      // Synthetic flow success (1 = success, 0 = failure)
      timeSeries.push({
        metric: {
          __name__: 'flowsentry_synthetic_success',
          ...labels,
          flow: result.flow || 'checkout'
        },
        value: [timestamp, result.success ? '1' : '0']
      });

      // Synthetic flow duration in seconds
      timeSeries.push({
        metric: {
          __name__: 'flowsentry_synthetic_duration_seconds',
          ...labels,
          flow: result.flow || 'checkout'
        },
        value: [timestamp, ((result.duration || 0) / 1000).toString()]
      });

      // Synthetic flow counter
      timeSeries.push({
        metric: {
          __name__: 'flowsentry_synthetic_flows_total',
          ...labels,
          flow: result.flow || 'checkout',
          status: result.success ? 'success' : 'failure'
        },
        value: [timestamp, '1']
      });
    }
  }

  // Format for Prometheus remote write
  const payload = {
    streams: [{
      stream: {
        job: 'flowsentry',
        kind: kind
      },
      values: timeSeries.map(ts => [
        ts.value[0].toString(), // timestamp in milliseconds
        ts.value[1] // metric value
      ])
    }]
  };

  try {
    await axios.post(process.env.GRAFANA_PROMETHEUS_URL, payload, {
      headers: {
        'Content-Type': 'application/x-protobuf',
        'Content-Encoding': 'snappy',
        'X-Prometheus-Remote-Write-Version': '0.1.0'
      },
      auth: {
        username: process.env.GRAFANA_PROMETHEUS_USER,
        password: process.env.GRAFANA_API_KEY
      },
      timeout: 10000
    });
    
    console.log(`✅ Successfully pushed ${timeSeries.length} Prometheus metrics`);
  } catch (error) {
    console.error(`❌ Failed to push Prometheus metrics:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Fallback: try with JSON format if protobuf fails
    console.log('🔄 Trying fallback JSON format...');
    await pushToPrometheusJSON(results, kind);
  }
}

/**
 * Fallback method using JSON format (simpler but less efficient)
 */
async function pushToPrometheusJSON(results, kind = 'uptime') {
  const timeSeries = [];
  const timestamp = Date.now();

  for (const result of results) {
    const labels = {
      client: result.client,
      domain: result.domain,
      url: result.url,
      path: result.path || '',
      region: 'github-actions'
    };

    if (kind === 'uptime') {
      timeSeries.push({
        metric: {
          __name__: 'flowsentry_uptime_status',
          ...labels
        },
        value: [timestamp, result.success ? '1' : '0']
      });

      timeSeries.push({
        metric: {
          __name__: 'flowsentry_response_time_seconds',
          ...labels
        },
        value: [timestamp, (result.responseTime / 1000).toString()]
      });
    } else if (kind === 'synthetic') {
      timeSeries.push({
        metric: {
          __name__: 'flowsentry_synthetic_success',
          ...labels,
          flow: result.flow || 'checkout'
        },
        value: [timestamp, result.success ? '1' : '0']
      });
    }
  }

  const payload = { timeSeries };

  try {
    await axios.post(process.env.GRAFANA_PROMETHEUS_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      auth: {
        username: process.env.GRAFANA_PROMETHEUS_USER,
        password: process.env.GRAFANA_API_KEY
      },
      timeout: 10000
    });
    
    console.log(`✅ Successfully pushed ${timeSeries.length} Prometheus metrics (JSON format)`);
  } catch (error) {
    console.error(`❌ Failed to push Prometheus metrics (JSON format):`, error.message);
  }
}

module.exports = { pushToPrometheus };
