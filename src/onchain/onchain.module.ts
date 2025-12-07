import { Module } from "@nestjs/common";
import { OnchainService } from "./onchain.service";
import { OnchainResolver } from "./onchain.resolver";
import { AuthModule } from "../auth/auth.module";

@Module({
	imports: [AuthModule],
	providers: [OnchainService, OnchainResolver],
	exports: [OnchainService],
})
export class OnchainModule {}
