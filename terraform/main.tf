terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }

  # Uncomment and configure for remote state
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "ecom-spa/terraform.tfstate"
  #   region = "us-west-2"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ecom-spa"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"
  
  project_name        = var.project_name
  environment        = var.environment
  availability_zones = data.aws_availability_zones.available.names
  vpc_cidr          = var.vpc_cidr
}

# Security Groups
module "security_groups" {
  source = "./modules/security"
  
  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

# RDS Database
module "rds" {
  source = "./modules/rds"
  
  project_name           = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  database_subnet_ids   = module.vpc.database_subnet_ids
  security_group_ids    = [module.security_groups.rds_security_group_id]
  db_instance_class     = var.db_instance_class
  db_allocated_storage  = var.db_allocated_storage
  db_username           = var.db_username
  db_password           = random_password.db_password.result
}

# ECS Cluster
module "ecs" {
  source = "./modules/ecs"
  
  project_name = var.project_name
  environment  = var.environment
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"
  
  project_name       = var.project_name
  environment        = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  security_group_ids = [module.security_groups.alb_security_group_id]
}

# ECR Repositories
module "ecr" {
  source = "./modules/ecr"
  
  project_name = var.project_name
  environment  = var.environment
}

# ECS Services
module "services" {
  source = "./modules/services"
  
  project_name            = var.project_name
  environment            = var.environment
  ecs_cluster_id         = module.ecs.cluster_id
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  alb_target_group_arns  = module.alb.target_group_arns
  alb_listener_arns      = module.alb.listener_arns
  
  # ECR Repository URLs
  product_service_image = "${module.ecr.product_service_repository_url}:latest"
  cart_service_image    = "${module.ecr.cart_service_repository_url}:latest"
  frontend_image        = "${module.ecr.frontend_repository_url}:latest"
  
  # Database Configuration
  db_host              = module.rds.db_endpoint
  db_port              = module.rds.db_port
  db_username          = var.db_username
  db_password          = random_password.db_password.result
  
  # Security Groups
  ecs_security_group_id = module.security_groups.ecs_security_group_id
  
  # Application Configuration
  jwt_secret_key = var.jwt_secret_key
  
  depends_on = [
    module.rds,
    module.alb
  ]
}