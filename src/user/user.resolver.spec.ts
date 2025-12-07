import { Test } from "@nestjs/testing";
import { UserResolver } from "./user.resolver";
import { UserService } from "./user.service";

describe("UserResolver", () => {
	let resolver: UserResolver;
	let service: UserService;

	beforeEach(async () => {
		const module = await Test.createTestingModule({
			providers: [
				UserResolver,
				{
					provide: UserService,
					useValue: {
						create: jest.fn(),
						findAll: jest.fn(),
						findOne: jest.fn(),
						update: jest.fn(),
						remove: jest.fn(),
					},
				},
			],
		}).compile();

		resolver = module.get(UserResolver);
		service = module.get(UserService);
	});

	it("createUser 调用 service.create", async () => {
		(service.create as jest.Mock).mockResolvedValue({ walletAddress: "0xabc" });
		const input = { walletAddress: "0xabc", username: "alice", email: "a@example.com", role: "student" };

		const res = await resolver.createUser(input as any);
		expect(service.create).toHaveBeenCalledWith(input);
		expect(res.walletAddress).toBe("0xabc");
	});

	it("findAll 调用 service.findAll", async () => {
		(service.findAll as jest.Mock).mockResolvedValue([{ walletAddress: "0xabc" }]);
		const res = await resolver.findAll();
		expect(service.findAll).toHaveBeenCalled();
		expect(res[0].walletAddress).toBe("0xabc");
	});

	it("findOne 调用 service.findOne", async () => {
		(service.findOne as jest.Mock).mockResolvedValue({ walletAddress: "0xabc" });
		const res = await resolver.findOne("0xabc");
		expect(service.findOne).toHaveBeenCalledWith("0xabc");
		expect(res.walletAddress).toBe("0xabc");
	});

	it("updateUser 调用 service.update", async () => {
		(service.update as jest.Mock).mockResolvedValue({ walletAddress: "0xabc", username: "bob" });
		const res = await resolver.updateUser("0xabc", { username: "bob" } as any);
		expect(service.update).toHaveBeenCalledWith("0xabc", { username: "bob" });
		expect(res.username).toBe("bob");
	});

	it("removeUser 调用 service.remove", async () => {
		(service.remove as jest.Mock).mockResolvedValue(true);
		const res = await resolver.removeUser("0xabc");
		expect(service.remove).toHaveBeenCalledWith("0xabc");
		expect(res).toBe(true);
	});
});
