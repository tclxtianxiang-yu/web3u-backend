import { Injectable, OnModuleInit } from "@nestjs/common";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { extname } from "node:path";
import { randomUUID } from "node:crypto";
import type { CreateUploadUrlInput } from "./dto/create-upload-url.input";
import type { UploadUrl } from "./entities/upload-url.entity";

@Injectable()
export class UploadService implements OnModuleInit {
	private s3Client!: S3Client;
	private bucket!: string;
	private region!: string;
	private publicBaseUrl?: string;

	onModuleInit() {
		const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
		const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;
		const bucket = process.env.AWS_S3_BUCKET_NAME;
		const region = process.env.AWS_S3_REGION;
		const publicBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL;

		if (!accessKeyId || !secretAccessKey || !bucket || !region) {
			throw new Error(
				"AWS S3 配置缺失，请检查 AWS_S3_ACCESS_KEY_ID / AWS_S3_SECRET_ACCESS_KEY / AWS_S3_BUCKET_NAME / AWS_S3_REGION",
			);
		}

		this.bucket = bucket;
		this.region = region;
		this.publicBaseUrl = publicBaseUrl;

		this.s3Client = new S3Client({
			region: this.region,
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
		});
	}

	async createUploadUrl(input: CreateUploadUrlInput): Promise<UploadUrl> {
		const key = this.buildObjectKey(input.fileName);
		const command = new PutObjectCommand({
			Bucket: this.bucket,
			Key: key,
			ContentType: input.contentType,
		});

		const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 15 * 60 }); // 15 minutes

		return {
			uploadUrl,
			key,
			publicUrl: this.buildPublicUrl(key),
		};
	}

	private buildObjectKey(fileName: string): string {
		const ext = extname(fileName);
		return `videos/${Date.now()}-${randomUUID()}${ext}`;
	}

	private buildPublicUrl(key: string): string {
		if (this.publicBaseUrl) {
			return `${this.publicBaseUrl.replace(/\/$/, "")}/${key}`;
		}
		// 如果 bucket 为私有，建议改用 GET 签名 URL，此处保留公开直链形式
		return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
	}
}
