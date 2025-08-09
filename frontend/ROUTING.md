# E-commerce SPA Routing Architecture

## Overview
This document outlines the routing architecture for the e-commerce SPA deployed on AWS Lambda with API Gateway stage-based routing.

## Architecture Components

### 1. API Gateway Stage Routing
- **Stage**: `dev` (configurable via `api_gateway_stage_name`)
- **Base URL**: `https://{api-id}.execute-api.ap-south-1.amazonaws.com/dev`
- **Stage Behavior**: API Gateway strips stage prefix before forwarding to Lambda

### 2. Route Distribution

#### API Routes (Backend Services)
```
/api/products     → Product Service Lambda
/api/products/*   → Product Service Lambda  
/api/categories   → Product Service Lambda (explicit route)
/api/cart         → Cart Service Lambda (Cognito auth required)
/api/cart/*       → Cart Service Lambda (Cognito auth required)
/api/auth/*       → Cart Service Lambda (public)
/api/health       → Product Service Lambda (health check)
```

#### Frontend Routes (SPA)
```
/                 → Frontend Lambda (root)
/{proxy+}         → Frontend Lambda (catch-all for SPA)
```

### 3. Frontend Server Routing (server.js)

#### Authentication Routes
- `/login` → Redirects to Cognito Hosted UI
- `/signup` → Redirects to Cognito Hosted UI  
- `/logout` → Handles Cognito logout (stage-aware)

#### Static Asset Routes
- `/:stage/static/*` → Serves static files with stage prefix
- `/:stage/manifest.json` → Manifest file
- `/:stage/favicon.ico` → Returns 204 No Content
- `/:stage/runtime-config.js` → Dynamic runtime configuration

#### SPA Routes
- `/:stage/*?` → Main SPA handler with stage-aware HTML rewriting
- `*` → Fallback SPA handler

### 4. Client-Side Routing (Navigation.js)

#### Navigation Links
- `/home` → Product dashboard (public)
- `/cart` → Shopping cart (always visible)
- `/login` → Authentication (when not logged in)

#### Logout Logic
- Detects stage from current URL path
- Builds stage-aware logout URL: `/{stage}/logout`
- Clears local storage and OIDC tokens

## Best Practices Followed

### ✅ Separation of Concerns
- **API routes** handled by dedicated Lambda functions
- **Static assets** served with appropriate caching headers
- **SPA routing** handled separately with HTML rewriting

### ✅ Stage-Aware Architecture
- Routes adapt to API Gateway stage (`dev`, `prod`, etc.)
- Runtime configuration injected dynamically
- Stage detection from environment variables

### ✅ Security Implementation
- Cognito authentication on protected API routes
- JWT token handling via OIDC
- Proper CORS configuration for OPTIONS requests

### ✅ Performance Optimizations
- Static asset caching with `Cache-Control` headers
- HTML rewriting for stage-aware asset URLs
- Explicit routes for high-traffic endpoints (`/api/categories`)

### ✅ Error Handling
- Fallback route patterns for SPA
- 404 handling for invalid routes
- Stage validation with regex patterns

## Issues & Technical Debt

### ⚠️ Stage Prefix Confusion
**Issue**: API Gateway strips stage prefix, causing client/server mismatch
- **Client builds**: `/dev/logout`
- **Server receives**: `/logout` (stage stripped)
- **Current fix**: Environment variable `STAGE` for server-side stage detection

### ⚠️ Complex HTML Rewriting
**Issue**: Runtime HTML manipulation for stage-aware URLs
- Multiple regex replacements for asset URLs
- Potential for missed asset references
- **Impact**: Maintenance overhead, possible edge cases

### ⚠️ Route Precedence Dependencies
**Issue**: Order-dependent route matching in Express
- Special routes must be defined before catch-all patterns
- Static routes checked before dynamic patterns
- **Risk**: Route conflicts if order changes

### ⚠️ Hardcoded Route Lists
**Location**: `server.js` line 258
```javascript
if (['login', 'logout', 'auth', 'runtime-config.js', 'health'].includes(req.params.stage))
```
**Issue**: Maintenance burden when adding new special routes

### ⚠️ Client-Side Stage Detection
**Issue**: Stage extraction from URL pathname in `Navigation.js`
- Assumes first path segment is always stage
- No validation of stage format
- **Risk**: Incorrect logout URLs in edge cases

## Current Workarounds

### Stage Detection
- **Server**: Uses `process.env.STAGE` environment variable
- **Client**: Extracts from `window.location.pathname.split('/')[1]`
- **Fallback**: Default to `'dev'` if detection fails

### Asset URL Rewriting
- **Method**: Runtime HTML string replacement
- **Scope**: Static assets, manifest, favicon, runtime-config
- **Base href**: Injected dynamically for relative links

## Recommendations for Future Work

### High Priority
1. **Centralize stage detection logic** into shared utility
2. **Replace HTML rewriting** with build-time asset URL configuration
3. **Add route validation** for stage parameter format

### Medium Priority
1. **Extract hardcoded route lists** into configuration
2. **Implement route precedence testing** to prevent conflicts
3. **Add comprehensive logging** for route debugging

### Low Priority
1. **Consider API Gateway custom domain** to eliminate stage complexity
2. **Implement client-side route guards** for better UX
3. **Add route performance monitoring** for optimization

## Route Flow Examples

### Product Page Access
```
1. User visits: https://api.amazonaws.com/dev/home
2. API Gateway: Matches /{proxy+} → Frontend Lambda
3. Frontend Lambda: Receives /home (stage stripped)
4. Express: Matches /:stage/*? → SPA handler  
5. Response: HTML with stage-aware asset URLs
```

### Logout Flow
```
1. Client: Builds /dev/logout URL
2. API Gateway: Strips stage → /logout
3. Frontend Lambda: app.get('/logout') handler
4. Server: Gets stage from process.env.STAGE
5. Redirect: Cognito logout with return URL
```

### API Call
```
1. Client: Calls /api/products
2. API Gateway: Matches /api/products → Product Service Lambda
3. Product Service: Handles request directly
4. Response: JSON data
```

## Configuration Dependencies

### Environment Variables
- `STAGE` - Current deployment stage (for logout routing)
- `REACT_APP_API_GATEWAY_URL` - Base API URL with stage
- Cognito configuration variables

### Terraform Outputs
- API Gateway URL construction
- Lambda environment variable injection
- Stage name propagation

## Testing Considerations

### Route Testing Priorities
1. **Stage detection** across different deployment environments
2. **Asset loading** with various stage configurations
3. **Authentication flows** with stage-aware redirects
4. **Fallback behavior** when stage detection fails
