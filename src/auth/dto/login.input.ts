import { Field, InputType } from "@nestjs/graphql";
import { IsEthereumAddress, IsNotEmpty, IsString } from "class-validator";

@InputType()
export class LoginInput {
	@Field()
	@IsEthereumAddress()
	walletAddress: string;

	@Field()
	@IsString()
	@IsNotEmpty()
	message: string;

	@Field()
	@IsString()
	@IsNotEmpty()
	signature: string;
}
