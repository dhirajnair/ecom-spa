# Infrastructure Cost Analysis

This document provides a detailed breakdown of the estimated monthly AWS infrastructure costs for the E-commerce SPA application.

## 🏗️ AWS Services Overview

| AWS Service | Purpose | Configuration | Monthly Cost Range |
|-------------|---------|---------------|-------------------|
| **AWS Lambda** | Compute (3 functions) | 512MB, 30s timeout, Container-based | $15 - $45 |
| **Amazon ECR** | Container Registry | 3 repositories, lifecycle policies | $3 - $10 |
| **Amazon DynamoDB** | Database | 2 tables, On-demand billing, PITR | $5 - $25 |
| **Amazon Cognito** | Authentication | User Pool + Identity Pool, Advanced Security | $0.50 - $5 |
| **Amazon API Gateway** | API Management | REST API, Regional, Cognito auth | $10 - $35 |
| **Amazon CloudWatch** | Monitoring & Logs | 14-day retention, access logging | $2 - $8 |
| **Amazon SQS** | Dead Letter Queue | Lambda error handling | $0 - $1 |
| **Data Transfer** | Networking | Outbound internet traffic | $1 - $5 |

### 💰 **Total Estimated Monthly Cost: $36.50 - $133.00**

## 📊 Cost Summary (Monthly and Annual)

| Service Category | Monthly Cost (USD) | Annual Cost (USD) |
|------------------|-------------------|-------------------|
| **Compute (Lambda)** | $15.00 - $45.00 | $180 - $540 |
| **Storage (ECR)** | $3.00 - $10.00 | $36 - $120 |
| **Database (DynamoDB)** | $5.00 - $25.00 | $60 - $300 |
| **Authentication (Cognito)** | $0.50 - $5.00 | $6 - $60 |
| **API Gateway** | $10.00 - $35.00 | $120 - $420 |
| **Monitoring (CloudWatch)** | $2.00 - $8.00 | $24 - $96 |
| **Networking (Data Transfer)** | $1.00 - $5.00 | $12 - $60 |
| **TOTAL** | **$36.50 - $133.00** | **$438 - $1,596** |

## 🔧 Infrastructure Components

### 1. AWS Lambda Functions (3 functions)
**Services:** Product Service, Cart Service, Frontend Service

**Configuration:**
- Memory: 512 MB (configurable via `lambda_memory_size`)
- Timeout: 30 seconds (configurable via `lambda_timeout`)
- Architecture: x86_64 (configurable via `lambda_architecture`)
- Runtime: Container-based

**Cost Breakdown:**
- **Low Usage (100K requests/month):** $15.00/month
  - Compute: $12.50 (100K requests × 125 GB-seconds × $0.0000166667)
  - Requests: $2.50 (100K requests × $0.0000002)
- **Medium Usage (1M requests/month):** $30.00/month
- **High Usage (3M requests/month):** $45.00/month

### 2. Amazon ECR (Elastic Container Registry)
**Services:** 3 repositories (product-service, cart-service, frontend)

**Configuration:**
- Lifecycle policy: Keep last 10 images per repository
- Image scanning: Enabled
- Force delete: Enabled for easy cleanup

**Cost Breakdown:**
- **Storage:** $3.00 - $10.00/month
  - Low: 3 GB stored × $0.10/GB = $3.00
  - High: 10 GB stored × $0.10/GB = $10.00
- **Data Transfer:** Included in Lambda costs

### 3. Amazon DynamoDB
**Tables:** Products table, Carts table

**Configuration:**
- Billing mode: PAY_PER_REQUEST (on-demand)
- Point-in-time recovery: Enabled
- Server-side encryption: Enabled
- Global Secondary Index: category-index on Products table

**Cost Breakdown:**
- **Low Usage:** $5.00/month
  - Read requests: 1M × $0.25/million = $2.50
  - Write requests: 100K × $1.25/million = $1.25
  - Storage: 1GB × $0.25/GB = $1.25
- **Medium Usage:** $15.00/month
- **High Usage:** $25.00/month

### 4. Amazon Cognito
**Services:** User Pool, Identity Pool, User Pool Domain

**Configuration:**
- MFA: Optional (configurable via `cognito_mfa_configuration`)
- Advanced security: Enforced
- Custom domain: Optional
- Password policy: Configurable

**Cost Breakdown:**
- **Monthly Active Users (MAU):**
  - First 50,000 MAUs: Free
  - 50,001 - 100,000: $0.50 - $5.00/month
- **Advanced Security Features:** $0.05 per MAU (if enabled)

### 5. Amazon API Gateway
**Configuration:**
- Type: REST API (Regional)
- Stages: 1 (prod stage)
- Custom domain: Optional
- Cognito authorizer: Enabled for protected endpoints
- CORS: Configured

**Cost Breakdown:**
- **Low Usage (100K API calls):** $10.00/month
  - API calls: 100K × $3.50/million = $0.35
  - Data transfer: Included
  - Caching: Not configured (would add $0.02/hour if enabled)
- **Medium Usage (1M API calls):** $25.00/month
- **High Usage (3M API calls):** $35.00/month

### 6. Amazon CloudWatch
**Services:** Log Groups, Metrics, Monitoring

**Configuration:**
- Log retention: 14 days for Lambda functions
- API Gateway access logging: Enabled
- Dead letter queue monitoring: SQS DLQ configured

