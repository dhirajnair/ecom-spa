# Deployment Guide

This guide covers deploying the e-commerce microservices application to different environments.

## 🏠 Local Development

### Prerequisites

- Docker Desktop
- Node.js 18+
- Python 3.11+
- PostgreSQL (optional, Docker provides this)

### Quick Start

```bash
# Clone repository
git clone <repo-url>
cd ecom-spa

# Start all services
make up

# Or using docker-compose directly
docker-compose up --build
```

### Development Mode with Hot Reload

```bash
# Start with development overrides
make dev

# Or manually
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Manual Service Setup

If you prefer running services manually:

#### 1. Database Setup

```bash
# Using Docker
docker run --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15

# Initialize databases
make db-setup
```

#### 2. Backend Services

```bash
# Product Service
cd backend/product-service
pip install -r requirements.txt
export DATABASE_URL="postgresql://ecom:ecom123@localhost:5432/ecom_products"
uvicorn app.main:app --reload --port 8001

# Cart Service
cd backend/cart-service
pip install -r requirements.txt
export DATABASE_URL="postgresql://ecom:ecom123@localhost:5432/ecom_carts"
uvicorn app.main:app --reload --port 8002
```

#### 3. Frontend

```bash
cd frontend
npm install
npm start
```

## 🏢 Production Deployment

### Docker Compose Production

```bash
# Production build
docker-compose up -d --build

# Scale services
docker-compose up -d --scale product-service=3 --scale cart-service=2
```

### Environment Variables

Create `.env` file:

```bash
# Copy example
cp .env.example .env

# Edit variables
vim .env
```

Required variables:
```bash
# Database
DATABASE_URL_PRODUCTS=postgresql://user:pass@host:5432/ecom_products
DATABASE_URL_CARTS=postgresql://user:pass@host:5432/ecom_carts

# Security
JWT_SECRET_KEY=your-super-secret-key

# Services
PRODUCT_SERVICE_URL=http://product-service:8001/api
CART_SERVICE_URL=http://cart-service:8002/api
```

## ☁️ AWS Deployment

### Prerequisites

- AWS CLI configured
- Terraform >= 1.0
- Docker for image building

### Step 1: Configure Terraform

```bash
cd terraform

# Copy variables template
cp terraform.tfvars.example terraform.tfvars

# Edit configuration
vim terraform.tfvars
```

Example `terraform.tfvars`:
```hcl
project_name = "ecom-spa"
environment  = "production"
aws_region   = "us-west-2"

# Database
db_instance_class    = "db.t3.small"
db_allocated_storage = 100

# Application
jwt_secret_key = "your-production-secret-key"

# Scaling
desired_capacity = 3
max_capacity     = 10

# Domain (optional)
domain_name     = "your-domain.com"
certificate_arn = "arn:aws:acm:us-west-2:123456789:certificate/abc123"
```

### Step 2: Create Infrastructure

```bash
# Initialize Terraform
terraform init

# Review plan
terraform plan

# Deploy infrastructure
terraform apply
```

### Step 3: Build and Push Images

Get ECR repository URLs from Terraform output:

```bash
terraform output ecr_repositories
```

Build and push images:

```bash
# Get login token
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com

# Build and push product service
docker build -t ecom-spa-prod-product-service ./backend/product-service
docker tag ecom-spa-prod-product-service:latest \
  <account-id>.dkr.ecr.us-west-2.amazonaws.com/ecom-spa-prod-product-service:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/ecom-spa-prod-product-service:latest

# Build and push cart service
docker build -t ecom-spa-prod-cart-service ./backend/cart-service
docker tag ecom-spa-prod-cart-service:latest \
  <account-id>.dkr.ecr.us-west-2.amazonaws.com/ecom-spa-prod-cart-service:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/ecom-spa-prod-cart-service:latest

# Build and push frontend
docker build -t ecom-spa-prod-frontend ./frontend
docker tag ecom-spa-prod-frontend:latest \
  <account-id>.dkr.ecr.us-west-2.amazonaws.com/ecom-spa-prod-frontend:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/ecom-spa-prod-frontend:latest
