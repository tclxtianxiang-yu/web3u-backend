import { Field, InputType } from "@nestjs/graphql";
import { IsEthereumAddress, IsNotEmpty, IsString, IsUrl } from "class-validator";

@InputType()
export class CompleteCourseOnchainInput {
	@Field()
	@IsEthereumAddress()
	studentAddress: string;

	@Field()
	@IsString()
	@IsNotEmpty()
	courseId: string;

	@Field()
	@IsString()
	@IsNotEmpty()
	@IsUrl({ require_tld: false })
	metadataURI: string;
}
