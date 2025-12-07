# Web3 University Backend

NestJS GraphQL API backend for Web3 University platform using Supabase as the database.

## Tech Stack

- **Framework**: NestJS
- **API**: GraphQL with Apollo Server
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript

## Project Structure

```
backend/
├── src/
│   ├── user/              # User module (wallet-based authentication)
│   ├── course/            # Course management module
│   ├── transaction/       # YD token transaction module
│   ├── learning-record/   # Course learning progress tracking
│   ├── supabase/          # Supabase client configuration
│   ├── app.module.ts      # Main application module
│   └── main.ts            # Application entry point
├── database/
│   └── schema.sql         # Database schema
└── package.json
```

## Database Design

The database uses **wallet addresses as the primary key** for user identification, following Web3 best practices.

### Main Tables
- **users**: User information (wallet_address as PK)
- **courses**: Course catalog
- **course_lessons**: Individual lessons within courses
- **transactions**: YD token transactions
- **learning_records**: User learning progress
- **nft_certificates**: NFT certificates for completed courses
- **teacher_nft_badges**: NFT badges for teachers

### Junction Tables
- **user_courses**: User enrollment tracking
- **course_transactions**: Course purchase transactions
- **user_transactions**: User transaction history

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure environment variables:
```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_database_url

# Blockchain (Sepolia)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
BACKEND_SIGNER_PRIVATE_KEY=0xyour_backend_signer_private_key

# Contract addresses
YD_TOKEN_ADDRESS=0x7866993488642d92c3B0f78d79aba511fdd947C1
STUDENT_CERTIFICATE_ADDRESS=0xB3a57E86DF7D86FDc9Ef913a295EF94d93D349fa
TEACHER_BADGE_ADDRESS=0x10BEeb97F2cE91442cBb60be3353a40791BD5C00
COURSE_REGISTRY_ADDRESS=0xb48079bF33066F893E269ae1573FFE2A21Bf63aF
COURSE_PLATFORM_ADDRESS=0x14d9DC7C093271e4D0D065FB7F15596fc5305942

# Cloudflare R2
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_r2_bucket
R2_PUBLIC_BASE_URL= # 可选，若有自定义 CDN/域名
```

4. Set up database schema in Supabase:
- Go to Supabase SQL Editor
- Run the SQL from `database/schema.sql`

## Running the Application

Development mode:
```bash
npm run start:dev
```

Production build:
```bash
npm run build
npm run start:prod
```

## GraphQL API

Once running, access the GraphQL Playground at:
```
http://localhost:3000/graphql
```

### On-chain mutations

**完成课程并铸造证书**
```graphql
mutation {
  completeCourseOnchain(input: {
    studentAddress: "0xStudent"
    courseId: "course-123"
    metadataURI: "https://metadata.example/cert/123"
  }) {
    transactionHash
    status
    blockNumber
    chainId
  }
}
```

**发放教师徽章**
```graphql
mutation {
  awardTeacherBadgeOnchain(input: {
    teacherAddress: "0xTeacher"
    courseId: "course-123"
    ratingScore: 92
    metadataURI: "https://metadata.example/badge/123"
  }) {
    transactionHash
    status
    blockNumber
    chainId
  }
}
```

### Example Queries

**Get all courses:**
```graphql
query {
  courses {
    id
    title
    priceYd
    rating
    totalStudents
  }
}
```

**Get user by wallet address:**
```graphql
query {
  user(walletAddress: "0x123...") {
    walletAddress
    username
    role
    ydTokenBalance
  }
}
```

**Create a course:**
```graphql
mutation {
  createCourse(createCourseInput: {
    title: "Solidity Basics"
    description: "Learn Solidity from scratch"
    teacherWalletAddress: "0x123..."
    priceYd: 100
    category: "Solidity"
    status: "published"
  }) {
    id
    title
  }
}
```

**Track learning progress:**
```graphql
mutation {
  updateLearningRecord(
    id: "record-id"
    updateLearningRecordInput: {
      watchTime: 300
      progressPercentage: 50
      completed: false
    }
  ) {
    id
    progressPercentage
  }
}
```

### 上传直传签名 (AWS S3)
```graphql
mutation {
  generateVideoUploadUrl(input: {
    fileName: "lesson.mp4"
    contentType: "video/mp4"
  }) {
    uploadUrl
    key
    publicUrl
  }
}
```
> 需要先调用 login 获取 JWT，并在请求头添加 `Authorization: Bearer <token>`

### 钱包签名登录
```graphql
mutation {
  login(input:{
    walletAddress:"0xabc"
    message:"Login to Web3 University:1700000000000"
    signature:"0x..."
  }) {
    token
  }
}
```
前端流程：构造含时间戳的消息 -> 钱包签名 -> 调用 login 交换 JWT -> 后续在需要鉴权的 Mutation 头部带 `Authorization: Bearer <token>`。

## Features

- ✅ User management with wallet address as primary key
- ✅ Course catalog and lesson management
- ✅ YD token transaction tracking
- ✅ Learning progress tracking per lesson
- ✅ Course reviews and ratings
- ✅ NFT certificate tracking (on-chain data)
- ✅ Teacher NFT badge system
- ✅ 后端通过 viem 调用 CoursePlatform 合约 (completeCourse / awardTeacherBadge)
- ✅ 生成 AWS S3 视频直传签名，支持前端直接上传
- ✅ 钱包签名登录，敏感 Mutation 需携带 JWT
- ✅ GraphQL API with type-safe queries and mutations

## Architecture Notes

- All user operations use **wallet addresses** instead of traditional user IDs
- Supabase handles database operations with Row Level Security (RLS)
- GraphQL schema is auto-generated from TypeScript decorators
- Junction tables maintain relationships between users, courses, and transactions
