import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class LearningRecord {
  @Field(() => ID)
  id: string;

  @Field()
  userWalletAddress: string;

  @Field(() => ID)
  courseId: string;

  @Field(() => ID, { nullable: true })
  lessonId: string | null;

  @Field(() => Int)
  watchTime: number;

  @Field(() => Int)
  progressPercentage: number;

  @Field()
  completed: boolean;

  @Field()
  lastWatchedAt: Date;

  @Field()
  createdAt: Date;
}
