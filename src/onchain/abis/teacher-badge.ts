export const teacherBadgeAbi = [
	{
		type: "function",
		name: "hasBadge",
		inputs: [
			{ name: "teacher", type: "address", internalType: "address" },
			{ name: "courseId", type: "string", internalType: "string" },
		],
		outputs: [{ name: "", type: "bool", internalType: "bool" }],
		stateMutability: "view",
	},
] as const;
