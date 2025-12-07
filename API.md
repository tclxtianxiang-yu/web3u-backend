# Web3 University 后端接口文档 (GraphQL)

> 目的：让产品、前端和运营清晰理解后端提供的能力、字段含义与调用示例。  
> 访问入口：`http://localhost:3000/graphql`（开发环境，见 `backend/.env` 的 `PORT`）。

## 总览
- 接口协议：GraphQL（Query 查询；Mutation 写操作）。
- 认证：当前无链上签名校验，依赖调用方传入的钱包地址。生产环境建议按需增加鉴权/签名。
- 主要功能域：
  - 用户（钱包即账号）
  - 课程（课程与课时）
  - 学习记录（进度/观看时长）
  - 交易记录（链上/链下记账）
  - 链上写操作（由后端 signer 调用合约完成证书、发徽章）

## Schema 速览
常用类型（部分字段说明）：
- `User`：`walletAddress` 钱包即用户主键；`ydTokenBalance` YD 余额（业务侧可同步链上）。
- `Course`：`priceYd` 课程价（18 位精度的业务整数存储后转 float）；`status` draft/published/archived。
- `CourseLesson`：课时；`isFree` 是否试看。
- `LearningRecord`：进度与观看时长，按用户-课程-课时唯一。
- `Transaction`：交易记录；`transactionType` 取值 `course_purchase | teacher_payment | token_purchase | withdrawal`；`status` `pending | completed | failed`。

## Queries（读）
### 1) 用户
- `users`: 获取全部用户。
- `user(walletAddress: String!)`: 根据钱包查用户。

示例：
```graphql
query {
  user(walletAddress: "0x123") {
    walletAddress
    username
    role
    ydTokenBalance
  }
}
```

### 2) 课程
- `courses(teacherWalletAddress?, status?, category?)`: 过滤课程列表。
- `course(id: ID!)`: 课程详情。
- `courseLessons(courseId: ID!)`: 课程的课时列表（按 lessonNumber 升序）。

示例：
```graphql
query {
  courses(status: "published") {
    id
    title
    priceYd
    status
  }
}
```

### 3) 学习记录
- `learningRecords(userWalletAddress?, courseId?)`: 按用户或课程过滤学习记录。
- `learningRecord(id: ID!)`: 单条学习记录。

### 4) 交易记录
- `transactions(walletAddress?)`: 查询交易，支持用钱包过滤（from 或 to 任一匹配）。
- `transaction(id: ID!)`: 单条交易。

## Mutations（写）
### 1) 用户
- `createUser(createUserInput)`: 新增用户。
- `updateUser(walletAddress, updateUserInput)`: 更新用户名/邮箱/余额。
- `removeUser(walletAddress)`: 删除用户。

示例：
```graphql
mutation {
  createUser(createUserInput: {
    walletAddress: "0xabc"
    username: "Alice"
    email: "alice@example.com"
    role: "student"
  }) {
    walletAddress
    username
  }
}
```

### 2) 课程
- `createCourse(createCourseInput)`: 创建课程（默认 status = draft）。
  - 必填：`title`, `priceYd`, `teacherWalletAddress`
  - 选填：`description`, `category`, `thumbnailUrl`, `videoUrl`, `status`

示例：
```graphql
mutation {
  createCourse(createCourseInput:{
    title:"Solidity 101"
    description:"入门课程"
    teacherWalletAddress:"0xteacher"
    priceYd:100
    status:"draft"
  }) { id title status }
}
```

### 3) 学习记录
- `createLearningRecord(createLearningRecordInput)`: 新增观看记录。
- `updateLearningRecord(id, updateLearningRecordInput)`: 更新进度/时长/完成状态。

示例：
```graphql
mutation {
  updateLearningRecord(
    id:"record-id",
    updateLearningRecordInput:{ progressPercentage: 80, completed: true }
  ) {
    id
    progressPercentage
    completed
  }
}
```

### 4) 交易记录
- `createTransaction(createTransactionInput)`: 记录一笔交易（链上/链下皆可；传入 hash 可追溯）。
- `updateTransactionStatus(id, status)`: 更新状态（pending/completed/failed）。

