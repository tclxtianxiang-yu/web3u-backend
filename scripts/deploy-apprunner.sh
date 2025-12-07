#!/usr/bin/env bash
set -euo pipefail

# 自动加载本地 .env（如存在），减少手工 export
if [ -f ".env" ]; then
  echo "==> Loading .env ..."
  set -a
  source .env
  set +a
fi

# Required env vars: AWS_REGION, AWS_ACCOUNT_ID (will be auto-fetched if empty), ECR_REPO, IMAGE_TAG
# App Runner service name: APP_RUNNER_SERVICE (default: web3u-backend)
# App Runner ECR access role: APP_RUNNER_ECR_ROLE (e.g., arn:aws:iam::<ACCOUNT_ID>:role/service-role/AppRunnerECRAccessRole)
#
# Required app env vars (export before running):
# SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
# SEPOLIA_RPC_URL, BACKEND_SIGNER_PRIVATE_KEY
# YD_TOKEN_ADDRESS, STUDENT_CERTIFICATE_ADDRESS, TEACHER_BADGE_ADDRESS, COURSE_REGISTRY_ADDRESS, COURSE_PLATFORM_ADDRESS
# AWS_S3_ACCESS_KEY_ID, AWS_S3_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME, AWS_S3_REGION, AWS_S3_PUBLIC_BASE_URL

AWS_REGION="${AWS_REGION:-ap-southeast-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}"
ECR_REPO="${ECR_REPO:-web3u-backend}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"
APP_RUNNER_SERVICE="${APP_RUNNER_SERVICE:-web3u-backend}"
APP_RUNNER_ECR_ROLE="${APP_RUNNER_ECR_ROLE:-arn:aws:iam::$AWS_ACCOUNT_ID:role/service-role/AppRunnerECRAccessRole}"

echo "==> Region: $AWS_REGION"
echo "==> Account: $AWS_ACCOUNT_ID"
echo "==> ECR repo: $ECR_URI"
echo "==> App Runner service: $APP_RUNNER_SERVICE"

echo "==> Creating ECR repo (idempotent)..."
aws ecr create-repository --repository-name "$ECR_REPO" --region "$AWS_REGION" >/dev/null 2>&1 || true

echo "==> ECR login..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_URI"

echo "==> Ensuring buildx builder (for linux/amd64)..."
docker buildx inspect web3u-builder >/dev/null 2>&1 || docker buildx create --name web3u-builder --use
docker buildx use web3u-builder

echo "==> Building & pushing image (linux/amd64)..."
docker buildx build --platform linux/amd64 -t "$ECR_URI:$IMAGE_TAG" --push .

echo "==> Preparing App Runner source config..."
cat > /tmp/apprunner-source.json <<EOF
{
  "ImageRepository": {
    "ImageIdentifier": "$ECR_URI:$IMAGE_TAG",
    "ImageRepositoryType": "ECR",
    "ImageConfiguration": {
      "Port": "3000",
      "RuntimeEnvironmentVariables": {
        "NODE_ENV": "production",
        "PORT": "3000",
        "SUPABASE_URL": "${SUPABASE_URL:?}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY:?}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY:?}",
        "DATABASE_URL": "${DATABASE_URL:?}",
        "SEPOLIA_RPC_URL": "${SEPOLIA_RPC_URL:?}",
        "BACKEND_SIGNER_PRIVATE_KEY": "${BACKEND_SIGNER_PRIVATE_KEY:?}",
        "YD_TOKEN_ADDRESS": "${YD_TOKEN_ADDRESS:?}",
        "STUDENT_CERTIFICATE_ADDRESS": "${STUDENT_CERTIFICATE_ADDRESS:?}",
        "TEACHER_BADGE_ADDRESS": "${TEACHER_BADGE_ADDRESS:?}",
        "COURSE_REGISTRY_ADDRESS": "${COURSE_REGISTRY_ADDRESS:?}",
        "COURSE_PLATFORM_ADDRESS": "${COURSE_PLATFORM_ADDRESS:?}",
        "AWS_S3_ACCESS_KEY_ID": "${AWS_S3_ACCESS_KEY_ID:?}",
        "AWS_S3_SECRET_ACCESS_KEY": "${AWS_S3_SECRET_ACCESS_KEY:?}",
        "AWS_S3_BUCKET_NAME": "${AWS_S3_BUCKET_NAME:?}",
        "AWS_S3_REGION": "${AWS_S3_REGION:?}",
        "AWS_S3_PUBLIC_BASE_URL": "${AWS_S3_PUBLIC_BASE_URL:-}",
        "JWT_SECRET": "${JWT_SECRET:?}"
      }
    }
  },
  "AuthenticationConfiguration": {
    "AccessRoleArn": "$APP_RUNNER_ECR_ROLE"
  }
}
EOF

SERVICE_ARN=$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$APP_RUNNER_SERVICE'].ServiceArn" --output text --region "$AWS_REGION" || true)

echo "==> Creating/Updating App Runner service..."
if [ -z "$SERVICE_ARN" ] || [ "$SERVICE_ARN" = "None" ]; then
  aws apprunner create-service \
    --service-name "$APP_RUNNER_SERVICE" \
    --source-configuration file:///tmp/apprunner-source.json \
    --instance-configuration "Cpu=1 vCPU,Memory=2 GB" \
    --region "$AWS_REGION"
else
  aws apprunner update-service \
    --service-arn "$SERVICE_ARN" \
    --source-configuration file:///tmp/apprunner-source.json \
    --instance-configuration "Cpu=1 vCPU,Memory=2 GB" \
    --region "$AWS_REGION"
fi

echo "==> Done. Fetching service URL..."
aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$APP_RUNNER_SERVICE'].ServiceUrl" --output text --region "$AWS_REGION"
