# MinIO Setup Guide for Local Development

## Overview

MinIO is an S3-compatible object storage server that allows you to develop and test S3 integration locally without needing an AWS account. This guide explains how to set up and use MinIO for recipe image storage in local development.

## Why MinIO?

- **S3-Compatible**: Uses the same AWS SDK, so your code works identically in production
- **Local Development**: No cloud costs during development
- **Fast**: Runs locally for instant feedback
- **Production-Like**: Test the same workflows you'll use in production

## Setup with Docker Compose

MinIO is already configured in `docker-compose.yml`:

```yaml
minio:
  image: minio/minio:latest
  container_name: recipe-minio
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin
  ports:
    - "9000:9000"  # API
    - "9001:9001"  # Web Console
  volumes:
    - minio_data:/data
  networks:
    - recipe-network
  command: server /data --console-address ":9001"
```

## Starting MinIO

### Option 1: Start all services

```bash
docker-compose up
```

### Option 2: Start MinIO only

```bash
docker-compose up minio
```

## Accessing MinIO

### Web Console

After starting MinIO, access the web console at:

**URL**: http://localhost:9001

**Credentials**:
- Username: `minioadmin`
- Password: `minioadmin`

### Creating a Bucket

1. Open the MinIO console at http://localhost:9001
2. Log in with the credentials above
3. Click "Create Bucket"
4. Name: `recipe-images`
5. Click "Create Bucket"
6. Click on the bucket, go to "Access Policy"
7. Set policy to **"public"** (or configure custom policy for read-only access to images)

Alternatively, create the bucket programmatically:

```bash
# Install MinIO client
brew install minio/stable/mc  # macOS
# or
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configure
mc alias set local http://localhost:9000 minioadmin minioadmin

# Create bucket
mc mb local/recipe-images

# Set public read policy
mc anonymous set download local/recipe-images
```

## Environment Configuration

### Local Development with MinIO

Update `backend/.env`:

```env
# Storage Provider: 'local' for filesystem, 's3' for AWS S3/MinIO
STORAGE_PROVIDER=s3

# MinIO Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET=recipe-images
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_ENDPOINT=http://localhost:9000
AWS_FORCE_PATH_STYLE=true
```

### Local Development with Local Storage (Fallback)

If you don't want to use MinIO, use local file storage:

```env
# Storage Provider
STORAGE_PROVIDER=local

# Upload directory
UPLOAD_DIR=./uploads
```

### Production with AWS S3

```env
# Storage Provider
STORAGE_PROVIDER=s3

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_S3_BUCKET=family-recipes-images-prod
AWS_ACCESS_KEY_ID=your-actual-access-key
AWS_SECRET_ACCESS_KEY=your-actual-secret-key
# Optional: Use CloudFront for CDN
AWS_CLOUDFRONT_URL=https://d1234567890.cloudfront.net
```

## Image URLs

### With MinIO (local)
```
http://localhost:9000/recipe-images/recipes/1234567890-uuid.jpg
```

### With Local Storage
```
http://localhost:5000/uploads/recipes/1234567890-uuid.jpg
```

### With AWS S3 (production)
```
https://family-recipes-images-prod.s3.us-east-1.amazonaws.com/recipes/1234567890-uuid.jpg
```

### With CloudFront (production + CDN)
```
https://d1234567890.cloudfront.net/recipes/1234567890-uuid.jpg
```

## Testing Image Upload

### Using cURL

```bash
# Upload a final product image
curl -X POST http://localhost:5000/api/recipes/{recipe-id}/images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "altText=Delicious final product" \
  -F "isPrimary=true" \
  -F "orderIndex=0"

# Upload a step image
curl -X POST http://localhost:5000/api/recipes/{recipe-id}/images \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/step-image.jpg" \
  -F "altText=Step 1: Mix ingredients" \
  -F "instructionId={instruction-id}"

# Delete an image
curl -X DELETE http://localhost:5000/api/recipes/images/{image-id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using the Frontend

Once the frontend is updated, you can upload images directly through the recipe creation/edit forms.

## Troubleshooting

### MinIO not starting

**Error**: Connection refused to localhost:9000

**Solution**:
```bash
# Check if MinIO is running
docker ps | grep minio

# Check logs
docker-compose logs minio

# Restart MinIO
docker-compose restart minio
```

### Bucket not found

**Error**: "The specified bucket does not exist"

**Solution**: Create the bucket via the web console or CLI (see "Creating a Bucket" above)

### Permission denied

**Error**: "Access Denied"

**Solution**:
1. Check that bucket policy is set to public (for read access)
2. Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env

### Images not accessible

**Error**: 404 when accessing image URL

**Solution**:
1. Verify the bucket exists and has public read policy
2. Check AWS_ENDPOINT is correct (http://localhost:9000)
3. Verify AWS_FORCE_PATH_STYLE=true in .env

## Production Deployment

### AWS S3 Setup

1. **Create S3 Bucket**:
   - Name: `family-recipes-images-prod`
   - Region: `us-east-1` (or your preferred region)
   - Block all public access: **OFF** (images need to be public)

2. **Set Bucket Policy** for public read access:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::family-recipes-images-prod/*"
       }
     ]
   }
   ```

3. **Create IAM User** for backend:
   - Create user: `recipe-backend-uploader`
   - Attach policy:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": [
             "s3:PutObject",
             "s3:GetObject",
             "s3:DeleteObject",
             "s3:ListBucket"
           ],
           "Resource": [
             "arn:aws:s3:::family-recipes-images-prod",
             "arn:aws:s3:::family-recipes-images-prod/*"
           ]
         }
       ]
     }
     ```
   - Save Access Key ID and Secret Access Key

4. **Optional: CloudFront CDN**:
   - Create CloudFront distribution
   - Origin: S3 bucket
   - Set `AWS_CLOUDFRONT_URL` in production .env

## Image Optimization

The upload service automatically optimizes images:

- **JPEG**: Quality 85%, progressive encoding
- **PNG**: Maximum compression (level 9)
- **WebP**: Quality 85%
- **Resizing**: Images can be resized on upload (see uploadService.ts)

## Security Considerations

### Production Checklist

- [ ] Use IAM user with minimal permissions (PutObject, GetObject, DeleteObject only)
- [ ] Never commit AWS credentials to git
- [ ] Use environment variables for all secrets
- [ ] Enable S3 bucket versioning for disaster recovery
- [ ] Set up S3 lifecycle rules to delete old/unused images
- [ ] Consider using signed URLs for private recipes
- [ ] Enable CloudFront for better performance and security
- [ ] Set CORS policy on S3 bucket if serving images cross-origin

### CORS Configuration for S3

If serving images from a different domain:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["https://your-frontend-domain.com"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

## Monitoring

### MinIO Health Check

```bash
curl http://localhost:9000/minio/health/live
```

### S3 Monitoring (Production)

- CloudWatch metrics for S3 requests, errors, latency
- S3 bucket logging for audit trail
- CloudFront logs for CDN performance

## Resources

- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
