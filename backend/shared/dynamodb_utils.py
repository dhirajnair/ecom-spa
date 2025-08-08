"""
Shared DynamoDB utilities for microservices
"""
import boto3
from typing import Optional, Dict, Any
from botocore.exceptions import ClientError
import logging
from .env_config import config

logger = logging.getLogger(__name__)

def get_dynamodb_client():
    """Get DynamoDB client for local or AWS"""
    if config.DYNAMODB_ENDPOINT:
        # Local DynamoDB
        return boto3.client(
            'dynamodb',
            endpoint_url=config.DYNAMODB_ENDPOINT,
            region_name=config.AWS_REGION,
            aws_access_key_id=config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY
        )
    else:
        # AWS DynamoDB
        return boto3.client('dynamodb', region_name=config.AWS_REGION)

def get_dynamodb_resource():
    """Get DynamoDB resource for local or AWS"""
    if config.DYNAMODB_ENDPOINT:
        # Local DynamoDB
        return boto3.resource(
            'dynamodb',
            endpoint_url=config.DYNAMODB_ENDPOINT,
            region_name=config.AWS_REGION,
            aws_access_key_id=config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY
        )
    else:
        # AWS DynamoDB
        return boto3.resource('dynamodb', region_name=config.AWS_REGION)

def create_table_if_not_exists(
    table_name: str,
    key_schema: list,
    attribute_definitions: list,
    billing_mode: str = 'PAY_PER_REQUEST',
    global_secondary_indexes: Optional[list] = None
):
    """Create DynamoDB table if it doesn't exist.

    Uses list_tables for existence check to avoid noisy DescribeTable errors in DynamoDB Local logs.
    """
    dynamodb = get_dynamodb_client()

    # Prefer list_tables to avoid DescribeTable logging a server-side stack trace for missing tables
    try:
        existing_tables = set(dynamodb.list_tables().get('TableNames', []))
        if table_name in existing_tables:
            logger.info(f"Table {table_name} already exists")
            return True
    except ClientError as e:
        logger.warning(f"Failed to list tables when checking for {table_name}: {e}. Falling back to DescribeTable.")
        try:
            dynamodb.describe_table(TableName=table_name)
            logger.info(f"Table {table_name} already exists")
            return True
        except ClientError as e2:
            if e2.response['Error']['Code'] != 'ResourceNotFoundException':
                logger.error(f"Error checking table {table_name}: {e2}")
                return False

    # Create table
    logger.info(f"Creating table {table_name}")
    table_definition = {
        'TableName': table_name,
        'KeySchema': key_schema,
        'AttributeDefinitions': attribute_definitions,
        'BillingMode': billing_mode
    }

    if global_secondary_indexes:
        table_definition['GlobalSecondaryIndexes'] = global_secondary_indexes

    try:
        dynamodb.create_table(**table_definition)
        waiter = dynamodb.get_waiter('table_exists')
        waiter.wait(TableName=table_name)
        logger.info(f"Table {table_name} created successfully")
        return True
    except ClientError as create_error:
        # If another process created it in the meantime, treat as success
        error_code = create_error.response.get('Error', {}).get('Code')
        if error_code == 'ResourceInUseException':
            logger.info(f"Table {table_name} was created concurrently")
            return True
        logger.error(f"Error creating table {table_name}: {create_error}")
        return False

def safe_get_item(table, key: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Safely get item from DynamoDB table"""
    try:
        response = table.get_item(Key=key)
        return response.get('Item')
    except ClientError as e:
        logger.error(f"Error getting item: {e}")
        return None

def safe_put_item(table, item: Dict[str, Any]) -> bool:
    """Safely put item to DynamoDB table"""
    try:
        table.put_item(Item=item)
        return True
    except ClientError as e:
        logger.error(f"Error putting item: {e}")
        return False

def safe_update_item(table, key: Dict[str, Any], update_expression: str, 
                    expression_attribute_values: Dict[str, Any],
                    expression_attribute_names: Optional[Dict[str, str]] = None) -> bool:
    """Safely update item in DynamoDB table"""
    try:
        update_params = {
            'Key': key,
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_attribute_values
        }
        
        if expression_attribute_names:
            update_params['ExpressionAttributeNames'] = expression_attribute_names
            
        table.update_item(**update_params)
        return True
    except ClientError as e:
        logger.error(f"Error updating item: {e}")
        return False

def safe_delete_item(table, key: Dict[str, Any]) -> bool:
    """Safely delete item from DynamoDB table"""
    try:
        table.delete_item(Key=key)
        return True
    except ClientError as e:
        logger.error(f"Error deleting item: {e}")
        return False

def safe_scan(table, **kwargs) -> list:
    """Safely scan DynamoDB table with pagination"""
    try:
        items = []
        
        while True:
            response = table.scan(**kwargs)
            items.extend(response.get('Items', []))
            
            # Check if there are more items
            if 'LastEvaluatedKey' not in response:
                break
                
            kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        
        return items
    except ClientError as e:
        logger.error(f"Error scanning table: {e}")
        return []

def safe_query(table, **kwargs) -> list:
    """Safely query DynamoDB table with pagination"""
    try:
        items = []
        
        while True:
            response = table.query(**kwargs)
            items.extend(response.get('Items', []))
            
            # Check if there are more items
            if 'LastEvaluatedKey' not in response:
                break
                
            kwargs['ExclusiveStartKey'] = response['LastEvaluatedKey']
        
        return items
    except ClientError as e:
        logger.error(f"Error querying table: {e}")
        return []
