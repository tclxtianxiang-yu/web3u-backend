/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	rootDir: "./",
	moduleFileExtensions: ["ts", "js", "json"],
	testMatch: ["**/?(*.)+(spec|test).ts"],
	modulePaths: ["<rootDir>"],
	setupFiles: ["<rootDir>/test/setup-env.ts"],
	globals: {
		"ts-jest": {
			diagnostics: false,
			isolatedModules: true,
		},
	},
};
