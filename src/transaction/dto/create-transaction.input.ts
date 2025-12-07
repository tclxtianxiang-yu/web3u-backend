import { InputType, Field, Float } from '@nestjs/graphql';
import { IsEthereumAddress, IsIn } from 'class-validator';
import { GraphQLJSONObject } from 'graphql-type-json';

@InputType()
export class CreateTransactionInput {
  @Field()
  @IsEthereumAddress()
  fromWalletAddress: string;

  @Field()
  @IsEthereumAddress()
  toWalletAddress: string;

  @Field(() => Float)
  amountYd: number;

  @Field()
  @IsIn(['course_purchase', 'teacher_payment', 'token_purchase', 'withdrawal'])
  transactionType: string;

  @Field({ nullable: true })
  transactionHash?: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  metadata?: Record<string, unknown>;
}
