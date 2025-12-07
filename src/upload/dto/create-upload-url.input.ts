import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty } from "class-validator";

@InputType()
export class CreateUploadUrlInput {
	@Field()
	@IsNotEmpty()
	fileName: string;

	@Field()
	@IsNotEmpty()
	contentType: string;
}
