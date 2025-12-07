import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { CreateUploadUrlInput } from "./dto/create-upload-url.input";
import { UploadUrl } from "./entities/upload-url.entity";
import { UploadService } from "./upload.service";
import { GqlAuthGuard } from "../auth/gql-auth.guard";

@Resolver(() => UploadUrl)
export class UploadResolver {
	constructor(private readonly uploadService: UploadService) {}

	@UseGuards(GqlAuthGuard)
	@Mutation(() => UploadUrl, { description: "生成上传到 AWS S3 的直传签名 URL（PUT）。前端可直接用该 URL 上传视频文件。" })
	generateVideoUploadUrl(@Args("input") input: CreateUploadUrlInput) {
		return this.uploadService.createUploadUrl(input);
	}
}
