import { Injectable, OnModuleInit } from "@nestjs/common";
import { createPublicClient, createWalletClient, http } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { courseRegistryAbi } from "./abis/course-registry";
import { coursePlatformAbi } from "./abis/course-platform";
import { studentCertificateAbi } from "./abis/student-certificate";
import { teacherBadgeAbi } from "./abis/teacher-badge";
import type { AwardTeacherBadgeInput } from "./dto/award-teacher-badge.input";
import type { CompleteCourseOnchainInput } from "./dto/complete-course.input";
import type { CreateCourseOnchainInput } from "./dto/create-course-onchain.input";
import type { OnchainTransaction } from "./entities/onchain-transaction.entity";

type HexString = `0x${string}`;

@Injectable()
export class OnchainService implements OnModuleInit {
	private walletClient: any = null;
	private publicClient: any = null;
	private backendAccount!: ReturnType<typeof privateKeyToAccount>;

	private courseRegistryAddress!: HexString;
	private coursePlatformAddress!: HexString;
	private studentCertificateAddress!: HexString;
	private teacherBadgeAddress!: HexString;

	onModuleInit() {
		const rpcUrl = process.env.SEPOLIA_RPC_URL;
		const privateKey = process.env.BACKEND_SIGNER_PRIVATE_KEY as HexString | undefined;

		this.courseRegistryAddress = this.assertHexEnv("COURSE_REGISTRY_ADDRESS");
		this.coursePlatformAddress = this.assertHexEnv("COURSE_PLATFORM_ADDRESS");
		this.studentCertificateAddress = this.assertHexEnv("STUDENT_CERTIFICATE_ADDRESS");
		this.teacherBadgeAddress = this.assertHexEnv("TEACHER_BADGE_ADDRESS");

		if (!rpcUrl) {
			throw new Error("SEPOLIA_RPC_URL 未配置");
		}
		if (!privateKey) {
			throw new Error("BACKEND_SIGNER_PRIVATE_KEY 未配置");
		}

		this.backendAccount = privateKeyToAccount(privateKey);

		this.walletClient = createWalletClient({
			account: this.backendAccount,
			chain: sepolia,
			transport: http(rpcUrl),
		} as any);

		this.publicClient = createPublicClient({
			chain: sepolia,
			transport: http(rpcUrl),
		} as any);
	}

	async completeCourse(input: CompleteCourseOnchainInput): Promise<OnchainTransaction> {
		const wallet = this.ensureWallet();
		const publicClient = this.ensurePublicClient() as any;

		const hasPurchased = await publicClient.readContract({
			address: this.coursePlatformAddress,
			abi: coursePlatformAbi,
			functionName: "hasPurchased",
			args: [input.studentAddress as HexString, input.courseId],
		});

		if (!hasPurchased) {
			throw new Error("学生未购买该课程，无法铸造证书");
		}

		const hasCertificate = await publicClient.readContract({
			address: this.studentCertificateAddress,
			abi: studentCertificateAbi,
			functionName: "hasCertificate",
			args: [input.studentAddress as HexString, input.courseId],
		});

		if (hasCertificate) {
			throw new Error("该课程证书已存在，无需重复铸造");
		}

		const hash = await wallet.writeContract({
			address: this.coursePlatformAddress,
			abi: coursePlatformAbi,
			functionName: "completeCourse",
			account: this.backendAccount,
			chain: sepolia,
			args: [input.studentAddress as HexString, input.courseId, input.metadataURI],
		} as any);

		const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

		return {
			transactionHash: hash,
			chainId: sepolia.id,
			blockNumber: receipt.blockNumber ? Number(receipt.blockNumber) : undefined,
			status: receipt.status,
		};
	}

	async awardTeacherBadge(input: AwardTeacherBadgeInput): Promise<OnchainTransaction> {
		const wallet = this.ensureWallet();
		const publicClient = this.ensurePublicClient() as any;

		const hasBadge = await publicClient.readContract({
			address: this.teacherBadgeAddress,
			abi: teacherBadgeAbi,
			functionName: "hasBadge",
			args: [input.teacherAddress as HexString, input.courseId],
		});

		if (hasBadge) {
			throw new Error("该课程的教师徽章已存在，无需重复铸造");
		}

		const hash = await wallet.writeContract({
			address: this.coursePlatformAddress,
			abi: coursePlatformAbi,
			functionName: "awardTeacherBadge",
			account: this.backendAccount,
			chain: sepolia,
			args: [input.courseId, input.ratingScore, input.metadataURI],
		} as any);

		const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

		return {
			transactionHash: hash,
			chainId: sepolia.id,
			blockNumber: receipt.blockNumber ? Number(receipt.blockNumber) : undefined,
			status: receipt.status,
		};
	}

