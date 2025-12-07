import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType()
export class Transaction {
  @Field(() => ID)
  id: string;

  @Field()
  fromWalletAddress: string;

  @Field()
  toWalletAddress: string;

  @Field(() => Float)
  amountYd: number;

  @Field()
  transactionType: string;

  @Field({ nullable: true })
  transactionHash?: string;

  @Field()
  status: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  metadata?: Record<string, unknown>;

  @Field()
  createdAt: Date;
}
