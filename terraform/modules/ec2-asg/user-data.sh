#!/bin/bash
# terraform/modules/ec2-asg/user-data.sh
# User data script for EC2 instance initialization

set -e

# Configuration from Terraform
ENVIRONMENT="${environment}"
AWS_REGION="${aws_region}"
VOLUME_ID="${volume_id}"
DB_VOLUME_DEVICE="${db_volume_device}"
DB_MOUNT_POINT="${db_mount_point}"
ECR_REPOSITORY_URL="${ecr_repository_url}"
BACKEND_IMAGE_TAG="${backend_image_tag}"

# Logging
LOG_FILE="/var/log/user-data.log"
exec > >(tee -a $LOG_FILE)
exec 2>&1

echo "=========================================="
echo "Starting user data script"
echo "Timestamp: $(date)"
echo "Environment: $ENVIRONMENT"
echo "=========================================="

# Get instance metadata
INSTANCE_ID=$(ec2-metadata --instance-id | cut -d ' ' -f 2)
AVAILABILITY_ZONE=$(ec2-metadata --availability-zone | cut -d ' ' -f 2)

echo "Instance ID: $INSTANCE_ID"
echo "Availability Zone: $AVAILABILITY_ZONE"

# Function to wait for volume availability
wait_for_volume_available() {
    local volume_id=$1
    local max_attempts=60
    local attempt=0

    echo "Waiting for volume $volume_id to be available..."

    while [ $attempt -lt $max_attempts ]; do
        local state=$(aws ec2 describe-volumes \
            --volume-ids $volume_id \
            --region $AWS_REGION \
            --query 'Volumes[0].State' \
            --output text)

        echo "Volume state: $state (attempt $attempt/$max_attempts)"

        if [ "$state" == "available" ]; then
            echo "Volume is available"
            return 0
        fi

        sleep 5
        attempt=$((attempt + 1))
    done

    echo "ERROR: Volume did not become available in time"
    return 1
}

# Function to detach volume from old instance
detach_volume_if_attached() {
    local volume_id=$1

    echo "Checking if volume $volume_id is attached to another instance..."

    local attachment_info=$(aws ec2 describe-volumes \
        --volume-ids $volume_id \
        --region $AWS_REGION \
        --query 'Volumes[0].Attachments[0]' \
        --output json)

    if [ "$attachment_info" != "null" ]; then
        local attached_instance=$(echo $attachment_info | jq -r '.InstanceId')
        local attachment_state=$(echo $attachment_info | jq -r '.State')

        echo "Volume is attached to instance: $attached_instance (state: $attachment_state)"

        if [ "$attached_instance" != "$INSTANCE_ID" ]; then
            echo "Detaching volume from old instance: $attached_instance"

            aws ec2 detach-volume \
                --volume-id $volume_id \
                --region $AWS_REGION \
                --force || true

            wait_for_volume_available $volume_id
        fi
    else
        echo "Volume is not attached to any instance"
    fi
}

# Function to attach volume to this instance
attach_volume() {
    local volume_id=$1
    local device=$2

    echo "Attaching volume $volume_id to $INSTANCE_ID at $device..."

    aws ec2 attach-volume \
        --volume-id $volume_id \
        --instance-id $INSTANCE_ID \
        --device $device \
        --region $AWS_REGION

    # Wait for attachment to complete
    local max_attempts=60
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        local state=$(aws ec2 describe-volumes \
            --volume-ids $volume_id \
            --region $AWS_REGION \
            --query 'Volumes[0].Attachments[0].State' \
            --output text)

        echo "Attachment state: $state (attempt $attempt/$max_attempts)"

        if [ "$state" == "attached" ]; then
            echo "Volume successfully attached"
            return 0
        fi

        sleep 5
        attempt=$((attempt + 1))
    done

    echo "ERROR: Volume attachment failed"
    return 1
}

# Function to wait for device to appear
wait_for_device() {
    local device=$1
    local max_attempts=60
    local attempt=0

    echo "Waiting for device $device to appear..."

    while [ $attempt -lt $max_attempts ]; do
        if [ -e "$device" ]; then
            echo "Device $device is available"
            return 0
        fi

        echo "Device not yet available (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done

    echo "ERROR: Device did not appear in time"
    return 1
}

echo "=========================================="
echo "Managing EBS volume"
echo "=========================================="

# Detach from old instance if needed
detach_volume_if_attached $VOLUME_ID

# Attach to this instance
attach_volume $VOLUME_ID $DB_VOLUME_DEVICE

# Wait for device to appear
wait_for_device $DB_VOLUME_DEVICE

echo "=========================================="
echo "Mounting EBS volume"
echo "=========================================="

# Check if volume has a filesystem
if ! blkid $DB_VOLUME_DEVICE; then
    echo "No filesystem found. Creating ext4 filesystem..."
    mkfs.ext4 $DB_VOLUME_DEVICE
else
    echo "Filesystem already exists"
    blkid $DB_VOLUME_DEVICE
fi

# Create mount point
mkdir -p $DB_MOUNT_POINT

