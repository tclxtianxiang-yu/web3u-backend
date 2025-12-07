import { Test } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { LearningRecordService } from "./learning-record.service";
import { SupabaseService } from "../supabase/supabase.service";

describe("LearningRecordService", () => {
	let service: LearningRecordService;
	let supabaseService: SupabaseService;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				{
					provide: SupabaseService,
					useValue: { getClient: jest.fn() },
				},
				{
					provide: LearningRecordService,
					useFactory: (supabase: SupabaseService) => new LearningRecordService(supabase),
					inject: [SupabaseService],
				},
			],
		}).compile();

		service = module.get(LearningRecordService);
		supabaseService = module.get(SupabaseService);
	});

	it("create: 正常插入并映射", async () => {
		const now = new Date().toISOString();
		const mockClient = {
			from: jest.fn().mockReturnThis(),
			insert: jest.fn().mockReturnThis(),
			select: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({
				data: {
					id: "lr-1",
					user_wallet_address: "0xuser",
					course_id: "course-1",
					lesson_id: "lesson-1",
					watch_time: 120,
					progress_percentage: 50,
					completed: false,
					last_watched_at: now,
					created_at: now,
					updated_at: now,
				},
				error: null,
			}),
		};
		(supabaseService.getClient as jest.Mock).mockReturnValue(mockClient);

		const result = await service.create({
			userWalletAddress: "0xuser",
			courseId: "course-1",
			lessonId: "lesson-1",
			watchTime: 120,
			progressPercentage: 50,
			completed: false,
		});

		expect(result.id).toBe("lr-1");
		expect(result.progressPercentage).toBe(50);
	});

	it("findOne: 未找到抛出 NotFoundException", async () => {
		const mockClient = {
			from: jest.fn().mockReturnThis(),
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			single: jest.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
		};
		(supabaseService.getClient as jest.Mock).mockReturnValue(mockClient);

		await expect(service.findOne("missing")).rejects.toBeInstanceOf(NotFoundException);
	});
});
