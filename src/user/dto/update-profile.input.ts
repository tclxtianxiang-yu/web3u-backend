import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, IsOptional } from "class-validator";

@InputType()
export class UpdateProfileInput {
	@Field({ nullable: true })
	@IsOptional()
	username?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsEmail()
	email?: string;

	@Field({ nullable: true })
	@IsOptional()
	avatarUrl?: string | null;
}
