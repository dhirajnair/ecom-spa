# E-commerce SPA - Microservices Application

[![Architecture](https://img.shields.io/badge/architecture-serverless_microservices-blue.svg)](https://microservices.io/)
[![Frontend](https://img.shields.io/badge/frontend-React-61DAFB.svg)](https://reactjs.org/)
[![Backend](https://img.shields.io/badge/backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.io/badge/database-DynamoDB-FF9900.svg)](https://aws.amazon.com/dynamodb/)
[![Cloud](https://img.shields.io/badge/cloud-AWS_Lambda-FF9900.svg)](https://aws.amazon.com/lambda/)
[![Infrastructure](https://img.shields.io/badge/IaC-Terraform-623CE4.svg)](https://terraform.io/)

## Table of Contents

- [Architecture and Design Choices](#architecture-and-design-choices)
- [Setup, Deployment, and Run Instructions](#setup-deployment-and-run-instructions)
- [Authentication Flow Testing Instructions](#authentication-flow-testing-instructions)
  - [Local Development Authentication](#local-development-authentication)
  - [AWS Production Authentication](#aws-production-authentication) 
- [Terraform Infrastructure Template](#terraform-infrastructure-template)

## Architecture and Design Choices

**Overview**: Serverless microservices architecture with React SPA frontend, FastAPI backend services, DynamoDB NoSQL database, AWS Cognito authentication, and full infrastructure-as-code deployment.

**Key Design Decisions**:
- **Serverless-First**: Lambda functions for automatic scaling, zero infrastructure management
- **Microservices**: Separate product and cart services for independent deployment and scaling
- **Container-Based**: Docker images deployed to Lambda for consistent runtime environments
- **NoSQL Database**: DynamoDB for seamless scaling with AWS ecosystem integration
- **Authentication Strategy**: AWS Cognito for production, mock auth for development
- **Infrastructure-as-Code**: Complete Terraform automation for reproducible deployments

### Production Architecture (AWS Serverless)
```
Frontend (React SPA) → API Gateway → Static Assets (Frontend Lambda)
                            ↓
                      Product Service (Lambda) → DynamoDB (Products)
                            ↓
                      Cart Service (Lambda) → DynamoDB (Carts)
                            ↓
                      AWS Cognito (Authentication)
```

### Local Development Architecture
```
React SPA (Docker :3001) ↔ Product Service (Docker :8001) ↔ DynamoDB Local (Docker :8000)
                         ↔ Cart Service (Docker :8002) ↗
```

**Technology Stack**:
- **Frontend**: React 18, React Router, Context API, Tailwind CSS
- **Backend**: FastAPI, Pydantic, Boto3, JWT authentication
- **Database**: DynamoDB (Local + AWS)
- **Authentication**: AWS Cognito + JWT tokens
- **Infrastructure**: AWS Lambda, API Gateway, ECR
- **DevOps**: Docker, Terraform, Make, Docker Compose

## Setup, Deployment, and Run Instructions

### Prerequisites
- **Docker Desktop** (required)
- **AWS CLI** configured (for AWS deployment)
- **Terraform** >= 1.0 (for AWS deployment)
- **Node.js 18+** and **Python 3.11+** (for manual setup)

### Local Development Setup

**Option 1: Docker (Recommended)**
```bash
# 1. Clone and setup environment
git clone <repository-url> && cd ecom-spa
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env

# 2. Start all services
make dev
# OR: docker-compose -f docker-compose.yml up --build

# 3. Setup database (first time only)
make setup-dynamodb
# OR: python scripts/setup-dynamodb.py
```

**Option 2: Manual Setup**
```bash
# 1. Start DynamoDB Local
docker run -p 8000:8000 -d amazon/dynamodb-local:latest

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Start services (separate terminals)
cd backend && PYTHONPATH=$(pwd) uvicorn product-service.app.main:app --reload --port 8001
cd backend && PYTHONPATH=$(pwd) uvicorn cart-service.app.main:app --reload --port 8002

# 4. Start frontend (optional)
cd frontend && npm install && npm start
```

**Access URLs:**
- Frontend: http://localhost:3001
- Product Service API: http://localhost:8001/docs
- Cart Service API: http://localhost:8002/docs
- DynamoDB Local: http://localhost:8000

### AWS Production Deployment

**1. Setup AWS Credentials**
```bash
aws configure  # Enter AWS Access Key, Secret Key, Region
aws sts get-caller-identity  # Verify credentials
```

**2. Configure Terraform Variables**
```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Edit required values:
# - project_name, environment, aws_region
# - cognito_domain_prefix (must be globally unique)
# - jwt_secret_key
```

**3. Deploy Infrastructure**
```bash
cd terraform
terraform init
terraform plan -no-color | tee plan.txt  # Review changes
terraform apply -auto-approve
```

**3.1. Seed DynamoDB** (to be done every time after "destroy")
```bash
cd ../scripts
pip install boto3
python aws-setup-dynamodb.py
```

**4. Get Deployment URLs**
```bash
terraform output api_gateway_url
terraform output -json cognito_config
```

### Daily Development Commands

```bash
# Start/stop local environment
make dev                    # Start all services
make clean                  # Stop and clean containers

# Test APIs
make test-api              # Test all endpoints

# View logs
docker-compose logs -f     # Follow all logs
docker-compose logs cart-service  # Specific service logs

# Restart specific service
docker-compose restart product-service
```

### Teardown

```bash
# Local: Stop containers
docker-compose down -v

# AWS: Destroy infrastructure
cd terraform && terraform destroy -auto-approve
```

## Authentication Flow Testing Instructions

### Local Development Authentication

**Local MockAuth Flow:**

```
User → Frontend → Login → MockAuth/Local JWT → Frontend →   
 |                                                        ↓
 |                                                 Access Token (JWT)
 |                                                        ↓
 └─────────────→ Cart/Product Service ←──────────────────┘
                        ↓
              ┌───────────────────────┐
              │ Local Token Validation│
              │ (auth_utils.py)       │
              └───────────────────────┘
                        ↓
                Service Logic
                        ↓
                 DynamoDB Local
```

**Local Token Validation Process:**

```
JWT Token → Service Function
             ↓
    ┌────────────────────────┐
    │ 1. Decode JWT          │ → Using JWT_SECRET_KEY (HS256)
    └────────────────────────┘
             ↓
    ┌────────────────────────┐
    │ 2. Validate Claims     │ → exp: not expired
    │                        │   (NO audience/issuer check)
    └────────────────────────┘
             ↓
    ┌────────────────────────┐
    │ 3. Extract User Info   │ → sub (user_id)
    │                        │   username
    │                        │   email (optional)
    └────────────────────────┘
             ↓
         UserToken Object → Continue to Business Logic
```

**Pre-configured Test Users:**
- **Admin**: `admin@example.com` / `admin123`
- **User**: `user@example.com` / `user123`

**Authentication Flow Test (Local):**

```bash
# 1. Test login and get JWT token
curl -X POST http://localhost:8002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin@example.com", "password": "admin123"}'

# Response: {"access_token": "eyJ...", "token_type": "bearer"}
export JWT_TOKEN="your-token-from-response"

# 2. Test protected endpoints
curl -H "Authorization: Bearer $JWT_TOKEN" http://localhost:8002/api/cart

# 3. Test cart operations
curl -X POST -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id": "1", "quantity": 2}' \
  http://localhost:8002/api/cart/add

# 4. Test frontend authentication flow
# - Visit http://localhost:3001
# - Click "Login"
# - Enter credentials: admin@example.com / admin123
# - Verify redirect to products page
# - Test cart functionality
```

### AWS Production Authentication

**AWS Cognito Authentication Flow:**

```
User → Frontend → Cognito Hosted UI → User Pool → Frontend
 |                                                     ↓
 |                                              Access Token (JWT)
 |                                                     ↓
 └─────────────→ API Gateway ←────────────────────────┘
                     ↓
              ┌───────────────────────┐
              │Cognito Token Validation
              └───────────────────────┘
                     ↓
               Lambda Function
                     ↓
                 DynamoDB
```

**Cognito Token Validation Process:**

```
JWT Token → Lambda Function
             ↓
    ┌────────────────────────┐
    │ 1. Get Token Header    │ → Extract 'kid' (Key ID)
    └────────────────────────┘
             ↓
    ┌────────────────────────┐
    │ 2. Fetch JWKS          │ → GET cognito-idp.{region}.amazonaws.com/
    │                        │   {user-pool-id}/.well-known/jwks.json
    └────────────────────────┘
             ↓
    ┌────────────────────────┐
    │ 3. Match RSA Key       │ → Find key with matching 'kid'
    └────────────────────────┘
             ↓
    ┌────────────────────────┐
    │ 4. Verify Signature    │ → RS256 algorithm verification
    └────────────────────────┘
             ↓
    ┌────────────────────────┐
    │ 5. Validate Claims     │ → audience: client_id (jose library)
    │                        │   issuer: cognito user pool (jose library)
    │                        │   exp: not expired (jose library)
    │                        │   token_use: "access" (manual check for access token only. NO ROLE CHECK YET)
    └────────────────────────┘
             ↓
    ┌────────────────────────┐
    │ 6. Extract User Info   │ → sub (user_id)
    │                        │   cognito:username
    │                        │   email
    └────────────────────────┘
             ↓
         UserToken Object → Continue to Business Logic
```

**Detailed Step-by-Step Flow:**

```bash
# 1. Get Cognito configuration after deployment
cd terraform
terraform output -json cognito_config

# 2. Test Cognito signup (via frontend)
# - Visit deployed frontend URL
# - Click "Login" → redirects to Cognito Hosted UI
# - Click "Sign up" and create new account
# - Verify email address via confirmation code
# - Complete sign-up process

# 3. Test login flow
# - Return to frontend and click "Login"
# - Enter credentials in Cognito UI
# - Verify successful redirect with authorization code
# - Confirm cart operations work with Cognito JWT tokens

# 4. Test API with Cognito token
# After login via frontend, extract token from browser localStorage
# Use token for direct API calls:
curl -H "Authorization: Bearer $COGNITO_JWT_TOKEN" \
  https://your-api-gateway-url/api/cart
```

**Authentication Verification Checklist:**
- [ ] Local login returns valid JWT token
- [ ] Protected endpoints require valid token
- [ ] Invalid tokens are rejected (401 error)
- [ ] Frontend login/logout flow works
- [ ] Cart operations persist between sessions
- [ ] AWS Cognito signup/verification works
- [ ] OAuth2 redirect flow completes successfully

## Terraform Infrastructure Template

**Purpose**: Complete Infrastructure-as-Code solution for serverless AWS deployment with zero manual configuration.

### What Terraform Deploys

**Core Infrastructure:**
- **DynamoDB Tables**: `ecom-products` and `ecom-carts` with proper indexes and scaling
- **ECR Repositories**: Container registries for frontend, product-service, and cart-service
- **Lambda Functions**: Containerized services with automatic scaling and monitoring
- **API Gateway**: REST API with routes, CORS, and Cognito authorization integration
- **AWS Cognito**: User Pool, Identity Pool, and Hosted UI for authentication
- **IAM Roles**: Least-privilege access controls for all services

**Automation Features:**
- **Docker Build & Push**: Automatically builds container images and pushes to ECR
- **Environment Configuration**: Injects API Gateway URLs and Cognito config into Lambda environments
- **Database Seeding**: Optional automated population of products table
- **Output Generation**: Provides all necessary URLs and configuration for frontend integration

### Key Terraform Modules

```
terraform/
├── main.tf                    # Root configuration and resource coordination
├── modules/
│   ├── dynamodb/             # Database tables and indexes
│   ├── ecr/                  # Container registries with lifecycle policies
│   ├── lambda/               # Serverless functions with container images
│   ├── api-gateway/          # REST API with routing and CORS
│   └── cognito/              # Authentication service with Hosted UI
└── variables.tf              # Configurable deployment parameters
```

### Terraform Workflow

**1. Resource Creation Sequence:**
- ECR repositories → Docker image builds → Lambda functions → API Gateway → Cognito integration

**2. Automatic Dependency Management:**
- Lambda functions wait for ECR images
- API Gateway routes depend on Lambda function ARNs
- Cognito callback URLs use API Gateway endpoints

**3. Configuration Injection:**
- API Gateway URLs automatically configured in Lambda environment variables
- Cognito configuration exposed via Terraform outputs for frontend integration
- Database connection strings and AWS region automatically set

### Key Benefits

- **Zero Manual Setup**: Complete deployment with single `terraform apply`
- **Environment Consistency**: Identical infrastructure across dev/staging/prod
- **Automatic Scaling**: Serverless components scale based on demand
- **Cost Optimization**: Pay-per-use Lambda and DynamoDB pricing
- **Security Best Practices**: IAM roles with minimal required permissions
- **Rollback Capability**: Infrastructure versioning and state management

### Customization Points

**Required Variables** (set in `terraform.tfvars`):
- `project_name`: Resource naming prefix
- `environment`: Deployment environment (dev/staging/prod)
- `aws_region`: Target AWS region
- `cognito_domain_prefix`: Unique domain for Cognito Hosted UI
- `jwt_secret_key`: Secret for local JWT token generation

**Optional Overrides:**
- Lambda memory/timeout settings
- DynamoDB read/write capacity modes
- API Gateway rate limiting
- Cognito password policies

This Terraform template eliminates manual AWS console configuration and ensures reproducible, scalable deployments across multiple environments.