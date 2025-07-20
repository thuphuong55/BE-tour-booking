const axios = require('axios');

class PerformanceTest {
  constructor() {
    this.baseURL = 'http://localhost:5005'; // hoặc port server hiện tại
    this.optimizedURL = 'http://localhost:5006'; // server optimized
  }

  async testEndpoint(url, description) {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const responseSize = JSON.stringify(response.data).length;
      const compressed = response.headers['content-encoding'] || 'none';
      
      return {
        success: true,
        description,
        url,
        duration,
        responseSize,
        compressed,
        status: response.status,
        responseTime: response.headers['x-response-time'] || 'N/A'
      };
    } catch (error) {
      return {
        success: false,
        description,
        url,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  async runTests() {
    console.log('🧪 Starting Performance Tests...\n');

    const tests = [
      {
        description: 'Tours List (page 1, limit 10)',
        endpoint: '/api/tours?page=1&limit=10'
      },
      {
        description: 'Tours List with Search',
        endpoint: '/api/tours?page=1&limit=10&search=Đà Lạt'
      },
      {
        description: 'Tours List with Status Filter',
        endpoint: '/api/tours?page=1&limit=10&status=Đang hoạt động'
      },
      {
        description: 'Large Page Load',
        endpoint: '/api/tours?page=1&limit=20'
      }
    ];

    for (const test of tests) {
      console.log(`📊 Testing: ${test.description}`);
      
      // Test current server
      const current = await this.testEndpoint(
        `${this.baseURL}${test.endpoint}`,
        `Current - ${test.description}`
      );
      
      // Test optimized server (nếu có)
      // const optimized = await this.testEndpoint(
      //   `${this.optimizedURL}${test.endpoint}`,
      //   `Optimized - ${test.description}`
      // );

      // Display results
      this.displayResults(current);
      // this.displayResults(optimized);
      
      console.log('━'.repeat(60));
    }

    console.log('\n✅ Performance tests completed!');
  }

  displayResults(result) {
    if (result.success) {
      console.log(`✅ ${result.description}`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Response Size: ${(result.responseSize / 1024).toFixed(2)} KB`);
      console.log(`   Compression: ${result.compressed}`);
      console.log(`   Server Response Time: ${result.responseTime}`);
    } else {
      console.log(`❌ ${result.description}`);
      console.log(`   Error: ${result.error}`);
      console.log(`   Duration: ${result.duration}ms`);
    }
    console.log('');
  }

  async loadTest(endpoint, concurrent = 5, iterations = 10) {
    console.log(`🔥 Load Testing: ${endpoint}`);
    console.log(`   Concurrent requests: ${concurrent}`);
    console.log(`   Iterations: ${iterations}\n`);

    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const promises = [];
      
      for (let j = 0; j < concurrent; j++) {
        promises.push(this.testEndpoint(
          `${this.baseURL}${endpoint}`,
          `Load Test ${i+1}-${j+1}`
        ));
      }
      
      const batchResults = await Promise.all(promises);
      results.push(...batchResults);
      
      // Wait a bit between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calculate statistics
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    if (successful.length > 0) {
      const durations = successful.map(r => r.duration);
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      
      console.log(`📈 Load Test Results:`);
      console.log(`   Total Requests: ${results.length}`);
      console.log(`   Successful: ${successful.length}`);
      console.log(`   Failed: ${failed.length}`);
      console.log(`   Average Duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`   Min Duration: ${minDuration}ms`);
      console.log(`   Max Duration: ${maxDuration}ms`);
      console.log(`   Success Rate: ${(successful.length / results.length * 100).toFixed(2)}%`);
    }
  }
}

// Run tests
async function main() {
  const tester = new PerformanceTest();
  
  // Basic performance tests
  await tester.runTests();
  
  // Load test
  await tester.loadTest('/api/tours?page=1&limit=10', 3, 5);
}

// Only run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = PerformanceTest;
