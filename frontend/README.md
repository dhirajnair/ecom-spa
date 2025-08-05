# E-commerce Frontend

Modern React SPA (Single Page Application) for the e-commerce microservices platform.

## Features

- **Modern React**: Built with React 18 and modern hooks
- **Routing**: React Router v6 for client-side routing
- **State Management**: Context API for auth and cart state
- **Data Fetching**: React Query for server state management
- **Forms**: React Hook Form for form handling
- **Styling**: Custom CSS with utility classes (Tailwind-inspired)
- **Icons**: Lucide React for beautiful icons
- **Notifications**: React Hot Toast for user feedback
- **Authentication**: JWT token-based auth with auto-refresh
- **Responsive Design**: Mobile-first responsive layout

## Pages & Components

### Pages
- **Home** (`/`) - Product listing with search and filters
- **Product Detail** (`/products/:id`) - Detailed product view
- **Cart** (`/cart`) - Shopping cart management (protected)
- **Login** (`/login`) - User authentication

### Key Components
- **Navigation** - Top navigation with cart indicator
- **ProductList** - Grid of products with search/filter
- **ProductDetail** - Product details with add to cart
- **Cart** - Shopping cart with quantity management
- **Login** - Authentication form with demo credentials
- **ProtectedRoute** - Route protection wrapper

## Authentication Flow

1. User visits public pages (home, product details) without authentication
2. Login required for cart functionality
3. JWT token stored in localStorage
4. Auto-redirect to login for protected routes
5. Token validation on app startup

### Demo Credentials
- **Admin**: username: `admin`, password: `admin123`
- **User**: username: `user`, password: `user123`

## API Integration

The frontend communicates with backend microservices:

- **Product Service** (port 8001): Product catalog, categories
- **Cart Service** (port 8002): Authentication, cart management

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_GATEWAY_URL` | `http://localhost:3001/api` | API Gateway URL |
| `REACT_APP_PRODUCT_SERVICE_URL` | `http://localhost:8001/api` | Product Service URL |
| `REACT_APP_CART_SERVICE_URL` | `http://localhost:8002/api` | Cart Service URL |

## Local Development

### Prerequisites
- Node.js 16+ and npm
- Backend services running (Product & Cart services)

### Installation & Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# The app will open at http://localhost:3000
```

### Development Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from Create React App (not recommended)
npm run eject
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Navigation.js    # Top navigation
│   ├── ProductList.js   # Product grid with filters
│   ├── ProductDetail.js # Single product view
│   ├── Cart.js          # Shopping cart
│   ├── Login.js         # Authentication
│   ├── ProtectedRoute.js # Route protection
│   ├── LoadingSpinner.js # Loading indicator
│   └── ErrorMessage.js  # Error display
├── contexts/            # React context providers
│   ├── AuthContext.js   # Authentication state
│   └── CartContext.js   # Cart state management
├── services/            # API services
│   ├── api.js           # API functions
│   └── auth.js          # Auth utilities
├── App.js               # Main app component
├── index.js             # App entry point
└── index.css            # Global styles
```

## State Management

### Auth Context
- User authentication state
- Login/logout functionality
- Token management
- Protected route handling

### Cart Context
- Cart items and total
- Add/remove/clear cart operations
- Integration with Cart Service API
- Optimistic updates with error handling

## Styling

- Custom CSS utility classes (Tailwind-inspired)
- Responsive design with mobile-first approach
- Component-specific styling
- CSS Grid and Flexbox layouts
- Smooth animations and transitions

## Error Handling

- Network error handling with retry mechanisms
- User-friendly error messages
- Toast notifications for actions
- Loading states for better UX
- 404 page for unknown routes

## Performance Optimizations

- React Query for efficient data fetching and caching
- Image optimization with fallback URLs
- Lazy loading considerations
- Efficient re-renders with proper dependency arrays
- Memoization where appropriate

## Docker Deployment

### Build & Run
```bash
# Build Docker image
docker build -t ecom-frontend .

# Run container
docker run -p 80:80 ecom-frontend
```

### Multi-stage Build
The Dockerfile uses multi-stage builds:
1. **Build stage**: Install dependencies and build React app
2. **Production stage**: Serve with Nginx

### Nginx Configuration
- Client-side routing support (SPA)
- Static asset caching
- Gzip compression
- Security headers
- CORS support for API calls

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

## Accessibility

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus management
- Screen reader compatibility

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features used
- Responsive design for all screen sizes

## Deployment Considerations

### Environment Setup
- Set appropriate API URLs for production
- Configure HTTPS in production
- Set up proper CORS policies
- Enable CDN for static assets

### Performance
- Enable gzip compression
- Set up proper caching headers
- Consider service worker for offline capability
- Optimize bundle size

This frontend provides a complete, modern shopping experience that integrates seamlessly with the backend microservices architecture.