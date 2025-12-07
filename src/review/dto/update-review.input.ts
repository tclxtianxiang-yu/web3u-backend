import { Field, InputType, Int } from "@nestjs/graphql";
import { IsOptional, Max, Min } from "class-validator";

@InputType()
export class UpdateReviewInput {
	@Field(() => Int, { nullable: true })
	@IsOptional()
	@Min(1)
	@Max(5)
	rating?: number;

	@Field({ nullable: true })
	@IsOptional()
	comment?: string;
}
