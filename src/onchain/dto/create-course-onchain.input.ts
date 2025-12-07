import { Field, Float, InputType } from "@nestjs/graphql";
import { IsEthereumAddress, IsNotEmpty, Min } from "class-validator";

@InputType()
export class CreateCourseOnchainInput {
	@Field()
	@IsNotEmpty()
	courseId: string;

	@Field()
	@IsEthereumAddress()
	teacherAddress: string;

	@Field(() => Float)
	@Min(0.01)
	priceYd: number;

	@Field({ defaultValue: true })
	shouldPublish: boolean;
}
