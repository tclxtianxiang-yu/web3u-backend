export const coursePlatformAbi = [
	{
		type: "function",
		name: "hasPurchased",
		inputs: [
			{ name: "student", type: "address", internalType: "address" },
			{ name: "courseId", type: "string", internalType: "string" },
		],
		outputs: [{ name: "", type: "bool", internalType: "bool" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "completeCourse",
		inputs: [
			{ name: "student", type: "address", internalType: "address" },
			{ name: "courseId", type: "string", internalType: "string" },
			{ name: "metadataURI", type: "string", internalType: "string" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "awardTeacherBadge",
		inputs: [
			{ name: "courseId", type: "string", internalType: "string" },
			{ name: "ratingScore", type: "uint8", internalType: "uint8" },
			{ name: "metadataURI", type: "string", internalType: "string" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
] as const;
