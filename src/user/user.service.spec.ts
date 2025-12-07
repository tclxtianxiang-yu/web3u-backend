import { Test } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { UserService } from "./user.service";
import { SupabaseService } from "../supabase/supabase.service";

describe("UserService", () => {
	let service: UserService;
	let supabaseService: SupabaseService;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				{
					provide: SupabaseService,
					useValue: { getClient: jest.fn() },
				},
				{
					provide: UserService,
					useFactory: (supabase: SupabaseService) => new UserService(supabase),
					inject: [SupabaseService],
				},
			],
		}).compile();

		service = module.get(UserService);
		supabaseService = module.get(SupabaseService);
	});

	it("create: 正常插入并返回映射用户", async () => {
		const now = new Date().toISOString();
		const mockClient = {
			from: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			select: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({
				data: {
					wallet_address: "0xabc",
					username: "alice",
					email: "a@example.com",
					role: "student",
					yd_token_balance: "10.5",
					created_at: now,
					updated_at: now,
				},
				error: null,
			}),
		};
		(supabaseService.getClient as jest.Mock).mockReturnValue(mockClient);

		const result = await service.create({
			walletAddress: "0xabc",
			username: "alice",
			email: "a@example.com",
			role: "student",
		});

		expect(result.walletAddress).toBe("0xabc");
		expect(result.ydTokenBalance).toBeCloseTo(10.5);
	});

	it("findOne: 未找到抛 NotFoundException", async () => {
		const mockClient = {
			from: jest.fn().mockReturnThis(),
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
		};
		(supabaseService.getClient as jest.Mock).mockReturnValue(mockClient);

		await expect(service.findOne("0xmissing")).rejects.toBeInstanceOf(NotFoundException);
	});

	it("update: 未找到抛 NotFoundException", async () => {
		const mockClient = {
			from: jest.fn().mockReturnThis(),
			update: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			select: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
		};
		(supabaseService.getClient as jest.Mock).mockReturnValue(mockClient);

		await expect(service.update("0xmissing", { username: "bob" })).rejects.toBeInstanceOf(NotFoundException);
	});

	it("remove: 失败时抛错误", async () => {
		const mockClient = {
			from: jest.fn().mockReturnThis(),
			delete: jest.fn().mockReturnThis(),
			eq: jest.fn().mockResolvedValue({ error: { message: "db error" } }),
		};
		(supabaseService.getClient as jest.Mock).mockReturnValue(mockClient);

		await expect(service.remove("0xabc")).rejects.toThrow("Failed to delete user");
	});
});
