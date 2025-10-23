const { pushToPrometheus } = require('./scripts/push-prometheus');

// Test data
const testResults = [
  {
    client: 'test-client',
    domain: 'example.com',
    url: 'homepage',
    path: '/',
    status: 200,
    responseTime: 250,
    success: true,
    timestamp: new Date().toISOString()
  }
];

async function testPush() {
  console.log('🧪 Testing Prometheus push...');
  console.log('Environment variables:');
  console.log('GRAFANA_PROMETHEUS_URL:', process.env.GRAFANA_PROMETHEUS_URL ? 'SET' : 'NOT SET');
  console.log('GRAFANA_PROMETHEUS_USER:', process.env.GRAFANA_PROMETHEUS_USER ? 'SET' : 'NOT SET');
  console.log('GRAFANA_API_KEY:', process.env.GRAFANA_API_KEY ? 'SET' : 'NOT SET');
  
  if (!process.env.GRAFANA_PROMETHEUS_URL || !process.env.GRAFANA_PROMETHEUS_USER || !process.env.GRAFANA_API_KEY) {
    console.log('❌ Missing environment variables. Please set:');
    console.log('   GRAFANA_PROMETHEUS_URL');
    console.log('   GRAFANA_PROMETHEUS_USER');
    console.log('   GRAFANA_API_KEY');
    return;
  }
  
  try {
    await pushToPrometheus(testResults, 'uptime');
    console.log('✅ Test push completed successfully');
  } catch (error) {
    console.error('❌ Test push failed:', error.message);
  }
}

testPush();
