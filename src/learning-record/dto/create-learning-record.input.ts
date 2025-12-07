import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { IsEthereumAddress } from 'class-validator';

@InputType()
export class CreateLearningRecordInput {
  @Field()
  @IsEthereumAddress()
  userWalletAddress: string;

  @Field(() => ID)
  courseId: string;

  @Field(() => ID)
  lessonId: string;

  @Field(() => Int, { defaultValue: 0 })
  watchTime: number;

  @Field(() => Int, { defaultValue: 0 })
  progressPercentage: number;

  @Field({ defaultValue: false })
  completed: boolean;
}
