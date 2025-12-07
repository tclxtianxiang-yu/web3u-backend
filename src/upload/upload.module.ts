import { Module } from "@nestjs/common";
import { UploadService } from "./upload.service";
import { UploadResolver } from "./upload.resolver";
import { AuthModule } from "../auth/auth.module";

@Module({
	imports: [AuthModule],
	providers: [UploadService, UploadResolver],
	exports: [UploadService],
})
export class UploadModule {}
