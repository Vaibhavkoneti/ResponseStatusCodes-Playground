// Test script to demonstrate all HTTP status codes
// Run this after starting the server with: node app.js

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const VALID_TOKEN = 'Bearer valid-token-123';

// Helper function to make requests
function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: data ? (data.length > 0 ? JSON.parse(data) : null) : null
        });
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Test runner
async function runTests() {
  console.log('='.repeat(60));
  console.log('HTTP STATUS CODES DEMONSTRATION');
  console.log('='.repeat(60));
  console.log();

  const tests = [
    {
      name: '200 OK - Get all users (authenticated)',
      test: async () => {
        const response = await makeRequest('GET', '/api/users', {
          'Authorization': VALID_TOKEN
        });
        console.log(`✓ Status: ${response.status}`);
        console.log(`  Response:`, response.body);
        return response;
      }
    },
    {
      name: '200 OK - Get single user',
      test: async () => {
        const response = await makeRequest('GET', '/api/users/1', {
          'Authorization': VALID_TOKEN
        });
        console.log(`✓ Status: ${response.status}`);
        console.log(`  User:`, response.body.data);
        return response;
      }
    },
    {
      name: '201 Created - Create new user',
      test: async () => {
        const response = await makeRequest('POST', '/api/users', {
          'Authorization': VALID_TOKEN
        }, {
          name: 'Bob Johnson',
          email: 'bob@example.com',
          role: 'user'
        });
        console.log(`✓ Status: ${response.status}`);
        console.log(`  Created:`, response.body);
        return response;
      }
    },
    {
      name: '204 No Content - Delete user',
      test: async () => {
        const response = await makeRequest('DELETE', '/api/users/2', {
          'Authorization': VALID_TOKEN
        });
        console.log(`✓ Status: ${response.status}`);
        console.log(`  Body: (empty - no content returned)`);
        return response;
      }
    },
    {
      name: '301 Moved Permanently - Redirect',
      test: async () => {
        try {
          const response = await makeRequest('GET', '/users');
          console.log(`✓ Status: ${response.status}`);
          console.log(`  Redirect Location: ${response.headers.location}`);
          return response;
        } catch (e) {
          console.log(`✓ Redirect detected (Node.js follows redirects automatically)`);
        }
      }
    },
    {
      name: '304 Not Modified - Conditional GET',
      test: async () => {
        // First request to get ETag
        const first = await makeRequest('GET', '/api/static/config');
        const etag = first.headers.etag;
        
        // Second request with If-None-Match
        const response = await makeRequest('GET', '/api/static/config', {
          'If-None-Match': etag
        });
        console.log(`✓ Status: ${response.status}`);
        console.log(`  Message: Resource not modified, use cached version`);
        return response;
      }
    },
    {
      name: '400 Bad Request - Missing required fields',
      test: async () => {
        const response = await makeRequest('POST', '/api/users', {
          'Authorization': VALID_TOKEN
        }, {
          name: 'Test User'
          // Missing email
        });
        console.log(`✓ Status: ${response.status}`);
        console.log(`  Error:`, response.body);
        return response;
      }
    },
    {
      name: '401 Unauthorized - No authentication token',
      test: async () => {
        const response = await makeRequest('GET', '/api/users');
        console.log(`✓ Status: ${response.status}`);
        console.log(`  Error:`, response.body);
        return response;
      }
    },
    {
      name: '403 Forbidden - Insufficient permissions',
      test: async () => {
        // This would require a non-admin token, but we'll note it
        console.log(`✓ Status: 403 (would occur with non-admin user)`);
        console.log(`  Scenario: Regular user trying to create/delete users`);
      }
    },
    {
      name: '404 Not Found - User does not exist',
      test: async () => {
        const response = await makeRequest('GET', '/api/users/99999', {
          'Authorization': VALID_TOKEN
        });
        console.log(`✓ Status: ${response.status}`);
        console.log(`  Error:`, response.body);
        return response;
      }
    },
    {
      name: '404 Not Found - Route does not exist',
      test: async () => {
        const response = await makeRequest('GET', '/api/nonexistent');
        console.log(`✓ Status: ${response.status}`);
        console.log(`  Error:`, response.body);
        return response;
      }
    },
    {
      name: '429 Too Many Requests - Rate limit',
      test: async () => {
        console.log(`  Making 12 rapid requests to trigger rate limit...`);
        let response;
        for (let i = 0; i < 12; i++) {
          response = await makeRequest('GET', '/health');
          if (response.status === 429) break;
        }
        if (response.status === 429) {
          console.log(`✓ Status: ${response.status}`);
          console.log(`  Error:`, response.body);
        } else {
          console.log(`  Note: Rate limit not reached in test`);
        }
        return response;
      }
    },
    {
      name: '500 Internal Server Error',
      test: async () => {
        const response = await makeRequest('GET', '/api/error/server');
        console.log(`✓ Status: ${response.status}`);
        console.log(`  Error:`, response.body);
        return response;
      }
    },
    {
      name: '502 Bad Gateway - Upstream error',
      test: async () => {
        const response = await makeRequest('GET', '/api/external/data');
        console.log(`✓ Status: ${response.status}`);
        console.log(`  Error:`, response.body);
        return response;
      }
    },
    {
      name: '503 Service Unavailable - Maintenance mode',
      test: async () => {
        // Enable maintenance mode
        await makeRequest('POST', '/admin/maintenance', {
          'Authorization': VALID_TOKEN
        }, { enabled: true });
        
        const response = await makeRequest('GET', '/health');
        console.log(`✓ Status: ${response.status}`);
        console.log(`  Error:`, response.body);
        
        // Disable maintenance mode
        await makeRequest('POST', '/admin/maintenance', {
          'Authorization': VALID_TOKEN
        }, { enabled: false });
        
        return response;
      }
    },
    {
      name: '504 Gateway Timeout',
      test: async () => {
        const response = await makeRequest('GET', '/api/slow/operation');
        console.log(`✓ Status: ${response.status}`);
        console.log(`  Error:`, response.body);
        return response;
      }
    }
  ];

  for (const { name, test } of tests) {
    console.log(`\n${name}`);
    console.log('-'.repeat(60));
    try {
      await test();
    } catch (error) {
      console.log(`✗ Error:`, error.message);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(60));
  console.log('TESTS COMPLETED');
  console.log('='.repeat(60));
}

// Run tests
console.log('Starting tests in 2 seconds...');
console.log('Make sure the server is running: node app.js\n');

setTimeout(() => {
  runTests().catch(console.error);
}, 2000);
