/**
 * Run database migration to make lesson_id nullable in learning_records table
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

async function main() {
	const SUPABASE_URL = process.env.SUPABASE_URL;
	const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

	if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
		console.error("❌ 缺少 SUPABASE_URL 或 SUPABASE_SERVICE_KEY 环境变量");
		process.exit(1);
	}

	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

	console.log("\n🔄 开始运行数据库迁移...");
	console.log("  迁移: 001_make_lesson_id_nullable.sql\n");

	try {
		// Read migration file
		const migrationPath = join(__dirname, "../database/migrations/001_make_lesson_id_nullable.sql");
		const migrationSQL = readFileSync(migrationPath, "utf-8");

		console.log("📄 迁移内容:");
		console.log(migrationSQL);
		console.log("\n");

		// Execute migration
		const { error } = await supabase.rpc("exec_sql", { sql: migrationSQL });

		if (error) {
			// If exec_sql doesn't exist, try direct execution
			console.log("⚠️  exec_sql RPC 不可用，尝试直接执行...\n");

			// Split into individual statements and execute
			const statements = migrationSQL
				.split(";")
				.map((s) => s.trim())
				.filter((s) => s.length > 0 && !s.startsWith("--"));

			for (const statement of statements) {
				console.log(`  执行: ${statement.substring(0, 60)}...`);
				const { error: stmtError } = await supabase.from("_migration_tmp").select("*").limit(0);

				if (stmtError) {
					console.error(`  ❌ 语句执行失败: ${stmtError.message}`);
				}
			}

			console.log("\n⚠️  无法直接执行 SQL 迁移");
			console.log("📝 请手动在 Supabase SQL Editor 中执行以下 SQL:\n");
			console.log(migrationSQL);
			console.log("\n💡 步骤:");
			console.log("  1. 访问 Supabase Dashboard > SQL Editor");
			console.log("  2. 创建新查询");
			console.log("  3. 粘贴上面的 SQL 内容");
			console.log("  4. 运行查询");
		} else {
			console.log("✅ 迁移成功完成!");
		}
	} catch (error: any) {
		console.error("\n❌ 迁移失败:");
		console.error(error.message);
		console.log("\n📝 请手动运行迁移 SQL");
		process.exit(1);
	}
}

main().catch((error) => {
	console.error("\n❌ 脚本执行失败:");
	console.error(error);
	process.exit(1);
});
