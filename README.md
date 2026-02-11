# HTTP Status Codes Demo API

A complete REST API built with Express.js that demonstrates all common HTTP status codes with practical examples.

## Features

This project demonstrates:
- **1xx Informational**: Handled automatically by Express
- **2xx Success**: 200 OK, 201 Created, 204 No Content
- **3xx Redirection**: 301 Moved Permanently, 302 Found, 304 Not Modified
- **4xx Client Errors**: 400, 401, 403, 404, 429
- **5xx Server Errors**: 500, 502, 503, 504

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

Server will run on `http://localhost:3000`

### 3. Run Tests (in a new terminal)
```bash
npm test
```

## 📖 API Documentation

### Authentication
Most endpoints require authentication. Add this header:
```
Authorization: Bearer valid-token-123
```

### Endpoints

#### Success Responses (2xx)

**Get All Users** - 200 OK
```bash
curl -H "Authorization: Bearer valid-token-123" \
  http://localhost:3000/api/users
```

**Get Single User** - 200 OK
```bash
curl -H "Authorization: Bearer valid-token-123" \
  http://localhost:3000/api/users/1
```

**Create User** - 201 Created
```bash
curl -X POST \
  -H "Authorization: Bearer valid-token-123" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}' \
  http://localhost:3000/api/users
```

**Update User** - 200 OK
```bash
curl -X PUT \
  -H "Authorization: Bearer valid-token-123" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Updated"}' \
  http://localhost:3000/api/users/1
```

**Delete User** - 204 No Content
```bash
curl -X DELETE \
  -H "Authorization: Bearer valid-token-123" \
  http://localhost:3000/api/users/2
```

#### Redirection (3xx)

**Permanent Redirect** - 301
```bash
curl -L http://localhost:3000/users
```

**Temporary Redirect** - 302
```bash
curl -L http://localhost:3000/login
```

**Not Modified** - 304
```bash
# First request gets ETag
curl -v http://localhost:3000/api/static/config

# Second request with If-None-Match returns 304
curl -H "If-None-Match: \"config-v1.0\"" \
  http://localhost:3000/api/static/config
```

#### Client Errors (4xx)

**Bad Request** - 400
```bash
# Missing required field
curl -X POST \
  -H "Authorization: Bearer valid-token-123" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}' \
  http://localhost:3000/api/users
```

**Unauthorized** - 401
```bash
# No auth token
curl http://localhost:3000/api/users

# Invalid token
curl -H "Authorization: Bearer wrong-token" \
  http://localhost:3000/api/users
```

**Forbidden** - 403
```bash
# Non-admin user trying to create user (would need different token)
# Currently all authenticated requests use admin token
```

**Not Found** - 404
```bash
# User not found
curl -H "Authorization: Bearer valid-token-123" \
  http://localhost:3000/api/users/99999

# Route not found
curl http://localhost:3000/api/nonexistent
```

**Too Many Requests** - 429
```bash
# Make 11+ requests rapidly
for i in {1..12}; do curl http://localhost:3000/health; done
```

#### Server Errors (5xx)

**Internal Server Error** - 500
```bash
curl http://localhost:3000/api/error/server
```

**Bad Gateway** - 502
```bash
curl http://localhost:3000/api/external/data
```

**Service Unavailable** - 503
```bash
# Enable maintenance mode first
curl -X POST \
  -H "Authorization: Bearer valid-token-123" \
  -H "Content-Type: application/json" \
  -d '{"enabled":true}' \
  http://localhost:3000/admin/maintenance

# Then any request returns 503
curl http://localhost:3000/health

# Disable maintenance mode
curl -X POST \
  -H "Authorization: Bearer valid-token-123" \
  -H "Content-Type: application/json" \
  -d '{"enabled":false}' \
  http://localhost:3000/admin/maintenance
```

**Gateway Timeout** - 504
```bash
curl http://localhost:3000/api/slow/operation
```

## Testing with Postman

You can also test these endpoints using Postman:

1. Import the base URL: `http://localhost:3000`
2. Set Authorization header: `Bearer valid-token-123`
3. Test each endpoint listed above

## Status Code Summary

| Code | Name | When It Occurs |
|------|------|----------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 204 | No Content | Success with no response body |
| 301 | Moved Permanently | Resource permanently moved |
| 302 | Found | Temporary redirect |
| 304 | Not Modified | Cached version is still valid |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required/failed |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error occurred |
| 502 | Bad Gateway | Upstream server error |
| 503 | Service Unavailable | Server temporarily unavailable |
| 504 | Gateway Timeout | Upstream server timeout |

## Project Structure

```
.
├── app.js           # Main Express application
├── test-api.js      # Automated test script
├── package.json     # Dependencies
└── README.md        # This file
```

## Learning Points

1. **2xx codes** indicate success
2. **4xx codes** indicate client-side errors (you made a mistake)
3. **5xx codes** indicate server-side errors (server made a mistake)
4. Always return appropriate status codes for better API design
5. Include helpful error messages in the response body
6. Use rate limiting (429) to prevent abuse
7. Implement proper authentication (401) and authorization (403)

## Contributing

Feel free to extend this project with more examples or improve existing ones!


