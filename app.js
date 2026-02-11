const express = require('express');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// In-memory database
let users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' }
];

let requestCounts = {}; // For rate limiting
let maintenanceMode = false; // For 503 example

// Middleware: Rate limiting (429 Too Many Requests)
const rateLimit = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  
  if (!requestCounts[ip]) {
    requestCounts[ip] = { count: 1, resetTime: now + 60000 };
  } else {
    if (now > requestCounts[ip].resetTime) {
      requestCounts[ip] = { count: 1, resetTime: now + 60000 };
    } else {
      requestCounts[ip].count++;
      if (requestCounts[ip].count > 10) {
        return res.status(429).json({
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((requestCounts[ip].resetTime - now) / 1000)
        });
      }
    }
  }
  next();
};

// Middleware: Authentication (401 Unauthorized)
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide an authorization token'
    });
  }
  
  if (token !== 'Bearer valid-token-123') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'The provided token is invalid or expired'
    });
  }
  
  // Attach user info to request
  req.user = { id: 1, role: 'admin' };
  next();
};

// Middleware: Authorization (403 Forbidden)
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin privileges required for this operation'
    });
  }
  next();
};

// Middleware: Maintenance mode check (503 Service Unavailable)
const checkMaintenance = (req, res, next) => {
  if (maintenanceMode) {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Server is undergoing maintenance. Please try again later.',
      retryAfter: 3600
    });
  }
  next();
};

// Apply global middlewares
app.use(checkMaintenance);
app.use(rateLimit);

// ========================================
// ROUTES DEMONSTRATING STATUS CODES
// ========================================

// 100 Continue - Simulated (Express handles this automatically for large uploads)
// This is typically handled at HTTP layer, not in application code

// 200 OK - Get all users
app.get('/api/users', authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    data: users
  });
});

// 200 OK - Get single user
app.get('/api/users/:id', authenticate, (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    // 404 Not Found
    return res.status(404).json({
      error: 'User not found',
      message: `No user exists with id ${userId}`
    });
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// 201 Created - Create new user
app.post('/api/users', authenticate, requireAdmin, (req, res) => {
  const { name, email, role } = req.body;
  
  // 400 Bad Request - Validation
  if (!name || !email) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Name and email are required fields',
      details: {
        name: !name ? 'Name is required' : null,
        email: !email ? 'Email is required' : null
      }
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid email format'
    });
  }
  
  const newUser = {
    id: users.length + 1,
    name,
    email,
    role: role || 'user'
  };
  
  users.push(newUser);
  
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: newUser
  });
});

// 200 OK - Update user
app.put('/api/users/:id', authenticate, (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, email, role } = req.body;
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    // 404 Not Found
    return res.status(404).json({
      error: 'User not found',
      message: `No user exists with id ${userId}`
    });
  }
  
  // Update user
  if (name) users[userIndex].name = name;
  if (email) users[userIndex].email = email;
  if (role) users[userIndex].role = role;
  
  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: users[userIndex]
  });
});

// 204 No Content - Delete user
app.delete('/api/users/:id', authenticate, requireAdmin, (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    // 404 Not Found
    return res.status(404).json({
      error: 'User not found',
      message: `No user exists with id ${userId}`
    });
  }
  
  users.splice(userIndex, 1);
  
  // 204 No Content - successful deletion with no response body
  res.status(204).send();
});

// 301 Moved Permanently - Redirect old endpoint
app.get('/users', (req, res) => {
  res.redirect(301, '/api/users');
});

// 302 Found - Temporary redirect
app.get('/login', (req, res) => {
  // Temporarily redirect to new login page
  res.redirect(302, '/auth/login');
});

// 304 Not Modified - Conditional GET with ETag
app.get('/api/static/config', (req, res) => {
  const configData = { version: '1.0', features: ['users', 'auth'] };
  const etag = '"config-v1.0"';
  
  // Check if client has the same version
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).send();
  }
  
  res.setHeader('ETag', etag);
  res.status(200).json(configData);
});

// 500 Internal Server Error - Simulated server error
app.get('/api/error/server', (req, res) => {
  try {
    // Simulate a server error
    throw new Error('Database connection failed');
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred on the server',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 502 Bad Gateway - Simulated upstream server error
app.get('/api/external/data', async (req, res) => {
  try {
    // Simulate calling external API that returns invalid response
    const upstreamFailed = true;
    
    if (upstreamFailed) {
      return res.status(502).json({
        error: 'Bad Gateway',
        message: 'Upstream server returned an invalid response'
      });
    }
  } catch (error) {
    res.status(502).json({
      error: 'Bad Gateway',
      message: 'Failed to communicate with upstream server'
    });
  }
});

// 504 Gateway Timeout - Simulated timeout
app.get('/api/slow/operation', async (req, res) => {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), 100);
  });
  
  const slowOperation = new Promise((resolve) => {
    setTimeout(() => resolve('data'), 5000);
  });
  
  try {
    await Promise.race([slowOperation, timeout]);
  } catch (error) {
    return res.status(504).json({
      error: 'Gateway Timeout',
      message: 'Upstream server took too long to respond'
    });
  }
});

// Admin endpoint to toggle maintenance mode (for 503 testing)
app.post('/admin/maintenance', authenticate, requireAdmin, (req, res) => {
  maintenanceMode = req.body.enabled || false;
  res.status(200).json({
    success: true,
    message: `Maintenance mode ${maintenanceMode ? 'enabled' : 'disabled'}`
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// 404 Not Found - Catch all undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /api/users',
      'GET /api/users/:id',
      'POST /api/users',
      'PUT /api/users/:id',
      'DELETE /api/users/:id'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong!'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('\n=== API Documentation ===');
  console.log('Authentication: Add header "Authorization: Bearer valid-token-123"');
  console.log('\nEndpoints:');
  console.log('GET    /health                    - Health check (no auth)');
  console.log('GET    /api/users                 - Get all users');
  console.log('GET    /api/users/:id             - Get user by ID');
  console.log('POST   /api/users                 - Create user (admin only)');
  console.log('PUT    /api/users/:id             - Update user');
  console.log('DELETE /api/users/:id             - Delete user (admin only)');
  console.log('GET    /api/error/server          - Trigger 500 error');
  console.log('GET    /api/external/data         - Trigger 502 error');
  console.log('GET    /api/slow/operation        - Trigger 504 error');
  console.log('POST   /admin/maintenance         - Toggle maintenance mode (admin only)');
});

module.exports = app;
