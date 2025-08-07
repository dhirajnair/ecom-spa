# E-commerce SPA - Microservices Application

[![Deploy Status](https://img.shields.io/badge/deploy-ready-green.svg)](https://github.com)
[![Architecture](https://img.shields.io/badge/architecture-microservices-blue.svg)](https://microservices.io/)
[![Frontend](https://img.shields.io/badge/frontend-React-61DAFB.svg)](https://reactjs.org/)
[![Backend](https://img.shields.io/badge/backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.io/badge/database-DynamoDB-FF9900.svg)](https://aws.amazon.com/dynamodb/)
[![Cloud](https://img.shields.io/badge/cloud-AWS-FF9900.svg)](https://aws.amazon.com/)

Modern e-commerce SPA with microservices architecture: React frontend, FastAPI backend, DynamoDB database, AWS Cognito authentication, and serverless AWS deployment.

## 🏗️ Architecture Overview

### Production Environment (AWS - Serverless)
```
┌─────────────────┐
│   Frontend UI   │     ┌─────────────────────┐     ┌─────────────────────┐
│   (React SPA)   │────►│     API Gateway     │────►│   AWS Cognito       │
│   CloudFront    │     │     (REST API)      │     │  (Authentication)   │
└─────────────────┘     └─────────────────────┘     └─────────────────────┘
                                   │                            │
                       ┌───────────┼───────────┐                │
                       │           │           │                │
                       ▼           ▼           ▼                │___ 
            ┌─────────────────┐ ┌───────────┐ ┌─────────────────┐   │
            │   Frontend      │ │ Product   │ │  Cart Service   │   │
            │   Lambda        │ │ Service   │ │    Lambda       │◄──┘
            │ (React SPA)     │ │  Lambda   │ │ (Protected)     │
            └─────────────────┘ └───────────┘ └─────────────────┘
                       │           │           │
                       └───────────┼───────────┘
                                   ▼
                       ┌─────────────────────┐
                       │   DynamoDB          │
                       │   (Products + Carts)│
                       └─────────────────────┘
```

### Local Development Environment (Simplified)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │    │ Product Service │    │  Cart Service   │
│   (Frontend)    │◄──►│    (FastAPI)    │◄──►│   (FastAPI)     │
│ localhost:3000  │    │ localhost:8001  │    │ localhost:8002  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                └───────────┬───────────┘
                                            ▼
                                ┌─────────────────────┐
                                │  DynamoDB Local     │
                                │   localhost:8000    │
                                └─────────────────────┘
```

### 🎯 Key Features

- **🔧 Serverless Architecture**: Docker-based Lambda functions for maximum scalability
- **⚛️ Modern React Frontend**: SPA with hooks, context, and routing
- **⚡ FastAPI Backend**: High-performance async Python APIs
- **🗄️ DynamoDB Database**: Serverless NoSQL database with auto-scaling
- **🌐 AWS API Gateway**: Managed API routing with Cognito authorization
- **🐳 Docker Containerization**: Container images deployed to Lambda
- **☁️ AWS Serverless**: Lambda functions, DynamoDB, API Gateway infrastructure
- **🔐 AWS Cognito Authentication**: Secure, scalable authentication with local development mode
- **📊 Comprehensive Monitoring**: CloudWatch logs and metrics
- **🚀 CI/CD Ready**: GitHub Actions and automated deployment

## 🚀 Setup and Deployment

### 🏠 Local Development

See [**LOCAL_SETUP_AND_DEPLOY.md**](docs/LOCAL_SETUP_AND_DEPLOY.md) for detailed local development setup.

**Quick Start:**
```bash
git clone <repository-url> && cd ecom-spa
make dev  # Start all services
```

**Access:** http://localhost:3001 | **Login:** `admin/admin123` or `user/user123`

#### Authentication (Local)
- **Type**: Mock authentication for development
- **Users**: Pre-configured demo users (`admin`, `user`)
- **Tokens**: Local JWT tokens with simple validation
- **Purpose**: No AWS dependencies, fast development iteration

### ☁️ AWS Production

See [**AWS_SETUP_AND_DEPLOY.md**](docs/AWS_SETUP_AND_DEPLOY.md) for complete AWS deployment guide.

**Quick Deploy:**
```bash
# Configure Terraform variables
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Edit: cognito_domain_prefix, jwt_secret_key

# Deploy infrastructure  
cd terraform && terraform init && terraform apply

# Deploy application (see guide for full script)
```

#### Authentication (AWS)
- **Type**: AWS Cognito User Pool with Hosted UI
- **Signup**: Users create accounts via Cognito signup page
- **Login**: OAuth2 flow with JWT tokens
- **Features**: Email verification, password reset, MFA support
- **Integration**: Seamless redirect flow with frontend callback handling

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
├── 📁 scripts/               # Database and deployment scripts
├── 🐳 docker-compose.yml     # Local development setup
├── 📄 Makefile               # Development commands
└── 📖 README.md              # This file
```

## 🛠️ Development

**Local Development**: See [LOCAL_SETUP_AND_DEPLOY.md](docs/LOCAL_SETUP_AND_DEPLOY.md)  
**AWS Deployment**: See [AWS_SETUP_AND_DEPLOY.md](docs/AWS_SETUP_AND_DEPLOY.md)

**Quick Commands:**
```bash
make dev        # Start development environment
make setup      # First-time setup with sample data
make test-api   # Test all API endpoints
make clean      # Clean up containers and volumes
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

## 🔑 Authentication

**Local**: Mock users (`admin/admin123`, `user/user123`) - no AWS dependencies  
**AWS**: Cognito User Pool with OAuth2, signup/login UI, email verification

See setup guides for detailed configuration.

## 📚 Documentation

- **API Docs**: Product Service: http://localhost:8001/docs | Cart Service: http://localhost:8002/docs
- **Local Setup**: [LOCAL_SETUP_AND_DEPLOY.md](docs/LOCAL_SETUP_AND_DEPLOY.md)
- **AWS Deployment**: [AWS_SETUP_AND_DEPLOY.md](docs/AWS_SETUP_AND_DEPLOY.md)  
- **Cognito Setup**: [COGNITO_SETUP.md](docs/COGNITO_SETUP.md)

## 🛠️ Tech Stack

**Frontend**: React, React Router, Tailwind CSS  
**Backend**: FastAPI, Pydantic, Boto3  
**Database**: DynamoDB (Local + AWS)  
**Auth**: AWS Cognito + JWT  
**Cloud**: AWS Lambda, API Gateway, ECR  
**DevOps**: Docker, Terraform, GitHub Actions

---