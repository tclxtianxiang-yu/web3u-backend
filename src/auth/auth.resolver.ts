import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { AuthService } from "./auth.service";
import { AuthToken } from "./entities/auth-token.entity";
import { LoginInput } from "./dto/login.input";

@Resolver(() => AuthToken)
export class AuthResolver {
	constructor(private readonly authService: AuthService) {}

	@Mutation(() => AuthToken, { description: "钱包签名登录，返回 JWT。签名消息格式：Login to Web3 University:<timestamp_ms>，有效期5分钟。" })
	async login(@Args("input") input: LoginInput): Promise<AuthToken> {
		const token = await this.authService.login(input);
		return { token };
	}
}
