# E-commerce SPA - Microservices Application

[![Deploy Status](https://img.shields.io/badge/deploy-ready-green.svg)](https://github.com)
[![Architecture](https://img.shields.io/badge/architecture-microservices-blue.svg)](https://microservices.io/)
[![Frontend](https://img.shields.io/badge/frontend-React-61DAFB.svg)](https://reactjs.org/)
[![Backend](https://img.shields.io/badge/backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.io/badge/database-PostgreSQL-316192.svg)](https://postgresql.org/)
[![Cloud](https://img.shields.io/badge/cloud-AWS-FF9900.svg)](https://aws.amazon.com/)

A modern, scalable e-commerce single-page application built with microservices architecture, featuring React frontend, FastAPI backend services, PostgreSQL database, and AWS cloud deployment.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │    │   API Gateway    │    │  Load Balancer  │
│   (Frontend)    │◄──►│    (Nginx)       │◄──►│      (ALB)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼                       ▼
            ┌─────────────────┐    ┌─────────────────┐
            │ Product Service │    │  Cart Service   │
            │    (FastAPI)    │    │   (FastAPI)     │
            └─────────────────┘    └─────────────────┘
                    │                       │
                    └───────────┬───────────┘
                                ▼
                    ┌─────────────────────┐
                    │   DynamoDB          │
                    │   (Products + Carts)│
                    └─────────────────────┘
```

### 🎯 Key Features

- **🔧 Microservices Architecture**: Loosely coupled services for scalability
- **⚛️ Modern React Frontend**: SPA with hooks, context, and routing
- **⚡ FastAPI Backend**: High-performance async Python APIs
- **🗄️ DynamoDB Database**: Serverless NoSQL database with auto-scaling
- **🐳 Docker Containerization**: Consistent deployment across environments
- **☁️ AWS Cloud Ready**: ECS Fargate, DynamoDB, ALB infrastructure
- **🔐 JWT Authentication**: Secure token-based authentication
- **📊 Comprehensive Monitoring**: CloudWatch logs and metrics
- **🚀 CI/CD Ready**: GitHub Actions and automated deployment

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)
- AWS CLI (for DynamoDB Local or AWS deployment)

### 1. Clone Repository

```bash
git clone <repository-url>
cd ecom-spa
```

### 2. Start with Docker Compose

```bash
# Start all services
make up

# Or manually
docker-compose up --build
```

### 3. Access Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **Product Service**: http://localhost:8001/docs
- **Cart Service**: http://localhost:8002/docs

### 4. Login Credentials

- **Admin**: username `admin`, password `admin123`
- **User**: username `user`, password `user123`

## 📋 Project Structure

```
ecom-spa/
├── 📁 backend/
│   ├── 📁 shared/              # Shared utilities and models
│   ├── 📁 product-service/     # Product management microservice
│   │   ├── 📁 app/            # FastAPI application
│   │   ├── 🐳 Dockerfile      # Container configuration
│   │   └── 📄 requirements.txt
│   └── 📁 cart-service/       # Cart and authentication service
│       ├── 📁 app/            # FastAPI application
│       ├── 🐳 Dockerfile      # Container configuration
│       └── 📄 requirements.txt
├── 📁 frontend/               # React SPA
│   ├── 📁 src/               # Source code
│   │   ├── 📁 components/    # React components
│   │   ├── 📁 contexts/      # State management
│   │   └── 📁 services/      # API services
│   ├── 🐳 Dockerfile         # Production container
│   └── 📄 package.json
├── 📁 terraform/             # AWS infrastructure as code
│   ├── 📁 modules/           # Terraform modules
│   ├── 📄 main.tf           # Root configuration
│   └── 📄 variables.tf
├── 📁 nginx/                 # API Gateway configuration
├── 📁 scripts/               # Database and deployment scripts
├── 🐳 docker-compose.yml     # Local development setup
├── 📄 Makefile               # Development commands
└── 📖 README.md              # This file
```

## 🛠️ Development

### Local Development Setup

#### Backend Services

```bash
# Setup database
make db-setup

# Start product service
cd backend/product-service
python -m uvicorn app.main:app --reload --port 8001

# Start cart service
cd backend/cart-service
python -m uvicorn app.main:app --reload --port 8002
```

#### Frontend Development

```bash
cd frontend
npm install
npm start
```

### Development Commands

```bash
# Start development environment
make dev

# Setup database
make db-setup

# Run tests
make test

# View logs
make logs

# Clean up
make clean
```

## 🏗️ Services Overview

### Product Service (Port 8001)

**Responsibilities:**
- Product catalog management
- Category filtering
- Product search and retrieval
- Stock management

**Key Endpoints:**
- `GET /api/products` - List products with filtering
- `GET /api/products/{id}` - Get product details
- `GET /api/categories` - Get product categories
- `GET /api/health` - Health check

### Cart Service (Port 8002)

**Responsibilities:**
- User authentication (JWT)
- Shopping cart management
- Cart persistence
- Product validation

**Key Endpoints:**
- `POST /api/auth/login` - User authentication
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add items to cart
- `DELETE /api/cart/remove/{id}` - Remove items
- `DELETE /api/cart/clear` - Clear cart

### Frontend (Port 3000)

**Features:**
- Product browsing and search
- User authentication
- Shopping cart functionality
- Responsive design
- Real-time updates

**Technology Stack:**
- React 18 with hooks
- React Router for navigation
- React Query for data fetching
- Context API for state management
- Custom CSS with utility classes

## 🗄️ Database Schema

### Products Table (DynamoDB)

```json
{
  "TableName": "ecom-products",
  "KeySchema": [
    {
      "AttributeName": "id",
      "KeyType": "HASH"
    }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "category-index",
      "KeySchema": [
        {
          "AttributeName": "category", 
          "KeyType": "HASH"
        }
      ]
    }
  ],
  "AttributeDefinitions": [
    {"AttributeName": "id", "AttributeType": "S"},
    {"AttributeName": "category", "AttributeType": "S"}
  ]
}
```

**Item Structure:**
```json
{
  "id": "1",
  "name": "Wireless Headphones",
  "description": "High-quality wireless headphones",
  "price": 199.99,
  "category": "Electronics",
  "image_url": "https://...",
  "stock": 50
}
```

### Carts Table (DynamoDB)

```json
{
  "TableName": "ecom-carts",
  "KeySchema": [
    {
      "AttributeName": "user_id",
      "KeyType": "HASH"
    }
  ],
  "AttributeDefinitions": [
    {"AttributeName": "user_id", "AttributeType": "S"}
  ]
}
```

**Item Structure:**
```json
{
  "user_id": "1",
  "id": "cart-uuid",
  "items": [
    {
      "id": "item-uuid",
      "product_id": "1",
      "quantity": 2,
      "price": 199.99
    }
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:15:00Z"
}
```

## 🐳 Docker Deployment

### Local Development

```bash
# Development with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production build
docker-compose up --build
```

### Container Images

- **Product Service**: Python 3.11 + FastAPI + boto3 for DynamoDB
- **Cart Service**: Python 3.11 + FastAPI + boto3 for DynamoDB + JWT  
- **Frontend**: Node.js build → Nginx static server
- **Database**: DynamoDB Local for development

## ☁️ AWS Deployment

### Infrastructure Components

- **VPC**: Multi-AZ setup with public/private subnets
- **ECS Fargate**: Container orchestration
- **Application Load Balancer**: Traffic distribution
- **DynamoDB**: Serverless NoSQL database
- **ECR**: Container registry
- **CloudWatch**: Logging and monitoring

### Deployment Steps

1. **Configure AWS credentials**
2. **Build and push images to ECR**
3. **Deploy with Terraform**

```bash
# Deploy infrastructure
cd terraform
terraform init
terraform plan
terraform apply

# Get application URL
terraform output application_url
```

For detailed deployment instructions, see [Terraform README](terraform/README.md).

## 🔐 Security Features

### Authentication & Authorization
- JWT token-based authentication
- Secure password handling
- Protected API endpoints
- Session management

### Network Security
- Private subnets for backend services
- Security groups with minimal access
- HTTPS support (with ACM certificate)
- API rate limiting

### Data Security
- Encrypted database storage
- Secure environment variable handling
- Input validation and sanitization
- CORS configuration

## 📊 Monitoring & Observability

### Application Monitoring
- **Health checks** on all services
- **CloudWatch metrics** for performance tracking
- **Application logs** with structured logging
- **Database performance insights**

### Alerting
- **Service health monitoring**
- **Resource utilization alerts**
- **Error rate tracking**
- **Custom business metrics**

## 🧪 Testing

### Backend Testing
```bash
# Run API tests
cd backend/product-service
pytest tests/

cd backend/cart-service
pytest tests/
```

### Frontend Testing
```bash
cd frontend
npm test
npm test -- --coverage
```

### Integration Testing
```bash
# Test API endpoints
make test-api

# End-to-end testing
# (Consider adding Cypress or Playwright)
```

## 🚀 Performance & Scaling

### Horizontal Scaling
- **ECS auto-scaling** based on CPU/memory
- **Database read replicas** for read scaling
- **CDN integration** for static assets
- **Container resource optimization**

### Performance Optimizations
- **React Query caching** for API responses
- **Database indexing** for fast queries
- **Container image optimization**
- **Nginx gzip compression**

## 🔧 Configuration

### Environment Variables

**Backend Services:**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET_KEY`: JWT signing secret
- `PORT`: Service port number

**Frontend:**
- `REACT_APP_API_GATEWAY_URL`: API Gateway URL
- `REACT_APP_PRODUCT_SERVICE_URL`: Product service URL
- `REACT_APP_CART_SERVICE_URL`: Cart service URL

### Configuration Files
- `docker-compose.yml`: Local development setup
- `terraform/variables.tf`: Infrastructure configuration  
- `frontend/package.json`: Frontend dependencies
- `backend/*/requirements.txt`: Python dependencies (now includes boto3)
- `scripts/setup-dynamodb.py`: Database initialization script

## 🐛 Troubleshooting

### Common Issues

**Services not starting:**
- Check Docker logs: `docker-compose logs`
- Verify database connection
- Ensure ports are available

**Database connection errors:**
- Verify DynamoDB Local is running
- Check AWS credentials and region
- Review IAM roles and policies (AWS)

**Frontend not loading:**
- Check console for JavaScript errors
- Verify API endpoints are accessible
- Review CORS configuration

### Debug Commands

```bash
# View service logs
make logs-product
make logs-cart
make logs-frontend

# Check service health
make health

# Database access
docker-compose exec postgres psql -U postgres
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint/Prettier for JavaScript
- Write tests for new features
- Update documentation
- Use conventional commits

## 📚 API Documentation

- **Product Service**: http://localhost:8001/docs
- **Cart Service**: http://localhost:8002/docs
- **API Gateway**: http://localhost:3001 (routes to services)

## 🛣️ Roadmap

### Phase 1 - Core Features ✅
- [x] Product catalog
- [x] Shopping cart
- [x] User authentication
- [x] Basic UI/UX

### Phase 2 - Enhanced Features 🚧
- [ ] Order management
- [ ] Payment integration
- [ ] User profiles
- [ ] Product reviews

### Phase 3 - Advanced Features 📋
- [ ] Real-time notifications
- [ ] Advanced search
- [ ] Recommendation engine
- [ ] Mobile app

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FastAPI** - Modern, fast web framework for building APIs
- **React** - A JavaScript library for building user interfaces
- **PostgreSQL** - The world's most advanced open source database
- **Docker** - Containerization platform
- **AWS** - Cloud computing services
- **Terraform** - Infrastructure as code

---

## 📞 Support

For support and questions:

- 📧 Email: support@example.com
- 📖 Documentation: [Full Documentation](docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-repo/discussions)

---

**Built with ❤️ for modern web development**