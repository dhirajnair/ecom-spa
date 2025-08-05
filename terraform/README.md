# Terraform Infrastructure for E-commerce SPA

This directory contains Terraform configurations to deploy the e-commerce microservices application to AWS using ECS Fargate, RDS PostgreSQL, and Application Load Balancer.

## Architecture

The infrastructure includes:

- **VPC** with public/private subnets across multiple AZs
- **Application Load Balancer** for traffic routing
- **ECS Fargate** cluster for containerized services
- **RDS PostgreSQL** for database persistence
- **ECR** repositories for container images
- **Security Groups** for network access control
- **CloudWatch** for logging and monitoring

## Prerequisites

1. **AWS CLI configured** with appropriate credentials
2. **Terraform** >= 1.0 installed
3. **Docker images** built and pushed to ECR (see deployment guide)

## Directory Structure

```
terraform/
├── main.tf                 # Root configuration
├── variables.tf            # Input variables
├── outputs.tf             # Output values
├── terraform.tfvars.example # Example variables file
├── modules/               # Terraform modules
│   ├── vpc/              # VPC and networking
│   ├── security/         # Security groups
│   ├── rds/              # RDS database
│   ├── ecs/              # ECS cluster
│   ├── alb/              # Application Load Balancer
│   ├── ecr/              # ECR repositories
│   └── services/         # ECS services
└── README.md             # This file
```

## Quick Start

### 1. Configure Variables

```bash
# Copy the example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit the variables file
vim terraform.tfvars
```

### 2. Initialize Terraform

```bash
cd terraform
terraform init
```

### 3. Plan Deployment

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

### 5. Get Outputs

```bash
# Get the application URL
terraform output application_url

# Get ECR repository URLs
terraform output ecr_repositories
```

## Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `project_name` | Project name | `ecom-spa` |
| `environment` | Environment | `dev`, `staging`, `prod` |
| `aws_region` | AWS region | `us-west-2` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `vpc_cidr` | `10.0.0.0/16` | VPC CIDR block |
| `db_instance_class` | `db.t3.micro` | RDS instance class |
| `db_allocated_storage` | `20` | RDS storage (GB) |
| `jwt_secret_key` | `change-this...` | JWT secret key |

## Deployment Process

### Step 1: Build and Push Images

Before deploying, build and push Docker images to ECR:

```bash
# Get ECR login token
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com

# Build and push product service
docker build -t ecom-spa-dev-product-service ./backend/product-service
docker tag ecom-spa-dev-product-service:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/ecom-spa-dev-product-service:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/ecom-spa-dev-product-service:latest

# Build and push cart service
docker build -t ecom-spa-dev-cart-service ./backend/cart-service
docker tag ecom-spa-dev-cart-service:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/ecom-spa-dev-cart-service:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/ecom-spa-dev-cart-service:latest

# Build and push frontend
docker build -t ecom-spa-dev-frontend ./frontend
docker tag ecom-spa-dev-frontend:latest <account-id>.dkr.ecr.us-west-2.amazonaws.com/ecom-spa-dev-frontend:latest
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/ecom-spa-dev-frontend:latest
```

### Step 2: Deploy Infrastructure

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### Step 3: Initialize Database

After deployment, initialize the databases:

```bash
# Get RDS endpoint from outputs
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)

# Connect and create databases
psql -h $RDS_ENDPOINT -U ecom -d postgres -c "CREATE DATABASE IF NOT EXISTS ecom_products;"
psql -h $RDS_ENDPOINT -U ecom -d postgres -c "CREATE DATABASE IF NOT EXISTS ecom_carts;"
```

## Outputs

After successful deployment, Terraform will output:

- **application_url**: Main application URL
- **alb_dns_name**: Load balancer DNS name
- **ecr_repositories**: ECR repository URLs
- **rds_endpoint**: Database endpoint (sensitive)

## Security Considerations

### Production Deployment

For production deployments:

1. **Enable deletion protection** on RDS
2. **Use AWS Secrets Manager** for sensitive data
3. **Enable WAF** on the load balancer
4. **Configure proper backup policies**
5. **Set up monitoring and alerting**
6. **Use HTTPS** with ACM certificates

### Network Security

- **Private subnets** for ECS tasks and RDS
- **Security groups** with minimal required access
- **NAT gateways** for outbound internet access
- **No direct internet access** to backend services

## Monitoring and Logging

### CloudWatch Integration

- **Container logs** sent to CloudWatch Logs
- **Performance Insights** enabled on RDS
- **ECS service metrics** available in CloudWatch

### Health Checks

- **Application Load Balancer** health checks
- **ECS task** health checks
- **RDS monitoring** and automated backups

## Scaling

### Auto Scaling

The infrastructure supports auto scaling:

- **ECS services** can scale based on CPU/memory
- **RDS** supports read replicas for read scaling
- **Application Load Balancer** distributes traffic

### Capacity Planning

Default resource allocation:

- **ECS tasks**: 256 CPU, 512MB memory
- **RDS**: db.t3.micro, 20GB storage
- **Min/Max tasks**: 1-10 with desired count of 2

## Cost Optimization

### Development Environment

For development:
- Use **t3.micro** instances
- Enable **FARGATE_SPOT** for cost savings
- Set **retention policies** on logs
- Use **lifecycle policies** on ECR

### Production Environment

For production:
- Use **Reserved Instances** for predictable workloads
- Enable **RDS Performance Insights**
- Set up **proper monitoring** to optimize resource usage

## Troubleshooting

### Common Issues

1. **ECS tasks failing to start**
   - Check CloudWatch logs
   - Verify security group rules
   - Ensure ECR images are available

2. **Database connection errors**
   - Verify database credentials
   - Check security group rules
   - Ensure RDS is in correct subnets

3. **Load balancer health check failures**
   - Verify health check endpoints
   - Check task security groups
   - Review application logs

### Debugging Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster <cluster-name> --services <service-name>

# View ECS task logs
aws logs get-log-events --log-group-name "/ecs/<service-name>"

# Check load balancer target health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>
```

## Cleanup

To destroy the infrastructure:

```bash
terraform destroy
```

**Note**: This will delete all resources including the database. Make sure to backup any important data before destroying.

## Advanced Configuration

### Custom Domain

To use a custom domain:

1. Create ACM certificate
2. Set `domain_name` and `certificate_arn` variables
3. Update DNS to point to ALB

### Multi-Environment

For multiple environments:

1. Use separate state files
2. Use environment-specific variable files
3. Consider using Terraform workspaces

### CI/CD Integration

For automated deployments:

1. Store Terraform state in S3
2. Use GitHub Actions or similar for automation
3. Implement proper secret management