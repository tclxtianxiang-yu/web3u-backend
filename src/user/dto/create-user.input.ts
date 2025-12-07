import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, IsEthereumAddress, IsIn, IsOptional } from "class-validator";

@InputType()
export class CreateUserInput {
	@Field()
	@IsEthereumAddress()
	walletAddress: string;

	@Field({ nullable: true })
	@IsOptional()
	username?: string;

	@Field({ nullable: true })
	@IsOptional()
	@IsEmail()
	email?: string;

	@Field()
	@IsIn(["student", "teacher", "admin"])
	role: string;
}
