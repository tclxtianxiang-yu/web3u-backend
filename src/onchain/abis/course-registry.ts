export const courseRegistryAbi = [
	{
		inputs: [
			{ name: "courseId", type: "string" },
			{ name: "teacher", type: "address" },
			{ name: "priceYD", type: "uint256" },
		],
		name: "createCourse",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ name: "courseId", type: "string" },
			{ name: "newStatus", type: "uint8" }, // 0=DRAFT, 1=PUBLISHED, 2=ARCHIVED
		],
		name: "updateCourseStatus",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [{ name: "courseId", type: "string" }],
		name: "courseExists",
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ name: "courseId", type: "string" }],
		name: "isCourseActive",
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [{ name: "courseId", type: "string" }],
		name: "getCourse",
		outputs: [
			{
				components: [
					{ name: "courseId", type: "string" },
					{ name: "teacher", type: "address" },
					{ name: "priceYD", type: "uint256" },
					{ name: "status", type: "uint8" },
					{ name: "totalPurchases", type: "uint256" },
					{ name: "createdAt", type: "uint256" },
					{ name: "updatedAt", type: "uint256" },
				],
				name: "",
				type: "tuple",
			},
		],
		stateMutability: "view",
		type: "function",
	},
] as const;
