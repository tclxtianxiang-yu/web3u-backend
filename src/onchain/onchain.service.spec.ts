import { Test } from "@nestjs/testing";
import { OnchainService } from "./onchain.service";

jest.mock("viem", () => {
	const actual = jest.requireActual("viem");
	return {
		...actual,
		createWalletClient: jest.fn(),
		createPublicClient: jest.fn(),
		http: jest.fn(() => "http-transport"),
	};
});

jest.mock("viem/accounts", () => ({
	privateKeyToAccount: jest.fn(() => ({ address: "0xbackend", source: "privateKey", type: "local" })),
}));

const mockWalletClient = {
	writeContract: jest.fn(),
};
const mockPublicClient = {
	readContract: jest.fn(),
	waitForTransactionReceipt: jest.fn(),
};

describe("OnchainService", () => {
	let service: OnchainService;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [OnchainService],
		}).compile();

		service = module.get(OnchainService);

		const viem = require("viem");
		viem.createWalletClient.mockReturnValue(mockWalletClient);
		viem.createPublicClient.mockReturnValue(mockPublicClient);
		mockWalletClient.writeContract.mockReset();
		mockPublicClient.readContract.mockReset();
		mockPublicClient.waitForTransactionReceipt.mockReset();

		// re-run onModuleInit with mocks
		service.onModuleInit();
	});

	it("completeCourse: 未购买抛错", async () => {
		mockPublicClient.readContract.mockResolvedValueOnce(false); // hasPurchased

		await expect(
			service.completeCourse({
				studentAddress: "0xstudent",
				courseId: "course-1",
				metadataURI: "https://metadata",
			}),
		).rejects.toThrow("学生未购买");
	});

	it("completeCourse: 已有证书抛错", async () => {
		mockPublicClient.readContract
			.mockResolvedValueOnce(true) // hasPurchased
			.mockResolvedValueOnce(true); // hasCertificate

		await expect(
			service.completeCourse({
				studentAddress: "0xstudent",
				courseId: "course-1",
				metadataURI: "https://metadata",
			}),
		).rejects.toThrow("证书已存在");
	});

	it("completeCourse: 正常返回链上交易信息", async () => {
		mockPublicClient.readContract
			.mockResolvedValueOnce(true) // hasPurchased
			.mockResolvedValueOnce(false); // hasCertificate

		mockWalletClient.writeContract.mockResolvedValue("0xtxhash");
		mockPublicClient.waitForTransactionReceipt.mockResolvedValue({
			chainId: 11155111n,
			blockNumber: 123n,
			status: "success",
		});

		const result = await service.completeCourse({
			studentAddress: "0xstudent",
			courseId: "course-1",
			metadataURI: "https://metadata",
		});

		expect(result.transactionHash).toBe("0xtxhash");
		expect(result.chainId).toBe(11155111);
		expect(result.status).toBe("success");
	});

	it("awardTeacherBadge: 已有徽章抛错", async () => {
		mockPublicClient.readContract.mockResolvedValueOnce(true); // hasBadge

		await expect(
			service.awardTeacherBadge({
				teacherAddress: "0xteacher",
				courseId: "course-1",
				ratingScore: 90,
				metadataURI: "https://metadata",
			}),
		).rejects.toThrow("徽章已存在");
	});

	it("awardTeacherBadge: 正常返回链上交易信息", async () => {
		mockPublicClient.readContract.mockResolvedValueOnce(false); // hasBadge
		mockWalletClient.writeContract.mockResolvedValue("0xtxhash");
		mockPublicClient.waitForTransactionReceipt.mockResolvedValue({
			chainId: 11155111n,
			blockNumber: 456n,
			status: "success",
		});

		const result = await service.awardTeacherBadge({
			teacherAddress: "0xteacher",
			courseId: "course-1",
			ratingScore: 90,
			metadataURI: "https://metadata",
		});

		expect(result.transactionHash).toBe("0xtxhash");
		expect(result.blockNumber).toBe(456);
	});
});
