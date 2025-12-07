import { Field, ID, Int, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class OnchainTransaction {
	@Field(() => ID)
	transactionHash: string;

	@Field(() => Int)
	chainId: number;

	@Field(() => Int, { nullable: true })
	blockNumber?: number;

	@Field()
	status: "success" | "reverted";
}
