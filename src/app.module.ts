import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'node:path';
import { SupabaseModule } from './supabase/supabase.module';
import { UserModule } from './user/user.module';
import { CourseModule } from './course/course.module';
import { TransactionModule } from './transaction/transaction.module';
import { LearningRecordModule } from './learning-record/learning-record.module';
import { OnchainModule } from "./onchain/onchain.module";
import { UploadModule } from "./upload/upload.module";
import { AuthModule } from "./auth/auth.module";
import { ReviewModule } from './review/review.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      context: ({ req }) => ({ req }),
    }),
    SupabaseModule,
    UserModule,
    CourseModule,
    TransactionModule,
    LearningRecordModule,
    OnchainModule,
    UploadModule,
    AuthModule,
    ReviewModule,
  ],
})
export class AppModule {}