```

### Step 4: Deploy Services

After images are pushed, update ECS services:

```bash
# Force new deployment
aws ecs update-service \
  --cluster ecom-spa-prod-cluster \
  --service ecom-spa-prod-product-service \
  --force-new-deployment

aws ecs update-service \
  --cluster ecom-spa-prod-cluster \
  --service ecom-spa-prod-cart-service \
  --force-new-deployment

aws ecs update-service \
  --cluster ecom-spa-prod-cluster \
  --service ecom-spa-prod-frontend \
  --force-new-deployment
```

### Step 5: Initialize Database

Connect to RDS and initialize:

```bash
# Get RDS endpoint
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)

# Create databases
psql -h $RDS_ENDPOINT -U ecom -d postgres << EOF
CREATE DATABASE IF NOT EXISTS ecom_products;
CREATE DATABASE IF NOT EXISTS ecom_carts;
EOF
```

### Step 6: Verify Deployment

```bash
# Get application URL
APPLICATION_URL=$(terraform output -raw application_url)
echo "Application available at: $APPLICATION_URL"

# Test endpoints
curl -f $APPLICATION_URL/api/products
curl -f $APPLICATION_URL/api/health/products
curl -f $APPLICATION_URL/api/health/cart
```

## 🔧 Configuration Management

### Environment-Specific Configurations

#### Development
```yaml
# docker-compose.override.yml
version: '3.8'
services:
  product-service:
    environment:
      - DEBUG=true
      - LOG_LEVEL=DEBUG
  cart-service:
    environment:
      - DEBUG=true
      - LOG_LEVEL=DEBUG
```

#### Staging
```hcl
# terraform/staging.tfvars
environment = "staging"
db_instance_class = "db.t3.small"
desired_capacity = 2
```

#### Production
```hcl
# terraform/production.tfvars
environment = "production"
db_instance_class = "db.r5.large"
desired_capacity = 5
deletion_protection = true
```

### Secrets Management

#### Local Development
Use `.env` files (not committed to git).

#### AWS Production
Use AWS Secrets Manager:

```bash
# Store database password
aws secretsmanager create-secret \
  --name "ecom-spa/database/password" \
  --secret-string "your-secure-password"

# Store JWT secret
aws secretsmanager create-secret \
  --name "ecom-spa/jwt/secret" \
  --secret-string "your-jwt-secret"
```

Update Terraform to reference secrets:

```hcl
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "ecom-spa/database/password"
}