示例：
```graphql
mutation {
  createTransaction(createTransactionInput:{
    fromWalletAddress:"0xstudent"
    toWalletAddress:"0xteacher"
    amountYd:100
    transactionType:"course_purchase"
    transactionHash:"0xabc..."
    metadata:{ courseId:"course-123" }
  }) {
    id
    status
  }
}
```

### 5) 上传（视频直传 AWS S3）
- `generateVideoUploadUrl(input: { fileName, contentType })`: 生成 PUT 直传签名 URL，前端可直接用该 URL 上传到 S3；返回 `uploadUrl`（带签名）、`key`（对象键）、`publicUrl`（可用于播放/访问）。需要携带登录后的 `Authorization: Bearer <token>`。

### 6) 登录 / 鉴权
- `login(input: { walletAddress, message, signature })`: 钱包签名登录，返回 JWT。签名消息格式：`Login to Web3 University:<timestamp_ms>`（允许 5 分钟内的时间偏差）。前端拿到 JWT 后，后续调用需要鉴权的 Mutation（上传、链上写操作）时在请求头带上 `Authorization: Bearer <token>`。

### 7) 链上写操作（后端 signer 调用 CoursePlatform 合约）
> 注意：这两个 Mutation 需要后端环境配置好 RPC、合约地址和私钥；调用后会真的发链上交易（目前主分支为单元测试环境 mock，生产请确认环境）。

- `completeCourseOnchain(input)`: 学生完成课程 → 铸造证书 NFT  
  校验流程：检查 `hasPurchased`（CoursePlatform）→ 检查 `hasCertificate`（StudentCertificate）→ 调用 `completeCourse`。  
  入参：`studentAddress`, `courseId`, `metadataURI`（证书元数据）。

- `awardTeacherBadgeOnchain(input)`: 课程评分达标 → 铸造教师徽章 NFT  
  校验流程：检查 `hasBadge`（TeacherBadge）→ 调用 `awardTeacherBadge`。  
  入参：`teacherAddress`, `courseId`, `ratingScore(80-100)`, `metadataURI`。

示例：
```graphql
mutation {
  completeCourseOnchain(input:{
    studentAddress:"0xstudent"
    courseId:"course-123"
    metadataURI:"https://metadata.example/cert/123"
  }) {
    transactionHash
    status
    blockNumber
    chainId
  }
}
```

## 环境变量速查（链上相关）
- `SEPOLIA_RPC_URL`：RPC 节点。
- `BACKEND_SIGNER_PRIVATE_KEY`：后端 signer 私钥（需与合约 backendSigner 地址一致）。
- 合约地址：`COURSE_PLATFORM_ADDRESS` / `STUDENT_CERTIFICATE_ADDRESS` / `TEACHER_BADGE_ADDRESS` / `YD_TOKEN_ADDRESS` / `COURSE_REGISTRY_ADDRESS`。

## 前端集成提示
- GraphQL 调用可通过 Apollo/urql/fetch；链上操作 Mutation 会返回 `transactionHash` 可用于前端轮询/展示。
- 金额 `priceYd`/`amountYd` 为小数型；链上实际使用需用 `parseUnits` 转换（18 位精度）。
- 课程状态：`draft` → `published` → `archived`，前端可基于 `status` 控制展示/购买入口。

## 面向非技术角色的简要解读
- “用户” = 钱包地址为身份；可记录昵称/邮箱，余额字段可用来同步链上数据或做镜像展示。
- “课程/课时” = 课程目录和内容基础信息；价格字段用来驱动购买/交易。
- “学习记录” = 跟踪用户对课时的观看进度，支撑“已学完/未学完”体验。
- “交易” = 平台的账务记录，可对标链上交易或 Off-chain 结算。
- “链上写操作” = 后端持有平台私钥，负责在学生完成课程时铸造证书 NFT，在教师评分达标时铸造徽章 NFT，以确保链上资产由平台可信主体发放。
