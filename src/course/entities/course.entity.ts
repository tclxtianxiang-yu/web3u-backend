import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";
import { Review } from "../../review/entities/review.entity";

@ObjectType()
export class Course {
	@Field(() => ID)
	id: string;

	@Field()
	title: string;

	@Field({ nullable: true })
	description?: string;

	@Field()
	teacherWalletAddress: string;

	@Field(() => Float)
	priceYd: number;

	@Field({ nullable: true })
	category?: string;

	@Field({ nullable: true })
	thumbnailUrl?: string;

	@Field({ nullable: true })
	videoUrl?: string;

	@Field(() => Int)
	totalLessons: number;

	@Field(() => Int)
	totalDuration: number;

	@Field(() => Float)
	rating: number;

	@Field(() => Int)
	totalStudents: number;

	@Field()
	status: string;

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;

	// Field resolvers - will be implemented in the resolver
	@Field(() => Int)
	reviewCount?: number;

	@Field(() => [Review])
	reviews?: Review[];
}

@ObjectType()
export class CourseLesson {
	@Field(() => ID)
	id: string;

	@Field(() => ID)
	courseId: string;

	@Field(() => Int)
	lessonNumber: number;

	@Field()
	title: string;

	@Field({ nullable: true })
	description?: string;

	@Field()
	videoUrl: string;

	@Field(() => Int)
	duration: number;

	@Field()
	isFree: boolean;

	@Field()
	createdAt: Date;
}
