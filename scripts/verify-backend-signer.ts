/**
 * 验证 BACKEND_SIGNER_PRIVATE_KEY 对应的地址
 */

import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";

const PRIVATE_KEY = process.env.BACKEND_SIGNER_PRIVATE_KEY as `0x${string}`;
const EXPECTED_ADDRESS = "0x9782DfAE3D5Fc38807335F15e482F3312F8C22a6";

if (!PRIVATE_KEY) {
	console.error("❌ BACKEND_SIGNER_PRIVATE_KEY 未设置");
	process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);

console.log("🔑 验证 Backend Signer 配置:");
console.log("  私钥对应的地址:", account.address);
console.log("  期望的地址:    ", EXPECTED_ADDRESS);

if (account.address.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
	console.log("\n✅ 私钥配置正确！");
} else {
	console.log("\n❌ 私钥配置错误！");
	console.log("  当前私钥对应的地址与合约部署时指定的 backendSigner 不匹配");
	console.log("  请检查 .env 中的 BACKEND_SIGNER_PRIVATE_KEY");
	process.exit(1);
}
