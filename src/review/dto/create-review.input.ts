import { Field, InputType, Int } from "@nestjs/graphql";
import { IsEthereumAddress, IsNotEmpty, IsOptional, Max, Min } from "class-validator";

@InputType()
export class CreateReviewInput {
	@Field()
	@IsNotEmpty()
	courseId: string;

	@Field()
	@IsEthereumAddress()
	studentWalletAddress: string;

	@Field(() => Int)
	@Min(1)
	@Max(5)
	rating: number;

	@Field({ nullable: true })
	@IsOptional()
	comment?: string;
}
