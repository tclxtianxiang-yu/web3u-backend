import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CourseService } from "../course/course.service";
import { SupabaseService } from "../supabase/supabase.service";
import type { CreateReviewInput } from "./dto/create-review.input";
import type { UpdateReviewInput } from "./dto/update-review.input";
import type { Review } from "./entities/review.entity";

type ReviewRow = {
	id: string;
	course_id: string;
	user_wallet_address: string;
	rating: number;
	review_text?: string;
	created_at: string;
	updated_at: string;
};

@Injectable()
export class ReviewService {
	constructor(
		private readonly supabaseService: SupabaseService,
		private readonly courseService: CourseService,
	) {}

	async create(createReviewInput: CreateReviewInput): Promise<Review> {
		const { courseId, studentWalletAddress, rating, comment } = createReviewInput;

		// Check if user has purchased the course
		const hasPurchased = await this.hasUserPurchasedCourse(studentWalletAddress, courseId);
		if (!hasPurchased) {
			throw new ForbiddenException("You must purchase this course before leaving a review");
		}

		// Check for duplicate review
		const existingReview = await this.findUserReviewForCourse(studentWalletAddress, courseId);
		if (existingReview) {
			throw new BadRequestException("You have already reviewed this course");
		}

		// Insert review
		const { data, error } = await this.supabaseService
			.getClient()
			.from("course_reviews")
			.insert({
				course_id: courseId,
				user_wallet_address: studentWalletAddress,
				rating,
				review_text: comment,
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create review: ${error.message}`);
		}

		// Update course rating
		await this.updateCourseRating(courseId);

		return this.mapToReview(data);
	}

	async findAll(filters?: {
		courseId?: string;
		teacherWalletAddress?: string;
		studentWalletAddress?: string;
	}): Promise<Review[]> {
		let query = this.supabaseService.getClient().from("course_reviews").select("*");

		if (filters?.courseId) {
			query = query.eq("course_id", filters.courseId);
		}
		if (filters?.studentWalletAddress) {
			query = query.eq("user_wallet_address", filters.studentWalletAddress);
		}

		// If filtering by teacher, we need to join with courses table
		if (filters?.teacherWalletAddress) {
			const { data: courses } = await this.supabaseService
				.getClient()
				.from("courses")
				.select("id")
				.eq("teacher_wallet_address", filters.teacherWalletAddress);

			if (courses && courses.length > 0) {
				const courseIds = courses.map((c) => c.id);
				query = query.in("course_id", courseIds);
			} else {
				return [];
			}
		}

		const { data, error } = await query.order("created_at", { ascending: false });

		if (error) {
			throw new Error(`Failed to fetch reviews: ${error.message}`);
		}

		return data.map(this.mapToReview);
	}

	async findOne(id: string): Promise<Review> {
		const { data, error } = await this.supabaseService
			.getClient()
			.from("course_reviews")
			.select("*")
			.eq("id", id)
			.single();

		if (error || !data) {
			throw new NotFoundException(`Review with ID ${id} not found`);
		}

		return this.mapToReview(data);
	}

	async update(id: string, updateReviewInput: UpdateReviewInput): Promise<Review> {
		const updateData: Partial<{
			rating: number;
			review_text: string;
		}> = {};

		if (updateReviewInput.rating !== undefined) {
			updateData.rating = updateReviewInput.rating;
		}
		if (updateReviewInput.comment !== undefined) {
			updateData.review_text = updateReviewInput.comment;
		}

		const { data, error } = await this.supabaseService
			.getClient()
			.from("course_reviews")
			.update(updateData)
			.eq("id", id)
			.select()
			.single();

		if (error || !data) {
			throw new NotFoundException(`Review with ID ${id} not found`);
		}

		// Update course rating
		await this.updateCourseRating(data.course_id);

		return this.mapToReview(data);
	}

	async hasUserPurchasedCourse(studentWalletAddress: string, courseId: string): Promise<boolean> {
		const { data, error } = await this.supabaseService
			.getClient()
			.from("user_courses")
			.select("*")
			.eq("user_wallet_address", studentWalletAddress)
			.eq("course_id", courseId)
			.single();

		return !error && data !== null;
	}

	async findUserReviewForCourse(studentWalletAddress: string, courseId: string): Promise<Review | null> {
		const { data, error } = await this.supabaseService
			.getClient()
			.from("course_reviews")
			.select("*")
			.eq("user_wallet_address", studentWalletAddress)
			.eq("course_id", courseId)
			.single();

		if (error || !data) {
			return null;
		}

		return this.mapToReview(data);
	}

	async calculateCourseRating(courseId: string): Promise<{ rating: number; reviewCount: number }> {
		const { data, error } = await this.supabaseService
			.getClient()
			.from("course_reviews")
			.select("rating")
			.eq("course_id", courseId);

		if (error) {
			throw new Error(`Failed to calculate course rating: ${error.message}`);
		}

		if (!data || data.length === 0) {
			return { rating: 0, reviewCount: 0 };
		}

		const sum = data.reduce((acc, review) => acc + review.rating, 0);
		const average = sum / data.length;

		return { rating: Math.round(average * 100) / 100, reviewCount: data.length };
	}

	async updateCourseRating(courseId: string): Promise<void> {
		const { rating } = await this.calculateCourseRating(courseId);
		await this.courseService.updateCourseStats(courseId, { rating });
	}

	async getReviewCountByCourseId(courseId: string): Promise<number> {
		const { count, error } = await this.supabaseService
			.getClient()
			.from("course_reviews")
			.select("*", { count: "exact", head: true })
			.eq("course_id", courseId);

		if (error) {
			throw new Error(`Failed to get review count: ${error.message}`);
		}

		return count || 0;
	}

	private mapToReview(data: ReviewRow): Review {
		return {
			id: data.id,
			courseId: data.course_id,
			studentWalletAddress: data.user_wallet_address,
			rating: data.rating,
			comment: data.review_text,
			createdAt: new Date(data.created_at),
			updatedAt: new Date(data.updated_at),
		};
	}
}
