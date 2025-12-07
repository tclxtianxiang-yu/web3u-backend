import { Field, Float, InputType } from "@nestjs/graphql";
import { IsEthereumAddress, IsIn, IsNotEmpty } from "class-validator";

@InputType()
export class CreateCourseInput {
	@Field()
	@IsNotEmpty()
	title: string;

	@Field({ nullable: true })
	description?: string;

	@Field()
	@IsEthereumAddress()
	teacherWalletAddress: string;

	@Field(() => Float)
	priceYd: number;

	@Field({ nullable: true })
	category?: string;

	@Field({ nullable: true })
	thumbnailUrl?: string;

	@Field({ nullable: true })
	videoUrl?: string;

	@Field({ defaultValue: "draft" })
	@IsIn(["draft", "published", "archived"])
	status: string;
}
