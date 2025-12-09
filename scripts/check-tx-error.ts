/**
 * 检查交易的详细错误信息
 */

import "dotenv/config";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

async function main() {
	const RPC_URL = process.env.SEPOLIA_RPC_URL;
	const TX_HASH = process.argv[2] as `0x${string}`;

	if (!RPC_URL) {
		console.error("❌ 缺少 SEPOLIA_RPC_URL 环境变量");
		process.exit(1);
	}

	if (!TX_HASH) {
		console.error("❌ 请提供交易哈希");
		console.error("用法: npx ts-node scripts/check-tx-error.ts <TX_HASH>");
		process.exit(1);
	}

	const publicClient = createPublicClient({
		chain: sepolia,
		transport: http(RPC_URL),
	});

	console.log("\n🔍 查询交易信息...");
	console.log("  交易哈希:", TX_HASH);
	console.log("");

	try {
		const receipt = await publicClient.getTransactionReceipt({ hash: TX_HASH });

		console.log("📊 交易回执:");
		console.log("  状态:", receipt.status);
		console.log("  区块号:", receipt.blockNumber);
		console.log("  Gas 使用:", receipt.gasUsed);
		console.log("");

		if (receipt.status === "reverted") {
			console.log("❌ 交易已 revert");

			// 尝试获取交易数据并模拟执行来获取 revert 原因
			const tx = await publicClient.getTransaction({ hash: TX_HASH });
			console.log("\n📝 交易详情:");
			console.log("  From:", tx.from);
			console.log("  To:", tx.to);
			console.log("  Value:", tx.value);
			console.log("  Gas:", tx.gas);

			try {
				// 尝试模拟调用以获取 revert 原因
				await publicClient.call({
					account: tx.from,
					to: tx.to,
					data: tx.input,
					value: tx.value,
					gas: tx.gas,
				} as any);
			} catch (error: any) {
				console.log("\n❌ Revert 原因:");
				if (error.message) {
					console.log("  ", error.message);
				}
				if (error.shortMessage) {
					console.log("  ", error.shortMessage);
				}
				if (error.details) {
					console.log("  详细:", error.details);
				}
				if (error.cause) {
					console.log("  原因:", error.cause);
				}
			}
		} else {
			console.log("✅ 交易成功");
		}
	} catch (error: any) {
		console.error("\n❌ 查询失败:", error.message);
	}
}

main().catch((error) => {
	console.error("\n❌ 脚本执行失败:");
	console.error(error);
	process.exit(1);
});
