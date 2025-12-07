import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field()
  walletAddress: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  avatarUrl?: string | null;

  @Field()
  role: string;

  @Field(() => Float)
  ydTokenBalance: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
