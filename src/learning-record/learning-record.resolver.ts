import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { LearningRecordService } from './learning-record.service';
import { LearningRecord } from './entities/learning-record.entity';
import { CreateLearningRecordInput } from './dto/create-learning-record.input';
import { UpdateLearningRecordInput } from './dto/update-learning-record.input';

@Resolver(() => LearningRecord)
export class LearningRecordResolver {
  constructor(private readonly learningRecordService: LearningRecordService) {}

  @Mutation(() => LearningRecord)
  createLearningRecord(@Args('createLearningRecordInput') createLearningRecordInput: CreateLearningRecordInput) {
    return this.learningRecordService.create(createLearningRecordInput);
  }

  @Query(() => [LearningRecord], { name: 'learningRecords' })
  findAll(
    @Args('userWalletAddress', { nullable: true }) userWalletAddress?: string,
    @Args('courseId', { type: () => ID, nullable: true }) courseId?: string,
  ) {
    return this.learningRecordService.findAll({ userWalletAddress, courseId });
  }

  @Query(() => LearningRecord, { name: 'learningRecord' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.learningRecordService.findOne(id);
  }

  @Mutation(() => LearningRecord)
  updateLearningRecord(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateLearningRecordInput') updateLearningRecordInput: UpdateLearningRecordInput,
  ) {
    return this.learningRecordService.update(id, updateLearningRecordInput);
  }
}
