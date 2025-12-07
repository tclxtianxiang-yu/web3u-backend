import { forwardRef, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";
import { verifyMessage } from "viem";
import { UserService } from "../user/user.service";
import type { LoginInput } from "./dto/login.input";

type JwtPayload = { walletAddress: string };

@Injectable()
export class AuthService {
	constructor(
		@Inject(forwardRef(() => UserService))
		private readonly userService: UserService,
	) {}

	private readonly jwtSecret = process.env.JWT_SECRET;
	private readonly maxSkewMs = 5 * 60 * 1000; // 5 minutes

	async login(input: LoginInput): Promise<string> {
		if (!this.jwtSecret) {
			throw new Error("JWT_SECRET 未配置");
		}

		this.ensureMessageFresh(input.message);

		const ok = await verifyMessage({
			address: input.walletAddress as `0x${string}`,
			message: input.message,
			signature: input.signature as `0x${string}`,
		});

		if (!ok) {
			throw new UnauthorizedException("签名校验失败");
		}

		// 登录即注册：若用户不存在则创建默认账号
		await this.userService.ensureUserExists(input.walletAddress);

		return jwt.sign({ walletAddress: input.walletAddress }, this.jwtSecret, { expiresIn: "1d" });
	}

	verifyToken(token: string): JwtPayload {
		if (!this.jwtSecret) {
			throw new Error("JWT_SECRET 未配置");
		}
		return jwt.verify(token, this.jwtSecret) as JwtPayload;
	}

	private ensureMessageFresh(message: string) {
		const match = message.match(/Login to Web3 University:(\d+)/);
		if (!match) {
			throw new UnauthorizedException("签名消息格式不正确，应包含时间戳，如 Login to Web3 University:<timestamp>");
		}
		const ts = Number.parseInt(match[1], 10);
		if (Number.isNaN(ts)) {
			throw new UnauthorizedException("签名消息时间戳无效");
		}
		const now = Date.now();
		if (Math.abs(now - ts) > this.maxSkewMs) {
			throw new UnauthorizedException("签名消息已过期或时间偏差过大");
		}
	}
}
