import { Test } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { SupabaseService } from "../supabase/supabase.service";
import { createSupabaseMock } from "../../test/mocks/supabase-client.mock";

describe("TransactionService", () => {
	let service: TransactionService;
	let supabaseService: SupabaseService;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				{
					provide: SupabaseService,
					useValue: { getClient: jest.fn() },
				},
				{
					provide: TransactionService,
					useFactory: (supabase: SupabaseService) => new TransactionService(supabase),
					inject: [SupabaseService],
				},
			],
		}).compile();

		service = module.get(TransactionService);
		supabaseService = module.get(SupabaseService);
	});

	it("create: 正常插入返回映射后的交易", async () => {
		const now = new Date().toISOString();
		const mockClient = createSupabaseMock({
			insertResult: {
				data: {
					id: "tx-1",
					from_wallet_address: "0xfrom",
					to_wallet_address: "0xto",
					amount_yd: "10.5",
					transaction_type: "course_purchase",
					transaction_hash: "0xhash",
					status: "pending",
					metadata: { courseId: "course-1" },
					created_at: now,
				},
				error: null,
			},
		});
		(supabaseService.getClient as jest.Mock).mockReturnValue(mockClient);

		const result = await service.create({
			fromWalletAddress: "0xfrom",
			toWalletAddress: "0xto",
			amountYd: 10.5,
			transactionType: "course_purchase",
			transactionHash: "0xhash",
			metadata: { courseId: "course-1" },
		});

		expect(result.id).toBe("tx-1");
		expect(result.amountYd).toBeCloseTo(10.5);
		expect(result.metadata).toEqual({ courseId: "course-1" });
	});

	it("findOne: 未找到时抛出 NotFoundException", async () => {
		const mockClient = createSupabaseMock({
			selectResult: { data: null, error: { message: "not found" } },
		});
		(supabaseService.getClient as jest.Mock).mockReturnValue(mockClient);
		await expect(service.findOne("missing")).rejects.toBeInstanceOf(NotFoundException);
	});

	it("updateStatus: 未找到时抛出 NotFoundException", async () => {
		const mockClient = createSupabaseMock({
			updateResult: { data: null, error: { message: "not found" } },
		});
		mockClient.update = jest.fn().mockReturnThis();
		mockClient.select = jest.fn().mockReturnThis();
		mockClient.single = jest.fn().mockResolvedValue({ data: null, error: { message: "not found" } });
		mockClient.eq = jest.fn().mockReturnThis();
		(supabaseService.getClient as jest.Mock).mockReturnValue(mockClient);

		await expect(service.updateStatus("missing", "failed")).rejects.toBeInstanceOf(NotFoundException);
	});
});
