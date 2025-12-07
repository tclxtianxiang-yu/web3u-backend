import { Module } from '@nestjs/common';
import { LearningRecordService } from './learning-record.service';
import { LearningRecordResolver } from './learning-record.resolver';

@Module({
  providers: [LearningRecordService, LearningRecordResolver],
  exports: [LearningRecordService],
})
export class LearningRecordModule {}
