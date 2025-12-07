import { Args, ID, Int, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { Review } from "../review/entities/review.entity";
import { ReviewService } from "../review/review.service";
import { CourseService } from "./course.service";
import { CreateCourseInput } from "./dto/create-course.input";
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

	@ResolveField(() => Int)
	async reviewCount(@Parent() course: Course): Promise<number> {
		return this.reviewService.getReviewCountByCourseId(course.id);
	}

	@ResolveField(() => [Review])
	async reviews(@Parent() course: Course): Promise<Review[]> {
		return this.reviewService.findAll({ courseId: course.id });
	}
}
