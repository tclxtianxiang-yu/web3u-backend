import { forwardRef, Module } from "@nestjs/common";
import { ReviewModule } from "../review/review.module";
import { SupabaseModule } from "../supabase/supabase.module";
import { CourseResolver } from "./course.resolver";
import { CourseService } from "./course.service";

@Module({
	imports: [SupabaseModule, forwardRef(() => ReviewModule)],
	providers: [CourseService, CourseResolver],
	exports: [CourseService],
})
export class CourseModule {}
