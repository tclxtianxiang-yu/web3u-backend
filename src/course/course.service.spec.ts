import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { createSupabaseMock } from "../../test/mocks/supabase-client.mock";
import { SupabaseService } from "../supabase/supabase.service";
import { CourseService } from "./course.service";

describe("CourseService", () => {
	let service: CourseService;
	let supabaseService: SupabaseService;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				{
					provide: SupabaseService,
					useValue: {
						getClient: jest.fn(),
					},
				},
				{
					provide: CourseService,
					useFactory: (supabase: SupabaseService) => new CourseService(supabase),
					inject: [SupabaseService],
				},
			],
		}).compile();

		service = module.get(CourseService);
		supabaseService = module.get(SupabaseService);
	});

	it("create: 成功插入并映射返回值", async () => {
		const mockClient = createSupabaseMock({
			insertResult: {
				data: {
					id: "course-1",
					title: "Solidity 101",
					description: "desc",
					teacher_wallet_address: "0x123",
					price_yd: "100",
					category: "solidity",
					thumbnail_url: null,
					video_url: null,
					total_lessons: 0,
					total_duration: 0,
					rating: "0",
					total_students: 0,
					status: "draft",
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
				error: null,
			},
		});
		(supabaseService.getClient as jest.Mock).mockReturnValue(mockClient);

		const result = await service.create({
			title: "Solidity 101",
			description: "desc",
			teacherWalletAddress: "0x123",
			priceYd: 100,
			category: "solidity",
			thumbnailUrl: undefined,
			videoUrl: undefined,
			status: "draft",
		});

		expect(result.title).toBe("Solidity 101");
		expect(result.priceYd).toBe(100);
	});

	it("findOne: 找不到时抛出 NotFoundException", async () => {
		const mockClient = createSupabaseMock({
			selectResult: { data: null, error: { message: "not found" } },
		});
		(supabaseService.getClient as jest.Mock).mockReturnValue(mockClient);

		await expect(service.findOne("missing")).rejects.toBeInstanceOf(NotFoundException);
	});

	it("findLessonsByCourseId: 能按课程返回排序后的课时", async () => {
		const mockClient = {
			from: jest.fn().mockReturnThis(),
			select: jest.fn().mockReturnThis(),
			eq: jest.fn().mockReturnThis(),
			order: jest.fn().mockResolvedValue({
				data: [
					{
						id: "l1",
						course_id: "c1",
						lesson_number: 1,
						title: "Intro",
						description: null,
						video_url: "https://example",
						duration: 60,
						is_free: false,
						created_at: new Date().toISOString(),
					},
				],
				error: null,
			}),
		};
		(supabaseService.getClient as jest.Mock).mockReturnValue(mockClient);

		const lessons = await service.findLessonsByCourseId("c1");
		expect(lessons[0].lessonNumber).toBe(1);
	});
});
