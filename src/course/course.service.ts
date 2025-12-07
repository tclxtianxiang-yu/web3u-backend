import { forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { OnchainService } from "../onchain/onchain.service";
import type { CreateCourseInput } from "./dto/create-course.input";
import type { Course, CourseLesson } from "./entities/course.entity";

type CourseRow = {
	id: string;
	title: string;
	description: string;
	teacher_wallet_address: string;
	price_yd: number | string;
	category: string;
	thumbnail_url?: string;
	video_url?: string;
	total_lessons?: number;
	total_duration?: number;
	rating?: number | string;
	total_students?: number;
	status?: string;
	created_at: string;
	updated_at: string;
};

type CourseLessonRow = {
	id: string;
	course_id: string;
	lesson_number: number;
	title: string;
	description?: string;
	video_url?: string;
	duration?: number;
	is_free?: boolean;
	created_at: string;
};

@Injectable()
export class CourseService {
	constructor(
		private readonly supabaseService: SupabaseService,
		@Inject(forwardRef(() => OnchainService))
		private readonly onchainService: OnchainService,
	) {}

	async create(createCourseInput: CreateCourseInput): Promise<Course> {
		// Step 1: Insert course to database
		const { data, error } = await this.supabaseService
			.getClient()
			.from("courses")
			.insert({
				title: createCourseInput.title,
				description: createCourseInput.description,
				teacher_wallet_address: createCourseInput.teacherWalletAddress,
				price_yd: createCourseInput.priceYd,
				category: createCourseInput.category,
				thumbnail_url: createCourseInput.thumbnailUrl,
				video_url: createCourseInput.videoUrl,
				status: createCourseInput.status,
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create course: ${error.message}`);
		}

		const course = this.mapToCourse(data);

		// Step 2: Register on-chain if status is "published" and price > 0
		if (createCourseInput.status === "published" && createCourseInput.priceYd > 0) {
			try {
				await this.onchainService.createCourseOnchain({
					courseId: course.id,
					teacherAddress: createCourseInput.teacherWalletAddress,
					priceYd: createCourseInput.priceYd,
					shouldPublish: true,
				});
			} catch (onchainError: any) {
				// Rollback: Delete from database if on-chain registration fails
				await this.supabaseService.getClient().from("courses").delete().eq("id", course.id);

				throw new Error(`课程链上注册失败，已回滚数据库: ${onchainError.message}`);
			}
		}

		return course;
	}

	async findAll(filters?: { teacherWalletAddress?: string; status?: string; category?: string }): Promise<Course[]> {
		let query = this.supabaseService.getClient().from("courses").select("*");

		if (filters?.teacherWalletAddress) {
			query = query.eq("teacher_wallet_address", filters.teacherWalletAddress);
		}
		if (filters?.status) {
			query = query.eq("status", filters.status);
		}
		if (filters?.category) {
			query = query.eq("category", filters.category);
		}

		const { data, error } = await query;

		if (error) {
			throw new Error(`Failed to fetch courses: ${error.message}`);
		}

		return data.map(this.mapToCourse);
	}

	async findOne(id: string): Promise<Course> {
		const { data, error } = await this.supabaseService.getClient().from("courses").select("*").eq("id", id).single();

		if (error || !data) {
			throw new NotFoundException(`Course with ID ${id} not found`);
		}

		return this.mapToCourse(data);
	}

	async findLessonsByCourseId(courseId: string): Promise<CourseLesson[]> {
		const { data, error } = await this.supabaseService
			.getClient()
			.from("course_lessons")
			.select("*")
			.eq("course_id", courseId)
			.order("lesson_number", { ascending: true });

		if (error) {
			throw new Error(`Failed to fetch lessons: ${error.message}`);
		}

		return data.map(this.mapToCourseLesson);
	}

	async updateCourseStats(courseId: string, stats: { rating?: number; totalStudents?: number }): Promise<Course> {
		const updateData: Partial<{
			rating: number;
			total_students: number;
		}> = {};

		if (stats.rating !== undefined) {
			updateData.rating = stats.rating;
		}
		if (stats.totalStudents !== undefined) {
			updateData.total_students = stats.totalStudents;
		}

		const { data, error } = await this.supabaseService
			.getClient()
			.from("courses")
			.update(updateData)
			.eq("id", courseId)
			.select()
			.single();

		if (error || !data) {
			throw new NotFoundException(`Course with ID ${courseId} not found`);
		}

		return this.mapToCourse(data);
	}

	private mapToCourse(data: CourseRow): Course {
		return {
			id: data.id,
			title: data.title,
			description: data.description,
			teacherWalletAddress: data.teacher_wallet_address,
			priceYd: parseFloat(String(data.price_yd ?? "0")),
			category: data.category,
			thumbnailUrl: data.thumbnail_url,
			videoUrl: data.video_url,
			totalLessons: data.total_lessons || 0,
			totalDuration: data.total_duration || 0,
			rating: parseFloat(String(data.rating ?? "0")),
			totalStudents: data.total_students || 0,
			status: data.status,
			createdAt: new Date(data.created_at),
			updatedAt: new Date(data.updated_at),
		};
	}

	private mapToCourseLesson(data: CourseLessonRow): CourseLesson {
		return {
			id: data.id,
			courseId: data.course_id,
			lessonNumber: data.lesson_number,
			title: data.title,
			description: data.description,
			videoUrl: data.video_url,
			duration: data.duration,
			isFree: data.is_free || false,
			createdAt: new Date(data.created_at),
		};
	}
}
