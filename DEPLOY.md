# Web3 University Backend 部署指南

本项目为 NestJS + GraphQL 服务，依赖 Supabase、AWS S3（视频直传）和链上 RPC（Sepolia）。默认监听 `PORT=3000`。

## 环境准备
1) **先决条件**：安装并配置 `aws cli`，账号具备 ECR / App Runner / S3 权限。  
2) **Node**：本地构建镜像用，推荐 Node 20+。  
3) **依赖安装**：`cd backend && npm install`。  
4) **环境变量**：基于 `.env.example` 复制 `.env`，填入 Supabase、链上、S3、PORT、JWT_SECRET 等。  

## 一键部署到 AWS App Runner（CLI）
脚本：`npm run deploy:apprunner`（底层执行 `scripts/deploy-apprunner.sh`，会自动加载当前目录的 `.env`）

### 运行前需要的环境变量
- 基础：`AWS_REGION`（默认 ap-southeast-1）、`ECR_REPO`（默认 web3u-backend）、`IMAGE_TAG`（默认 latest）
- App Runner：`APP_RUNNER_SERVICE`（默认 web3u-backend）、`APP_RUNNER_ECR_ROLE`（默认 arn:aws:iam::<ACCOUNT_ID>:role/service-role/AppRunnerECRAccessRole）
- 应用必填：`SUPABASE_URL`、`SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`DATABASE_URL`、`SEPOLIA_RPC_URL`、`BACKEND_SIGNER_PRIVATE_KEY`、`YD_TOKEN_ADDRESS`、`STUDENT_CERTIFICATE_ADDRESS`、`TEACHER_BADGE_ADDRESS`、`COURSE_REGISTRY_ADDRESS`、`COURSE_PLATFORM_ADDRESS`、`AWS_S3_ACCESS_KEY_ID`、`AWS_S3_SECRET_ACCESS_KEY`、`AWS_S3_BUCKET_NAME`、`AWS_S3_REGION`、`JWT_SECRET`
- 可选：`AWS_S3_PUBLIC_BASE_URL`

### 执行
```bash
cd backend
npm run deploy:apprunner
```
脚本流程：创建 ECR 仓库（幂等）→ 登录 ECR → 构建并推送镜像 → 创建/更新 App Runner 服务（端口 3000，自动 HTTPS）→ 输出服务 URL。

## AWS S3 直传配置
- 填好 AWS 凭证、Bucket 名、Region 与可选的公共访问域名/CDN。  
- GraphQL Mutation `generateVideoUploadUrl` 会生成带签名的 PUT URL，前端可直接上传视频到 S3，并拿到可播放的 `publicUrl`。

## 链上调用说明
- 需要有效的 Sepolia RPC 与 `BACKEND_SIGNER_PRIVATE_KEY`（与合约 backendSigner 对应）。  
- 两个链上 Mutation：`completeCourseOnchain`（铸证书）、`awardTeacherBadgeOnchain`（铸徽章）。

## 运行时入口
- 容器启动命令：`node dist/main`，暴露端口 3000，GraphQL 路径 `/graphql`。