# Mount volume
echo "Mounting $DB_VOLUME_DEVICE to $DB_MOUNT_POINT..."
mount $DB_VOLUME_DEVICE $DB_MOUNT_POINT

# Add to fstab for persistence across reboots
DEVICE_UUID=$(blkid -s UUID -o value $DB_VOLUME_DEVICE)
if ! grep -q "$DEVICE_UUID" /etc/fstab; then
    echo "Adding mount to /etc/fstab..."
    echo "UUID=$DEVICE_UUID $DB_MOUNT_POINT ext4 defaults,nofail 0 2" >> /etc/fstab
fi

# Set correct permissions for PostgreSQL
echo "Setting permissions for PostgreSQL..."
chown -R 999:999 $DB_MOUNT_POINT

echo "Volume mounted successfully"
df -h $DB_MOUNT_POINT

echo "=========================================="
echo "Installing Docker and dependencies"
echo "=========================================="

# Update system
yum update -y

# Install Docker and jq
yum install -y docker jq
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "Docker installed successfully"
docker --version
docker-compose --version

echo "=========================================="
echo "Installing CloudWatch Logs agent"
echo "=========================================="

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "/aws/ec2/$ENVIRONMENT/user-data",
            "log_stream_name": "{instance_id}"
          },
          {
            "file_path": "/opt/family-recipes/logs/*.log",
            "log_group_name": "/aws/ec2/$ENVIRONMENT/app",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

echo "=========================================="
echo "Retrieving secrets from Secrets Manager"
echo "=========================================="

mkdir -p /opt/family-recipes/secrets
chmod 700 /opt/family-recipes/secrets

# Get database credentials from Secrets Manager
echo "Fetching database credentials..."
aws secretsmanager get-secret-value \
    --secret-id "family-recipes/$ENVIRONMENT/db-credentials" \
    --region $AWS_REGION \
    --query 'SecretString' \
    --output text > /tmp/db-credentials.json

# Extract individual values
DB_USERNAME=$(jq -r '.username' /tmp/db-credentials.json)
DB_PASSWORD=$(jq -r '.password' /tmp/db-credentials.json)
DB_NAME=$(jq -r '.database' /tmp/db-credentials.json)

# Save password for Docker secret
echo -n "$DB_PASSWORD" > /opt/family-recipes/secrets/db_password.txt
chmod 600 /opt/family-recipes/secrets/db_password.txt

# Clean up temp file
rm -f /tmp/db-credentials.json

echo "Secrets retrieved successfully"

echo "=========================================="
echo "Setting up application"
echo "=========================================="

mkdir -p /opt/family-recipes/logs
cd /opt/family-recipes

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URL

# Create docker-compose.yml
cat > docker-compose.yml <<'COMPOSE_EOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: recipe-postgres
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - ${DB_MOUNT_POINT}:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    secrets:
      - db_password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - app-network

  backend:
    image: ${ECR_REPOSITORY_URL}:${BACKEND_IMAGE_TAG}
    container_name: recipe-backend
    environment:
      NODE_ENV: ${ENVIRONMENT}
      DB_HOST: postgres
      DB_PORT: 5432
      PORT: 5000
      AWS_REGION: ${AWS_REGION}
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: recipe-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - app-network

secrets:
  db_password:
    file: /opt/family-recipes/secrets/db_password.txt

networks:
  app-network:
    driver: bridge
COMPOSE_EOF

# Create NGINX config
cat > nginx.conf <<'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    upstream backend {
        server backend:5000;
    }

    server {
        listen 80;
        server_name _;

        client_max_body_size 10M;

        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        location /api {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        location / {
            return 200 "Family Recipes API Server\n";
            add_header Content-Type text/plain;
        }
    }
}
NGINX_EOF

# Create .env file with substitutions
cat > .env <<EOF
DB_USERNAME=$DB_USERNAME
DB_NAME=$DB_NAME
DB_MOUNT_POINT=$DB_MOUNT_POINT
ECR_REPOSITORY_URL=$ECR_REPOSITORY_URL
BACKEND_IMAGE_TAG=$BACKEND_IMAGE_TAG
ENVIRONMENT=$ENVIRONMENT
AWS_REGION=$AWS_REGION
EOF

echo "=========================================="
echo "Starting application"
echo "=========================================="

# Start services
docker-compose up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 15

# Check status
docker-compose ps

echo "=========================================="
echo "Running database migrations"
echo "=========================================="

# Wait for backend to be ready and run migrations
for i in {1..30}; do
    if docker-compose exec -T backend npm run migrate:latest; then
        echo "Migrations completed successfully"
        break
    fi
    echo "Waiting for backend to be ready... (attempt $i/30)"
    sleep 5
done

# Seed database (for dev/local only)
if [ "$ENVIRONMENT" != "production" ]; then
    echo "Seeding database with test data..."
    docker-compose exec -T backend npm run seed:run || true
fi

echo "=========================================="
echo "User data script completed successfully!"
echo "Timestamp: $(date)"
echo "=========================================="
