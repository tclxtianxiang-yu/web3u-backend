import { UseGuards } from "@nestjs/common";
import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { User } from "./entities/user.entity";
import { CreateUserInput } from "./dto/create-user.input";
import { UpdateUserInput } from "./dto/update-user.input";
import { UpdateProfileInput } from "./dto/update-profile.input";
import { UserService } from "./user.service";
import { GqlAuthGuard } from "../auth/gql-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";

@Resolver(() => User)
export class UserResolver {
	constructor(private readonly userService: UserService) {}

	@Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.userService.create(createUserInput);
  }

	@UseGuards(GqlAuthGuard)
	@Query(() => User, { name: "me", description: "返回当前登录用户信息，无需传入钱包地址" })
	me(@CurrentUser() user: { walletAddress: string }) {
		return this.userService.findOne(user.walletAddress);
	}

	@Query(() => [User], { name: "users" })
	findAll() {
		return this.userService.findAll();
	}

	@Query(() => User, { name: 'user' })
  findOne(@Args('walletAddress') walletAddress: string) {
    return this.userService.findOne(walletAddress);
  }

	@Mutation(() => User)
	updateUser(
		@Args('walletAddress') walletAddress: string,
		@Args('updateUserInput') updateUserInput: UpdateUserInput,
	) {
		return this.userService.update(walletAddress, updateUserInput);
	}

	@Mutation(() => Boolean)
  removeUser(@Args('walletAddress') walletAddress: string) {
    return this.userService.remove(walletAddress);
  }

	@UseGuards(GqlAuthGuard)
	@Mutation(() => User, { description: "更新当前用户个人资料（昵称、邮箱、头像）。需登录。" })
	updateProfile(
		@CurrentUser() user: { walletAddress: string },
		@Args("input") input: UpdateProfileInput,
	) {
		return this.userService.update(user.walletAddress, input);
	}
}
