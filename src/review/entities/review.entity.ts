import { Field, ID, Int, ObjectType } from "@nestjs/graphql";
import { Course } from "../../course/entities/course.entity";
import { User } from "../../user/entities/user.entity";

@ObjectType()
export class Review {
	@Field(() => ID)
	id: string;

	@Field(() => ID)
	courseId: string;

	@Field()
	studentWalletAddress: string;

	@Field(() => Int)
	rating: number;

	@Field({ nullable: true })
	comment?: string;

	@Field()
	createdAt: Date;

	@Field()
	updatedAt: Date;

	// Field resolvers - will be implemented in the resolver
	@Field(() => Course, { nullable: true })
	course?: Course;

	@Field(() => User, { nullable: true })
	student?: User;
}
