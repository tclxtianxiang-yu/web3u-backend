/**
 * 检查课程是否在链上存在
 */

import "dotenv/config";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

const COURSE_REGISTRY_ABI = [
	{
		inputs: [{ name: "courseId", type: "string" }],
		name: "courseExists",
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ name: "courseId", type: "string" }],
		name: "getCourse",
		outputs: [
			{
				components: [
					{ name: "courseId", type: "string" },
					{ name: "teacher", type: "address" },
					{ name: "priceYD", type: "uint256" },
					{ name: "status", type: "uint8" },
					{ name: "totalPurchases", type: "uint256" },
					{ name: "createdAt", type: "uint256" },
					{ name: "updatedAt", type: "uint256" },
				],
				name: "",
				type: "tuple",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ name: "courseId", type: "string" }],
		name: "isCourseActive",
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

async function main() {
	const RPC_URL = process.env.SEPOLIA_RPC_URL;
	const COURSE_REGISTRY_ADDRESS = process.env.COURSE_REGISTRY_ADDRESS as `0x${string}`;
	const COURSE_ID = process.argv[2] || "3376807d-7e76-4082-bc38-3f6777f75985";

	if (!RPC_URL || !COURSE_REGISTRY_ADDRESS) {
		console.error("❌ 缺少必要的环境变量:");
		console.error("  SEPOLIA_RPC_URL:", RPC_URL ? "✓" : "✗");
		console.error("  COURSE_REGISTRY_ADDRESS:", COURSE_REGISTRY_ADDRESS ? "✓" : "✗");
		process.exit(1);
	}

	const publicClient = createPublicClient({
		chain: sepolia,
		transport: http(RPC_URL),
	});

	console.log("\n🔍 查询课程信息...");
	console.log("  CourseRegistry 地址:", COURSE_REGISTRY_ADDRESS);
	console.log("  课程 ID:", COURSE_ID);
	console.log("");

	try {
		// 检查课程是否存在
		const exists = (await publicClient.readContract({
			address: COURSE_REGISTRY_ADDRESS,
			abi: COURSE_REGISTRY_ABI,
			functionName: "courseExists",
			args: [COURSE_ID],
		} as any)) as boolean;

		console.log("📊 查询结果:");
		console.log("  课程存在:", exists ? "✅ 是" : "❌ 否");

		if (exists) {
			// 获取课程详细信息
			const course = (await publicClient.readContract({
				address: COURSE_REGISTRY_ADDRESS,
				abi: COURSE_REGISTRY_ABI,
				functionName: "getCourse",
				args: [COURSE_ID],
			} as any)) as any;

			const statusNames = ["DRAFT", "PUBLISHED", "ARCHIVED"];

			console.log("\n📝 课程详细信息:");
			console.log("  课程 ID:", course.courseId);
			console.log("  教师地址:", course.teacher);
			console.log("  价格 (wei):", course.priceYD.toString());
			console.log("  价格 (YD):", Number(course.priceYD) / 1e18);
			console.log("  状态:", statusNames[course.status] || course.status);
			console.log("  总购买次数:", course.totalPurchases.toString());
			console.log("  创建时间:", new Date(Number(course.createdAt) * 1000).toISOString());
			console.log("  更新时间:", new Date(Number(course.updatedAt) * 1000).toISOString());

			// 检查是否激活
			const isActive = (await publicClient.readContract({
				address: COURSE_REGISTRY_ADDRESS,
				abi: COURSE_REGISTRY_ABI,
				functionName: "isCourseActive",
				args: [COURSE_ID],
			} as any)) as boolean;

			console.log("\n🔓 激活状态:");
			console.log("  是否激活 (PUBLISHED):", isActive ? "✅ 是" : "❌ 否");
		}
	} catch (error: any) {
		console.error("\n❌ 查询出错:");
		console.error("  错误信息:", error.message || error);
		if (error.cause) {
			console.error("  原因:", error.cause);
		}
	}
}

main().catch((error) => {
	console.error("\n❌ 脚本执行失败:");
	console.error(error);
	process.exit(1);
});
