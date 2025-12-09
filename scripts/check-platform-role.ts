/**
 * 检查 backend signer 是否有 PLATFORM_ROLE 权限
 */

import "dotenv/config";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

const COURSE_REGISTRY_ABI = [
	{
		inputs: [],
		name: "PLATFORM_ROLE",
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
] as const;

async function main() {
	const RPC_URL = process.env.SEPOLIA_RPC_URL;
	const BACKEND_SIGNER_ADDRESS = "0x9782DfAE3D5Fc38807335F15e482F3312F8C22a6" as `0x${string}`;
	const COURSE_REGISTRY_ADDRESS = process.env.COURSE_REGISTRY_ADDRESS as `0x${string}`;

	if (!RPC_URL || !COURSE_REGISTRY_ADDRESS) {
		console.error("❌ 缺少必要的环境变量");
		process.exit(1);
	}

	const publicClient = createPublicClient({
		chain: sepolia,
		transport: http(RPC_URL),
	});

	console.log("\n🔐 检查 PLATFORM_ROLE 权限...");
	console.log("  CourseRegistry 地址:", COURSE_REGISTRY_ADDRESS);
	console.log("  Backend Signer 地址:", BACKEND_SIGNER_ADDRESS);

	const PLATFORM_ROLE = (await publicClient.readContract({
		address: COURSE_REGISTRY_ADDRESS,
		abi: COURSE_REGISTRY_ABI,
		functionName: "PLATFORM_ROLE",
	} as any)) as `0x${string}`;

	console.log("  PLATFORM_ROLE hash:", PLATFORM_ROLE);

	const hasRole = (await publicClient.readContract({
		address: COURSE_REGISTRY_ADDRESS,
		abi: COURSE_REGISTRY_ABI,
		functionName: "hasRole",
		args: [PLATFORM_ROLE, BACKEND_SIGNER_ADDRESS],
	} as any)) as boolean;

	if (hasRole) {
		console.log("\n✅ Backend Signer 拥有 PLATFORM_ROLE");
	} else {
		console.log("\n❌ Backend Signer 没有 PLATFORM_ROLE");
		console.log("\n请运行以下命令授予权限:");
		console.log("  cd backend");
		console.log("  npx ts-node scripts/grant-platform-role.ts");
	}
}

main().catch((error) => {
	console.error("\n❌ 脚本执行失败:");
	console.error(error);
	process.exit(1);
});