	async createCourseOnchain(input: CreateCourseOnchainInput): Promise<OnchainTransaction> {
		const wallet = this.ensureWallet();
		const publicClient = this.ensurePublicClient() as any;

		// 检查课程是否已在链上注册
		const exists = (await publicClient.readContract({
			address: this.courseRegistryAddress,
			abi: courseRegistryAbi,
			functionName: "courseExists",
			args: [input.courseId],
		} as any)) as boolean;

		if (exists) {
			throw new Error("该课程已在链上注册，无法重复创建");
		}

		// 验证价格必须大于 0
		if (input.priceYd <= 0) {
			throw new Error("课程价格必须大于 0");
		}

		// 转换价格为 wei (18 位小数)
		const priceInWei = BigInt(Math.floor(input.priceYd * 1e18));

		// Step 1: 在 CourseRegistry 创建课程
		const createHash = await wallet.writeContract({
			address: this.courseRegistryAddress,
			abi: courseRegistryAbi,
			functionName: "createCourse",
			account: this.backendAccount,
			chain: sepolia,
			args: [input.courseId, input.teacherAddress as HexString, priceInWei],
		} as any);

		// 等待创建交易确认
		const createReceipt = await publicClient.waitForTransactionReceipt({
			hash: createHash,
			confirmations: 1,
		});

		if (createReceipt.status !== "success") {
			throw new Error("课程链上创建失败");
		}

		// Step 2: 如果需要发布，更新课程状态为 PUBLISHED (1)
		if (input.shouldPublish) {
			try {
				const updateHash = await wallet.writeContract({
					address: this.courseRegistryAddress,
					abi: courseRegistryAbi,
					functionName: "updateCourseStatus",
					account: this.backendAccount,
					chain: sepolia,
					args: [input.courseId, 1], // 1 = PUBLISHED
				} as any);

				const updateReceipt = await publicClient.waitForTransactionReceipt({
					hash: updateHash,
					confirmations: 1,
				});

				if (updateReceipt.status !== "success") {
					throw new Error("课程状态更新失败(已创建但未发布)");
				}
			} catch (updateError: any) {
				// Log the detailed error for debugging
				console.error("❌ updateCourseStatus 调用失败:", updateError);
				console.error("  courseId:", input.courseId);
				console.error("  teacherAddress:", input.teacherAddress);
				console.error("  backendAccount:", this.backendAccount?.address);
				console.error("  registryAddress:", this.courseRegistryAddress);

				// Extract revert reason if available
				const revertReason = updateError.message || updateError.shortMessage || "Unknown error";
				throw new Error(`课程状态更新失败: ${revertReason}`);
			}
		}

		return {
			transactionHash: createHash,
			chainId: sepolia.id,
			blockNumber: createReceipt.blockNumber ? Number(createReceipt.blockNumber) : undefined,
			status: createReceipt.status,
		};
	}

	/**
	 * 更新课程状态（单独方法，用于已存在的课程）
	 */
	async updateCourseStatus(courseId: string, status: "draft" | "published" | "archived"): Promise<OnchainTransaction> {
		console.log(`🔗 [OnchainService.updateCourseStatus] 开始更新课程状态`);
		console.log(`   课程ID: ${courseId}`);
		console.log(`   目标状态: ${status}`);

		const wallet = this.ensureWallet();
		const publicClient = this.ensurePublicClient() as any;

		// 检查课程是否存在
		console.log(`🔗 [OnchainService.updateCourseStatus] 检查课程是否存在...`);
		const exists = (await publicClient.readContract({
			address: this.courseRegistryAddress,
			abi: courseRegistryAbi,
			functionName: "courseExists",
			args: [courseId],
		} as any)) as boolean;

		console.log(`🔗 [OnchainService.updateCourseStatus] 课程存在: ${exists}`);

		if (!exists) {
			throw new Error("课程不存在，无法更新状态");
		}

		// 状态映射: draft=0, published=1, archived=2
		const statusMap = { draft: 0, published: 1, archived: 2 };
		const statusValue = statusMap[status];

		console.log(`🔗 [OnchainService.updateCourseStatus] 状态值映射: ${status} -> ${statusValue}`);

		// 调用 updateCourseStatus
		console.log(`🔗 [OnchainService.updateCourseStatus] 发送链上交易...`);
		const updateHash = await wallet.writeContract({
			address: this.courseRegistryAddress,
			abi: courseRegistryAbi,
			functionName: "updateCourseStatus",
			account: this.backendAccount,
			chain: sepolia,
			args: [courseId, statusValue],
			gas: 100000n, // 手动设置 Gas limit 以避免 out of gas 错误
		} as any);

		console.log(`🔗 [OnchainService.updateCourseStatus] 交易已发送: ${updateHash}`);
		console.log(`🔗 [OnchainService.updateCourseStatus] 等待交易确认...`);

		const updateReceipt = await publicClient.waitForTransactionReceipt({
			hash: updateHash,
			confirmations: 1,
		});

		console.log(`🔗 [OnchainService.updateCourseStatus] 交易状态: ${updateReceipt.status}`);

		if (updateReceipt.status !== "success") {
			throw new Error(`课程状态更新失败: status=${status}`);
		}

		console.log(`✅ [OnchainService.updateCourseStatus] 状态更新成功完成`);

		return {
			transactionHash: updateHash,
			chainId: sepolia.id,
			blockNumber: updateReceipt.blockNumber ? Number(updateReceipt.blockNumber) : undefined,
			status: updateReceipt.status,
		};
	}

	private assertHexEnv(key: string): HexString {
		const value = process.env[key] as string | undefined;
		if (!value) {
			throw new Error(`${key} 未配置`);
		}
		if (!value.startsWith("0x")) {
			throw new Error(`${key} 必须为 0x 开头的地址/密钥`);
		}
		return value as HexString;
	}

	private ensureWallet(): any {
		if (!this.walletClient) {
			throw new Error("钱包客户端未初始化");
		}
		return this.walletClient as any;
	}

	private ensurePublicClient(): any {
		if (!this.publicClient) {
			throw new Error("公共客户端未初始化");
		}
		return this.publicClient as any;
	}
}
