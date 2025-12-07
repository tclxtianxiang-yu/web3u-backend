import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
export class UpdateLearningRecordInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  watchTime?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  progressPercentage?: number;

  @Field({ nullable: true })
  @IsOptional()
  completed?: boolean;
}
