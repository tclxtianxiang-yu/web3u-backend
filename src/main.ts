import "dotenv/config";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.useGlobalPipes(new ValidationPipe());

	// CORS 配置 - 开发环境允许所有本地端口
	app.enableCors({
		origin: true,
		credentials: true,
		allowedHeaders: ["content-type", "authorization", "x-requested-with"],
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		exposedHeaders: ["authorization"],
		maxAge: 600,
	});

	const port = process.env.PORT || 3000;
	// 在本地沙箱/开发环境使用 127.0.0.1 以避免某些环境对 0.0.0.0 的限制
	const IP = "127.0.0.1";
	await app.listen(port, IP);

	console.log(`🚀 Application is running on: http://${IP}:${port}`);
	console.log(`🎮 GraphQL Playground: http://${IP}:${port}/graphql`);
}

bootstrap();
