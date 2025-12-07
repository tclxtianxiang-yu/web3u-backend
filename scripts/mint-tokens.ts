/**
 * 给测试账户铸造YD代币
 *
 * 使用方法:
 * npx ts-node scripts/mint-tokens.ts <接收地址> <数量>
 *
 * 例如:
 * npx ts-node scripts/mint-tokens.ts 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb 10000
 */

import "dotenv/config";
import { createWalletClient, createPublicClient, http, parseEther, formatEther } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// YDToken ABI - 只需要 mint 和 balanceOf 函数
const YD_TOKEN_ABI = [
	{
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		name: "mint",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ name: "account", type: "address" }],
		name: "balanceOf",
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [],
		name: "owner",
		outputs: [{ name: "", type: "address" }],
		stateMutability: "view",
		type: "function",
	},
] as const;

async function main() {
	// 获取环境变量
	const RPC_URL = process.env.SEPOLIA_RPC_URL;
	const PRIVATE_KEY = process.env.BACKEND_SIGNER_PRIVATE_KEY;
	const YD_TOKEN_ADDRESS = process.env.YD_TOKEN_ADDRESS as `0x${string}`;

	if (!RPC_URL || !PRIVATE_KEY || !YD_TOKEN_ADDRESS) {
		console.error("❌ 缺少环境变量:");
		console.error("  SEPOLIA_RPC_URL:", RPC_URL ? "✓" : "✗");
		console.error("  BACKEND_SIGNER_PRIVATE_KEY:", PRIVATE_KEY ? "✓" : "✗");
		console.error("  YD_TOKEN_ADDRESS:", YD_TOKEN_ADDRESS ? "✓" : "✗");
		process.exit(1);
	}

	// 解析命令行参数
	const recipientAddress = process.argv[2] as `0x${string}`;
	const amountStr = process.argv[3];

	if (!recipientAddress || !amountStr) {
		console.error("❌ 使用方法:");
		console.error("  npx ts-node scripts/mint-tokens.ts <接收地址> <数量>");
		console.error("\n例如:");
		console.error("  npx ts-node scripts/mint-tokens.ts 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb 10000");
		process.exit(1);
	}

	const amount = Number(amountStr);
	if (Number.isNaN(amount) || amount <= 0) {
		console.error("❌ 数量必须是正数");
		process.exit(1);
	}

	// 创建账户和客户端
	const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

	const publicClient = createPublicClient({
		chain: sepolia,
		transport: http(RPC_URL),
	});

	const walletClient = createWalletClient({
		account,
		chain: sepolia,
		transport: http(RPC_URL),
	});

	console.log("\n🚀 开始铸币操作...\n");
	console.log("📝 配置信息:");
	console.log("  YD Token 地址:", YD_TOKEN_ADDRESS);
	console.log("  发送者地址:", account.address);
	console.log("  接收者地址:", recipientAddress);
	console.log("  铸币数量:", amount, "YD");
	console.log("  (实际数量:", amount, "* 10^18 = ", parseEther(amount.toString()), "wei)");

	try {
		// 检查合约 owner
		const owner = await publicClient.readContract({
			address: YD_TOKEN_ADDRESS,
			abi: YD_TOKEN_ABI,
			functionName: "owner",
		});

		console.log("\n🔑 合约 Owner:", owner);
		console.log("  当前账户:", account.address);

		if (owner.toLowerCase() !== account.address.toLowerCase()) {
			console.error("\n❌ 错误: 当前账户不是合约 owner，无法铸币");
			console.error("  合约 owner:", owner);
			console.error("  当前账户:", account.address);
			process.exit(1);
		}

		// 查询接收者当前余额
		const balanceBefore = await publicClient.readContract({
			address: YD_TOKEN_ADDRESS,
			abi: YD_TOKEN_ABI,
			functionName: "balanceOf",
			args: [recipientAddress],
		});

		console.log("\n💰 接收者当前余额:", formatEther(balanceBefore), "YD");

		// 铸币
		console.log("\n⏳ 正在发送交易...");
		const hash = await walletClient.writeContract({
			address: YD_TOKEN_ADDRESS,
			abi: YD_TOKEN_ABI,
			functionName: "mint",
			args: [recipientAddress, parseEther(amount.toString())],
		});

		console.log("📤 交易已发送:", hash);
		console.log("🔗 Sepolia Etherscan:", `https://sepolia.etherscan.io/tx/${hash}`);

		// 等待交易确认
		console.log("\n⏳ 等待交易确认...");
		const receipt = await publicClient.waitForTransactionReceipt({ hash });

		if (receipt.status === "success") {
			console.log("✅ 交易成功!");

			// 查询新余额
			const balanceAfter = await publicClient.readContract({
				address: YD_TOKEN_ADDRESS,
				abi: YD_TOKEN_ABI,
				functionName: "balanceOf",
				args: [recipientAddress],
			});

			console.log("\n💰 铸币后余额:", formatEther(balanceAfter), "YD");
			console.log("📈 增加金额:", formatEther(balanceAfter - balanceBefore), "YD");
		} else {
			console.error("❌ 交易失败");
			process.exit(1);
		}
	} catch (error) {
		console.error("\n❌ 铸币失败:");
		console.error(error);
		process.exit(1);
	}
}

main();
