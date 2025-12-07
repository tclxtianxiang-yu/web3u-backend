import { Field, InputType, Int } from "@nestjs/graphql";
import { IsEthereumAddress, IsInt, IsNotEmpty, IsString, IsUrl, Max, Min } from "class-validator";

@InputType()
export class AwardTeacherBadgeInput {
	@Field()
	@IsEthereumAddress()
	teacherAddress: string;

	@Field()
	@IsString()
	@IsNotEmpty()
	courseId: string;

	@Field(() => Int)
	@IsInt()
	@Min(80)
	@Max(100)
	ratingScore: number;

	@Field()
	@IsString()
	@IsNotEmpty()
	@IsUrl({ require_tld: false })
	metadataURI: string;
}
