import { Field, Float, InputType } from "@nestjs/graphql";
import { IsIn, IsOptional } from "class-validator";

@InputType()
export class UpdateCourseInput {
	@Field({ nullable: true })
	@IsOptional()
	title?: string;

	@Field({ nullable: true })
	@IsOptional()
	description?: string;

	@Field({ nullable: true })
	@IsOptional()
	category?: string;

	@Field({ nullable: true })
	@IsOptional()
	thumbnailUrl?: string;

	@Field({ nullable: true })
	@IsOptional()
	videoUrl?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsIn(["draft", "published", "archived"])
	status?: string;

	@Field(() => Float, { nullable: true })
	@IsOptional()
	priceYd?: number;
}
