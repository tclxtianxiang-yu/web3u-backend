import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class UploadUrl {
	@Field()
	uploadUrl: string;

	@Field()
	key: string;

	@Field()
	publicUrl: string;
}
