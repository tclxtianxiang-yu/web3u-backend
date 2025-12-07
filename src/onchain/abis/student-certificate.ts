export const studentCertificateAbi = [
	{
		type: "function",
		name: "hasCertificate",
		inputs: [
			{ name: "student", type: "address", internalType: "address" },
			{ name: "courseId", type: "string", internalType: "string" },
		],
		outputs: [{ name: "", type: "bool", internalType: "bool" }],
		stateMutability: "view",
	},
] as const;
