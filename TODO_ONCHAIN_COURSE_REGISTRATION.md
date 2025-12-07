# TODO: On-Chain Course Registration Implementation

## 问题描述

课程通过 GraphQL `createCourse` 创建后只保存到数据库，没有注册到 CourseRegistry 智能合约。学生购买时失败：
```
"CoursePlatform: course does not exist"
```

## 实施计划

### ✅ = 已完成 | 🔄 = 进行中 | ⏸️ = 待开始

### Phase 1: 授予 PLATFORM_ROLE 权限 ⏸️

- [ ] 添加 `DEPLOYER_PRIVATE_KEY` 到 `.env` 文件
- [ ] 创建脚本: `backend/scripts/grant-platform-role.ts`
- [ ] 运行脚本授予 backend signer PLATFORM_ROLE
- [ ] 验证权限授予成功

### Phase 2: 创建 CourseRegistry ABI ⏸️

- [ ] 创建文件: `backend/src/onchain/abis/course-registry.ts`
- [ ] 从合约导出 ABI (createCourse, updateCourseStatus, courseExists, getCourse, isCourseActive)

### Phase 3: 扩展 OnchainService ⏸️

- [ ] 导入 `courseRegistryAbi`
- [ ] 添加 `courseRegistryAddress` 属性
- [ ] 在 `onModuleInit()` 中初始化地址
- [ ] 实现 `createCourseOnchain()` 方法
  - 检查课程是否已存在
  - 验证价格 > 0
  - 转换价格为 wei (× 10^18)
  - 调用 `CourseRegistry.createCourse()`
  - 如需发布，调用 `updateCourseStatus(1)`

### Phase 4: 创建 DTO ⏸️

- [ ] 创建文件: `backend/src/onchain/dto/create-course-onchain.input.ts`
- [ ] 定义 `CreateCourseOnchainInput` 类
  - courseId: string
  - teacherAddress: string (验证为以太坊地址)
  - priceYd: number (最小值 0.01)
  - shouldPublish: boolean (默认 true)

### Phase 5: 更新 OnchainResolver ⏸️

- [ ] 导入 `CreateCourseOnchainInput`
- [ ] 添加 `createCourseOnchain` mutation
- [ ] 添加 `@UseGuards(GqlAuthGuard)` 保护

### Phase 6: 更新 CourseService ⏸️

- [ ] 在构造函数中注入 `OnchainService` (使用 forwardRef)
- [ ] 修改 `create()` 方法：
  - 数据库插入成功后
  - 如果 status === "published" 且 priceYd > 0
  - 调用 `onchainService.createCourseOnchain()`
  - 失败时回滚数据库删除操作

### Phase 7: 更新模块依赖 ⏸️

- [ ] 更新 `backend/src/course/course.module.ts`
  - 导入 `forwardRef(() => OnchainModule)`
- [ ] 验证 `backend/src/onchain/onchain.module.ts`
  - 确认 exports 包含 `OnchainService`

### Phase 8: 测试 ⏸️

- [ ] 启动后端服务
- [ ] 检查 GraphQL schema 包含 `createCourseOnchain` mutation
- [ ] 测试创建课程 (status: "published")
- [ ] 在 Sepolia 验证课程已注册到 CourseRegistry
- [ ] 测试学生购买流程
- [ ] 测试重复创建课程（应失败）

---

## 关键文件清单

### 新建文件 (3个)
1. `backend/scripts/grant-platform-role.ts` - 授权脚本（一次性）
2. `backend/src/onchain/abis/course-registry.ts` - CourseRegistry ABI
3. `backend/src/onchain/dto/create-course-onchain.input.ts` - GraphQL 输入类型

### 修改文件 (5个)
1. `backend/src/onchain/onchain.service.ts` - 添加 createCourseOnchain() 方法
2. `backend/src/onchain/onchain.resolver.ts` - 添加 mutation
3. `backend/src/course/course.service.ts` - 调用链上注册
4. `backend/src/course/course.module.ts` - 导入 OnchainModule
5. `backend/.env` - 添加 DEPLOYER_PRIVATE_KEY（临时，用于授权）

---

## 合约信息

- **CourseRegistry**: `0xb48079bF33066F893E269ae1573FFE2A21Bf63aF`
- **Backend Signer**: `0x9782DfAE3D5Fc38807335F15e482F3312F8C22a6`
- **Network**: Sepolia (Chain ID: 11155111)

---

## 错误处理

### 常见错误
1. **"Only platform can call"** → 运行 grant-platform-role.ts
2. **"Course already exists"** → courseId 重复
3. **"Price must be greater than 0"** → 验证价格
4. **"Course not published"** → 确保调用 updateCourseStatus(1)

### 回滚策略
链上注册失败时 → 删除数据库记录 → 返回错误给客户端

---

## 性能考虑

- **交易时间**: 每个操作约 15-30 秒
- **总耗时**: 完整注册约 30-60 秒
- **Gas 成本**:
  - createCourse: ~50,000-70,000 gas
  - updateCourseStatus: ~30,000-50,000 gas
- 后端承担所有 gas 费用

---

## 下一步

从 Phase 1 开始，按顺序完成每个阶段。
