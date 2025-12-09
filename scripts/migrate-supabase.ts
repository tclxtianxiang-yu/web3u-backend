/**
 * 使用 Supabase REST API 执行 SQL 迁移
 */

import "dotenv/config";

async function main() {
	const SUPABASE_URL = process.env.SUPABASE_URL;
	const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
		console.error("❌ 缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 环境变量");
		process.exit(1);
	}

	console.log("\n🔄 开始数据库迁移...");
	console.log("  迁移: 使 learning_records.lesson_id 可空\n");

	const statements = [
		{
			name: "删除现有的外键约束",
			sql: "ALTER TABLE learning_records DROP CONSTRAINT IF EXISTS learning_records_lesson_id_fkey;",
		},
		{
			name: "将 lesson_id 列改为可空",
			sql: "ALTER TABLE learning_records ALTER COLUMN lesson_id DROP NOT NULL;",
		},
		{
			name: "重新添加外键约束(允许 NULL)",
			sql: "ALTER TABLE learning_records ADD CONSTRAINT learning_records_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE;",
		},
		{
			name: "删除旧的唯一约束",
			sql: "ALTER TABLE learning_records DROP CONSTRAINT IF EXISTS learning_records_user_wallet_address_course_id_lesson_id_key;",
		},
		{
			name: "创建新的唯一索引(非NULL)",
			sql: "CREATE UNIQUE INDEX IF NOT EXISTS learning_records_user_course_lesson_unique ON learning_records (user_wallet_address, course_id, lesson_id) WHERE lesson_id IS NOT NULL;",
		},
		{
			name: "创建新的唯一索引(NULL)",
			sql: "CREATE UNIQUE INDEX IF NOT EXISTS learning_records_user_course_null_lesson_unique ON learning_records (user_wallet_address, course_id) WHERE lesson_id IS NULL;",
		},
	];

	let step = 1;
	for (const statement of statements) {
		console.log(`${step}️⃣  ${statement.name}...`);

		try {
			const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
				method: "POST",
				headers: {
					apikey: SUPABASE_SERVICE_ROLE_KEY,
					Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					query: statement.sql,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.log(`   ⚠️  无法通过 RPC 执行: ${errorText}`);
				console.log(`   📝 请手动执行: ${statement.sql}`);
			} else {
				console.log("   ✅ 完成\n");
			}
		} catch (error: any) {
			console.log(`   ⚠️  执行失败: ${error.message}`);
			console.log(`   📝 请手动执行: ${statement.sql}\n`);
		}

		step++;
	}

	console.log("\n" + "=".repeat(60));
	console.log("⚠️  如果上面的步骤有失败,请手动在 Supabase SQL Editor 中执行:");
	console.log("=".repeat(60) + "\n");

	console.log("-- 1. 删除外键约束");
	console.log("ALTER TABLE learning_records");
	console.log("DROP CONSTRAINT IF EXISTS learning_records_lesson_id_fkey;\n");

	console.log("-- 2. 使 lesson_id 可空");
	console.log("ALTER TABLE learning_records");
	console.log("ALTER COLUMN lesson_id DROP NOT NULL;\n");

	console.log("-- 3. 重新添加外键约束");
	console.log("ALTER TABLE learning_records");
	console.log("ADD CONSTRAINT learning_records_lesson_id_fkey");
	console.log("FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE;\n");

	console.log("-- 4. 删除旧的唯一约束");
	console.log("ALTER TABLE learning_records");
	console.log(
		"DROP CONSTRAINT IF EXISTS learning_records_user_wallet_address_course_id_lesson_id_key;\n",
	);

	console.log("-- 5. 创建新的唯一索引(非NULL)");
	console.log("CREATE UNIQUE INDEX IF NOT EXISTS learning_records_user_course_lesson_unique");
	console.log("ON learning_records (user_wallet_address, course_id, lesson_id)");
	console.log("WHERE lesson_id IS NOT NULL;\n");

	console.log("-- 6. 创建新的唯一索引(NULL)");
	console.log(
		"CREATE UNIQUE INDEX IF NOT EXISTS learning_records_user_course_null_lesson_unique",
	);
	console.log("ON learning_records (user_wallet_address, course_id)");
	console.log("WHERE lesson_id IS NULL;\n");

	console.log("=".repeat(60));
	console.log("\n💡 访问: " + SUPABASE_URL.replace("https://", "https://supabase.com/dashboard/project/"));
	console.log("   然后: SQL Editor → New Query → 粘贴上面的 SQL → Run\n");
}

main().catch((error) => {
	console.error("\n❌ 脚本执行失败:");
	console.error(error);
	process.exit(1);
});
