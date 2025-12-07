import { Injectable, OnModuleInit } from "@nestjs/common";
import { createPublicClient, createWalletClient, http } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { coursePlatformAbi } from "./abis/course-platform";
import { studentCertificateAbi } from "./abis/student-certificate";
import { teacherBadgeAbi } from "./abis/teacher-badge";
import type { CompleteCourseOnchainInput } from "./dto/complete-course.input";
import type { AwardTeacherBadgeInput } from "./dto/award-teacher-badge.input";
import type { OnchainTransaction } from "./entities/onchain-transaction.entity";

type HexString = `0x${string}`;

@Injectable()
export class OnchainService implements OnModuleInit {
	private walletClient: any = null;
	private publicClient: any = null;
	private backendAccount!: ReturnType<typeof privateKeyToAccount>;

	private coursePlatformAddress!: HexString;
	private studentCertificateAddress!: HexString;
	private teacherBadgeAddress!: HexString;

	onModuleInit() {
		const rpcUrl = process.env.SEPOLIA_RPC_URL;
		const privateKey = process.env.BACKEND_SIGNER_PRIVATE_KEY as HexString | undefined;

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
