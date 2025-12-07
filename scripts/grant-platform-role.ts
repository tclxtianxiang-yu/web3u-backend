/**
 * 授予 backend signer PLATFORM_ROLE 权限
 *
 * 使用方法:
 * 1. 在 .env 中添加 DEPLOYER_PRIVATE_KEY (部署合约的账户私钥)
 * 2. npx ts-node scripts/grant-platform-role.ts
 */

import "dotenv/config";
import { createPublicClient, createWalletClient, http } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const COURSE_REGISTRY_ABI = [
	{
		inputs: [{ name: "account", type: "address" }],
		name: "grantPlatformRole",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "DEFAULT_ADMIN_ROLE",
		outputs: [{ name: "", type: "bytes32" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ name: "role", type: "bytes32" },
			{ name: "account", type: "address" },
		],
		name: "hasRole",
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "PLATFORM_ROLE",
		outputs: [{ name: "", type: "bytes32" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

async function main() {
	const RPC_URL = process.env.SEPOLIA_RPC_URL;
	// 使用 BACKEND_SIGNER_PRIVATE_KEY 作为 deployer（它们是同一个账户）
	const DEPLOYER_PRIVATE_KEY = process.env.BACKEND_SIGNER_PRIVATE_KEY as `0x${string}` | undefined;
	const BACKEND_SIGNER_ADDRESS = "0x9782DfAE3D5Fc38807335F15e482F3312F8C22a6" as `0x${string}`;
	const COURSE_REGISTRY_ADDRESS = process.env.COURSE_REGISTRY_ADDRESS as `0x${string}`;

	// 验证环境变量
	if (!RPC_URL || !DEPLOYER_PRIVATE_KEY || !COURSE_REGISTRY_ADDRESS) {
		console.error("❌ 缺少必要的环境变量:");
		console.error("  SEPOLIA_RPC_URL:", RPC_URL ? "✓" : "✗");
		console.error("  BACKEND_SIGNER_PRIVATE_KEY:", DEPLOYER_PRIVATE_KEY ? "✓" : "✗");
		console.error("  COURSE_REGISTRY_ADDRESS:", COURSE_REGISTRY_ADDRESS ? "✓" : "✗");
		process.exit(1);
	}

	const deployerAccount = privateKeyToAccount(DEPLOYER_PRIVATE_KEY);

	const publicClient = createPublicClient({
		chain: sepolia,
		transport: http(RPC_URL),
	});

	const walletClient = createWalletClient({
		account: deployerAccount,
		chain: sepolia,
		transport: http(RPC_URL),
	});

	console.log("\n🔐 准备授予 PLATFORM_ROLE 权限...");
	console.log("  CourseRegistry 地址:", COURSE_REGISTRY_ADDRESS);
	console.log("  Backend Signer 地址:", BACKEND_SIGNER_ADDRESS);
	console.log("  Deployer 地址:", deployerAccount.address);

	// 检查 deployer 是否有 DEFAULT_ADMIN_ROLE
	const DEFAULT_ADMIN_ROLE = (await publicClient.readContract({
		address: COURSE_REGISTRY_ADDRESS,
		abi: COURSE_REGISTRY_ABI,
		functionName: "DEFAULT_ADMIN_ROLE",
	} as any)) as `0x${string}`;

	const hasAdminRole = (await publicClient.readContract({
		address: COURSE_REGISTRY_ADDRESS,
		abi: COURSE_REGISTRY_ABI,
		functionName: "hasRole",
		args: [DEFAULT_ADMIN_ROLE, deployerAccount.address as `0x${string}`],
	} as any)) as boolean;

	if (!hasAdminRole) {
		console.error("\n❌ 错误: 当前账户不是 CourseRegistry 的 DEFAULT_ADMIN_ROLE");
		console.error("  当前账户:", deployerAccount.address);
		console.error("  请使用部署 CourseRegistry 的账户运行此脚本");
		process.exit(1);
	}

	console.log("✓ Deployer 拥有 DEFAULT_ADMIN_ROLE");

	// 检查 backend signer 是否已有 PLATFORM_ROLE
	const PLATFORM_ROLE = (await publicClient.readContract({
		address: COURSE_REGISTRY_ADDRESS,
		abi: COURSE_REGISTRY_ABI,
		functionName: "PLATFORM_ROLE",
	} as any)) as `0x${string}`;

	const alreadyHasRole = (await publicClient.readContract({
		address: COURSE_REGISTRY_ADDRESS,
		abi: COURSE_REGISTRY_ABI,
		functionName: "hasRole",
		args: [PLATFORM_ROLE, BACKEND_SIGNER_ADDRESS],
	} as any)) as boolean;

	if (alreadyHasRole) {
		console.log("\n✅ Backend Signer 已经拥有 PLATFORM_ROLE，无需重复授予");
		process.exit(0);
	}

	// 授予权限
	console.log("\n⏳ 正在发送授权交易...");

	const hash = await walletClient.writeContract({
		address: COURSE_REGISTRY_ADDRESS,
		abi: COURSE_REGISTRY_ABI,
		functionName: "grantPlatformRole",
		args: [BACKEND_SIGNER_ADDRESS],
		chain: sepolia,
	} as any);

	console.log("📤 交易已发送:", hash);
	console.log("🔗 Sepolia Etherscan:", `https://sepolia.etherscan.io/tx/${hash}`);

	console.log("\n⏳ 等待交易确认...");
	const receipt = await publicClient.waitForTransactionReceipt({ hash });

	if (receipt.status === "success") {
		console.log("✅ PLATFORM_ROLE 授予成功!");
		console.log("  交易区块:", receipt.blockNumber);

		// 再次验证
		const verified = (await publicClient.readContract({
			address: COURSE_REGISTRY_ADDRESS,
			abi: COURSE_REGISTRY_ABI,
			functionName: "hasRole",
			args: [PLATFORM_ROLE, BACKEND_SIGNER_ADDRESS],
		} as any)) as boolean;

		if (verified) {
			console.log("✓ 权限验证通过");
		} else {
			console.warn("⚠️ 权限验证失败，请手动检查");
		}
	} else {
		console.error("❌ 交易失败");
		process.exit(1);
	}
}

main().catch((error) => {
	console.error("\n❌ 脚本执行失败:");
	console.error(error);
	process.exit(1);
});
