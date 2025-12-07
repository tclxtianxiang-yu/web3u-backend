import { ForbiddenException, UseGuards } from "@nestjs/common";
import { Args, ID, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "../auth/current-user.decorator";
import { GqlAuthGuard } from "../auth/gql-auth.guard";
import { CourseService } from "../course/course.service";
import { Course } from "../course/entities/course.entity";
import { User } from "../user/entities/user.entity";
import { UserService } from "../user/user.service";
import { CreateReviewInput } from "./dto/create-review.input";
import { UpdateReviewInput } from "./dto/update-review.input";
import { Review } from "./entities/review.entity";
import { ReviewService } from "./review.service";

@Resolver(() => Review)
export class ReviewResolver {
	constructor(
		private readonly reviewService: ReviewService,
		private readonly courseService: CourseService,
		private readonly userService: UserService,
	) {}

	@Mutation(() => Review, {
		description: "Create a review for a course (requires authentication)",
	})
	@UseGuards(GqlAuthGuard)
	async createReview(
		@Args("createReviewInput") createReviewInput: CreateReviewInput,
		@CurrentUser() user: any,
	): Promise<Review> {
		// Validate that the studentWalletAddress matches the authenticated user
		if (createReviewInput.studentWalletAddress.toLowerCase() !== user.walletAddress.toLowerCase()) {
			throw new ForbiddenException("You can only create reviews for yourself");
		}

		return this.reviewService.create(createReviewInput);
	}

	@Mutation(() => Review, {
		description: "Update an existing review (requires authentication)",
	})
	@UseGuards(GqlAuthGuard)
	async updateReview(
		@Args("id", { type: () => ID }) id: string,
		@Args("updateReviewInput") updateReviewInput: UpdateReviewInput,
		@CurrentUser() user: any,
	): Promise<Review> {
		// Verify that the review belongs to the authenticated user
		const existingReview = await this.reviewService.findOne(id);
		if (existingReview.studentWalletAddress.toLowerCase() !== user.walletAddress.toLowerCase()) {
			throw new ForbiddenException("You can only update your own reviews");
		}

		return this.reviewService.update(id, updateReviewInput);
	}

	@Query(() => [Review], { name: "reviews" })
	async findAll(
		@Args("courseId", { type: () => ID, nullable: true }) courseId?: string,
		@Args("teacherWalletAddress", { nullable: true }) teacherWalletAddress?: string,
		@Args("studentWalletAddress", { nullable: true }) studentWalletAddress?: string,
	): Promise<Review[]> {
		return this.reviewService.findAll({
			courseId,
			teacherWalletAddress,
			studentWalletAddress,
		});
	}

	@Query(() => Review, { name: "review" })
	async findOne(@Args("id", { type: () => ID }) id: string): Promise<Review> {
		return this.reviewService.findOne(id);
	}

	@ResolveField(() => Course)
	async course(@Parent() review: Review): Promise<Course> {
		return this.courseService.findOne(review.courseId);
	}

	@ResolveField(() => User)
	async student(@Parent() review: Review): Promise<User> {
		return this.userService.findOne(review.studentWalletAddress);
	}
}