**Cost Breakdown:**
- **Logs:** $1.00 - $5.00/month
  - Ingestion: 1-5 GB × $0.50/GB = $0.50 - $2.50
  - Storage: 1-5 GB × $0.03/GB = $0.03 - $0.15
- **Metrics:** $1.00 - $3.00/month
  - Custom metrics (if any): $0.30 per metric
  - API requests: $0.01 per 1,000 requests

### 7. Amazon SQS (Dead Letter Queue)
**Configuration:**
- Message retention: 14 days
- Used for Lambda error handling

**Cost Breakdown:**
- **Very Low Usage:** $0.00 - $1.00/month
  - Typically minimal unless there are significant errors

### 8. Data Transfer and Networking
**Services:** Internet data transfer, Regional data transfer

**Cost Breakdown:**
- **Outbound data transfer:** $1.00 - $5.00/month
  - First 1 GB/month: Free
  - Next 9.999 TB/month: $0.09/GB
  - Typical web app: 5-50 GB/month = $0.45 - $4.50

## 🎯 Assumptions

### Traffic Assumptions
- **Low Usage Scenario:**
  - 1,000 unique users/month
  - 100K API requests/month
  - 10K Lambda invocations/month per function
  - 1M DynamoDB read/write operations total
  - 5 GB data transfer/month

- **Medium Usage Scenario:**
  - 10,000 unique users/month
  - 1M API requests/month
  - 100K Lambda invocations/month per function
  - 5M DynamoDB read/write operations total
  - 25 GB data transfer/month

- **High Usage Scenario:**
  - 50,000 unique users/month
  - 3M API requests/month
  - 300K Lambda invocations/month per function
  - 15M DynamoDB read/write operations total
  - 50 GB data transfer/month

### Technical Assumptions
- **Lambda Configuration:**
  - Memory: 512 MB (default in terraform variables)
  - Average execution time: 100ms for API calls, 500ms for frontend rendering
  - No provisioned concurrency (disabled by default)
  - No VPC configuration (commented out in main.tf)

- **DynamoDB Usage:**
  - Average item size: 1KB for products, 2KB for carts
  - Read/write ratio: 80/20 for products, 50/50 for carts
  - On-demand billing (PAY_PER_REQUEST mode)

- **ECR Storage:**
  - Average image size: 500MB per service
  - 3-5 image versions kept per repository
  - Regular cleanup via lifecycle policy

### Regional Pricing
- **Region:** us-west-2 (Oregon) - specified as default in terraform variables
- **Currency:** USD
- **Pricing Date:** January 2025 (current AWS pricing)

## 💡 Cost Optimization Recommendations

### 1. **Development vs Production**
- **Development:** Use smaller Lambda memory (256MB), shorter log retention (7 days)
- **Production:** Consider provisioned concurrency for better performance if needed

### 2. **DynamoDB Optimization**
- Monitor usage patterns and consider switching to provisioned capacity if usage is predictable
- Use DynamoDB Contributor Insights to identify hot partitions
- Consider archiving old cart data

### 3. **Lambda Optimization**
- Use ARM64 architecture (`arm64`) for 20% cost savings if compatible
- Optimize memory allocation based on actual usage
- Consider Lambda@Edge for static content delivery

### 4. **ECR Optimization**
- Implement aggressive lifecycle policies for non-production environments
- Use multi-stage Docker builds to reduce image sizes
- Consider Amazon ECR Public for base images

### 5. **Monitoring and Alerting**
- Set up CloudWatch billing alarms for cost control
- Use AWS Cost Explorer for detailed cost analysis
- Implement tagging strategy for better cost attribution

## 📈 Scaling Considerations

### Auto Scaling
- **Lambda:** Automatically scales based on demand (up to 1000 concurrent executions by default)
- **DynamoDB:** On-demand scaling handles traffic spikes automatically
- **API Gateway:** No explicit scaling needed, handles high throughput

### Performance vs Cost Trade-offs
- **Provisioned Concurrency:** Reduces cold starts but increases cost by ~$13/month per provisioned execution
- **DynamoDB Provisioned Capacity:** Lower cost for predictable workloads
- **CloudFront CDN:** Could reduce API Gateway costs for static content (not included in current infrastructure)

## 🏷️ Cost Allocation Tags

The infrastructure uses consistent tagging for cost allocation:
- `Project`: "ecom-spa"
- `Environment`: "dev/staging/prod"
- `ManagedBy`: "terraform"
- `Service`: Service-specific tags

## 📝 Notes

1. **Free Tier Benefits:** New AWS accounts receive 12 months of free tier benefits that could significantly reduce costs in the first year.

2. **Reserved Capacity:** For predictable workloads, consider DynamoDB reserved capacity for additional savings.

3. **Multi-Environment:** Costs shown are per environment. Multiple environments (dev/staging/prod) would multiply these costs.

4. **Custom Domains:** SSL certificates via ACM are free, but Route 53 hosted zones add $0.50/month per domain.

5. **Backup and Disaster Recovery:** Point-in-time recovery for DynamoDB is included in the estimates but cross-region replication would add additional costs.

---

*Last Updated: January 2025*  
*AWS Region: us-west-2 (Oregon)*  
*Pricing subject to change based on AWS pricing updates*
