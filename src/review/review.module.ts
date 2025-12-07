import { forwardRef, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CourseModule } from "../course/course.module";
import { SupabaseModule } from "../supabase/supabase.module";
import { UserModule } from "../user/user.module";
import { ReviewResolver } from "./review.resolver";
import { ReviewService } from "./review.service";

@Module({
	imports: [SupabaseModule, forwardRef(() => CourseModule), UserModule, AuthModule],
	providers: [ReviewService, ReviewResolver],
	exports: [ReviewService],
})
export class ReviewModule {}
