import { Args, ID, Int, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { Review } from "../review/entities/review.entity";
import { ReviewService } from "../review/review.service";
import { GqlAuthGuard } from "../auth/gql-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { CourseService } from "./course.service";
import { CreateCourseInput } from "./dto/create-course.input";
import { UpdateCourseInput } from "./dto/update-course.input";
import { Course, CourseLesson } from "./entities/course.entity";

@Resolver(() => Course)
export class CourseResolver {
	constructor(
		private readonly courseService: CourseService,
		private readonly reviewService: ReviewService,
	) {}

	@Mutation(() => Course)
	createCourse(@Args("createCourseInput") createCourseInput: CreateCourseInput) {
		return this.courseService.create(createCourseInput);
	}

	@Query(() => [Course], { name: "courses" })
	findAll(
		@Args("teacherWalletAddress", { nullable: true }) teacherWalletAddress?: string,
		@Args("status", { nullable: true }) status?: string,
		@Args("category", { nullable: true }) category?: string,
	) {
		return this.courseService.findAll({ teacherWalletAddress, status, category });
	}

	@Query(() => Course, { name: "course" })
	findOne(@Args("id", { type: () => ID }) id: string) {
		return this.courseService.findOne(id);
	}

	@Query(() => [CourseLesson], { name: "courseLessons" })
	findLessonsByCourseId(@Args("courseId", { type: () => ID }) courseId: string) {
		return this.courseService.findLessonsByCourseId(courseId);
	}

	@UseGuards(GqlAuthGuard)
	@Mutation(() => Course, { description: "Update an existing course. Only the course owner can update it." })
	updateCourse(
		@Args("courseId", { type: () => ID }) courseId: string,
		@Args("updateCourseInput") updateCourseInput: UpdateCourseInput,
		@CurrentUser() user: { walletAddress: string },
	) {
		return this.courseService.updateCourse(courseId, updateCourseInput, user.walletAddress);
	}

	@UseGuards(GqlAuthGuard)
	@Mutation(() => Course, { description: "Soft delete a course by setting its status to archived. Only the course owner can delete it." })
	removeCourse(
		@Args("courseId", { type: () => ID }) courseId: string,
		@CurrentUser() user: { walletAddress: string },
	) {
		return this.courseService.removeCourse(courseId, user.walletAddress);
	}

	@ResolveField(() => Int)
	async reviewCount(@Parent() course: Course): Promise<number> {
		return this.reviewService.getReviewCountByCourseId(course.id);
	}

	@ResolveField(() => [Review])
	async reviews(@Parent() course: Course): Promise<Review[]> {
		return this.reviewService.findAll({ courseId: course.id });
	}
}
