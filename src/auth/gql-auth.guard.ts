import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { AuthService } from "./auth.service";

@Injectable()
export class GqlAuthGuard implements CanActivate {
	constructor(private readonly authService: AuthService) {}

	canActivate(context: ExecutionContext): boolean {
		const ctx = GqlExecutionContext.create(context);
		const req = ctx.getContext().req;

		const authHeader = req.headers?.authorization ?? "";
		if (!authHeader.startsWith("Bearer ")) {
			throw new UnauthorizedException("缺少授权头");
		}

		const token = authHeader.replace("Bearer ", "").trim();
		if (!token) {
			throw new UnauthorizedException("缺少 token");
		}

		try {
			const payload = this.authService.verifyToken(token);
			req.user = payload;
			return true;
		} catch {
			throw new UnauthorizedException("token 无效或已过期");
		}
	}
}
