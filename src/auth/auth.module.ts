import { forwardRef, Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthResolver } from "./auth.resolver";
import { GqlAuthGuard } from "./gql-auth.guard";
import { UserModule } from "../user/user.module";

@Module({
	imports: [forwardRef(() => UserModule)],
	providers: [AuthService, AuthResolver, GqlAuthGuard],
	exports: [AuthService, GqlAuthGuard],
})
export class AuthModule {}
