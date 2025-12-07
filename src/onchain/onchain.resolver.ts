import { Args, Mutation, Resolver } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { CompleteCourseOnchainInput } from "./dto/complete-course.input";
import { AwardTeacherBadgeInput } from "./dto/award-teacher-badge.input";
import { OnchainTransaction } from "./entities/onchain-transaction.entity";
import { OnchainService } from "./onchain.service";
import { GqlAuthGuard } from "../auth/gql-auth.guard";

@Resolver(() => OnchainTransaction)
export class OnchainResolver {
	constructor(private readonly onchainService: OnchainService) {}

	@UseGuards(GqlAuthGuard)
	@Mutation(() => OnchainTransaction, { description: "学生完成课程后，由后端调用 CoursePlatform.completeCourse 铸造证书" })
	completeCourseOnchain(@Args("input") input: CompleteCourseOnchainInput) {
		return this.onchainService.completeCourse(input);
	}

	@UseGuards(GqlAuthGuard)
	@Mutation(() => OnchainTransaction, { description: "课程评分达标后，由后端调用 CoursePlatform.awardTeacherBadge 铸造教师徽章" })
	awardTeacherBadgeOnchain(@Args("input") input: AwardTeacherBadgeInput) {
		return this.onchainService.awardTeacherBadge(input);
	}
}