resource "aws_ecs_task_definition" "product_service" {
  # ... other configuration
  
  container_definitions = jsonencode([
    {
      secrets = [
        {
          name      = "DATABASE_PASSWORD"
          valueFrom = data.aws_secretsmanager_secret_version.db_password.arn
        }
      ]
    }
  ])
}
```

## 📊 Monitoring Setup

### CloudWatch Configuration

Enable detailed monitoring:

```hcl
# terraform/main.tf
resource "aws_ecs_cluster" "main" {
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
```

### Application Metrics

Add custom metrics to services:

```python
# In FastAPI services
import boto3
cloudwatch = boto3.client('cloudwatch')

@app.middleware("http")
async def add_metrics(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    # Send custom metric
    cloudwatch.put_metric_data(
        Namespace='ECommerce/API',
        MetricData=[
            {
                'MetricName': 'ResponseTime',
                'Value': duration,
                'Unit': 'Seconds',
                'Dimensions': [
                    {
                        'Name': 'Service',
                        'Value': 'ProductService'
                    }
                ]
            }
        ]
    )
    return response
```

### Log Aggregation

Configure centralized logging:

```json
{
  "logConfiguration": {
    "logDriver": "awslogs",
    "options": {
      "awslogs-group": "/ecs/ecom-spa-production",
      "awslogs-region": "us-west-2",
      "awslogs-stream-prefix": "ecs"
    }
  }
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Login to ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push images
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
      run: |
        # Build and push product service
        docker build -t $ECR_REGISTRY/ecom-spa-prod-product-service:$GITHUB_SHA ./backend/product-service
        docker push $ECR_REGISTRY/ecom-spa-prod-product-service:$GITHUB_SHA
        
        # Build and push cart service
        docker build -t $ECR_REGISTRY/ecom-spa-prod-cart-service:$GITHUB_SHA ./backend/cart-service
        docker push $ECR_REGISTRY/ecom-spa-prod-cart-service:$GITHUB_SHA
        
        # Build and push frontend
        docker build -t $ECR_REGISTRY/ecom-spa-prod-frontend:$GITHUB_SHA ./frontend
        docker push $ECR_REGISTRY/ecom-spa-prod-frontend:$GITHUB_SHA
    
    - name: Deploy to ECS
      run: |
        # Update ECS services with new images
        aws ecs update-service \
          --cluster ecom-spa-prod-cluster \
          --service ecom-spa-prod-product-service \
          --force-new-deployment
```

## 🛡️ Security Considerations

### Network Security

1. **VPC Configuration**
   - Private subnets for backend services
   - Public subnets only for load balancer
   - NAT gateways for outbound traffic

2. **Security Groups**
   - Minimal required access
   - No SSH access to containers
   - Database access only from ECS

3. **Load Balancer**
   - HTTPS termination
   - Security headers
   - WAF integration (optional)

### Application Security

1. **Container Security**
   - Non-root users in containers
   - Minimal base images
   - Regular security updates

2. **Secrets Management**
   - AWS Secrets Manager
   - No secrets in environment variables
   - Encrypted at rest and in transit

3. **Authentication**
   - JWT tokens with expiration
   - Secure password hashing
   - Rate limiting on auth endpoints

## 🔧 Troubleshooting

### Common Deployment Issues

#### ECS Tasks Failing to Start

```bash
# Check task definition
aws ecs describe-task-definition --task-definition ecom-spa-prod-product-service

# Check service events
aws ecs describe-services \
  --cluster ecom-spa-prod-cluster \
  --services ecom-spa-prod-product-service

# Check task logs
aws logs get-log-events \
  --log-group-name /ecs/ecom-spa-prod-product-service \
  --log-stream-name <stream-name>
```

#### Database Connection Issues

```bash
# Test database connectivity from ECS
aws ecs run-task \
  --cluster ecom-spa-prod-cluster \
  --task-definition ecom-spa-prod-product-service \
  --overrides '{
    "containerOverrides": [{
      "name": "product-service",
      "command": ["python", "-c", "import psycopg2; print(\"DB OK\")"]
    }]
  }'
```

#### Load Balancer Health Check Failures

```bash
# Check target group health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Check ALB access logs
aws s3 ls s3://your-alb-logs-bucket/ --recursive
```

### Debug Commands

```bash
# Connect to running container
aws ecs execute-command \
  --cluster ecom-spa-prod-cluster \
  --task <task-id> \
  --container product-service \
  --command "/bin/bash" \
  --interactive

# View service metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=ecom-spa-prod-product-service \
  --start-time 2023-01-01T00:00:00Z \
  --end-time 2023-01-01T23:59:59Z \
  --period 3600 \
  --statistics Average
```

## 📈 Performance Optimization

### Container Optimization

```dockerfile
# Multi-stage build for smaller images
FROM python:3.11-alpine as builder
RUN pip install --user -r requirements.txt

FROM python:3.11-alpine
COPY --from=builder /root/.local /root/.local
COPY app/ ./app/
```

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_carts_user_id ON carts(user_id);
```

### ECS Optimization

```hcl
# Use Fargate Spot for cost savings
resource "aws_ecs_service" "product_service" {
  capacity_provider_strategy {
    capacity_provider = "FARGATE_SPOT"
    weight           = 1
  }
  
  capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight           = 1
    base             = 1
  }
}
```

This deployment guide covers all major deployment scenarios from local development to production AWS deployment. Follow the appropriate section based on your deployment target and requirements.