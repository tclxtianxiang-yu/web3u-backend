/**
 * 迁移脚本: 将 learning_records 表的 lesson_id 改为可空
 * 这允许单视频课程不需要 lessons 表中的记录
 */

import "dotenv/config";
import postgres from "postgres";

async function main() {
	// 从 DATABASE_URL 解析连接信息
	const DATABASE_URL = process.env.DATABASE_URL;

	if (!DATABASE_URL) {
		console.error("❌ 缺少 DATABASE_URL 环境变量");
		process.exit(1);
	}

	console.log("\n🔄 开始数据库迁移...");
	console.log("  迁移: 使 learning_records.lesson_id 可空\n");

	// 连接数据库
	const sql = postgres(DATABASE_URL);

	try {
		console.log("1️⃣  删除现有的外键约束...");
		await sql`
			ALTER TABLE learning_records
			DROP CONSTRAINT IF EXISTS learning_records_lesson_id_fkey
		`;
		console.log("   ✅ 外键约束已删除\n");

		console.log("2️⃣  将 lesson_id 列改为可空...");
		await sql`
			ALTER TABLE learning_records
			ALTER COLUMN lesson_id DROP NOT NULL
		`;
		console.log("   ✅ lesson_id 现在可以为 NULL\n");

		console.log("3️⃣  重新添加外键约束(允许 NULL)...");
		await sql`
			ALTER TABLE learning_records
			ADD CONSTRAINT learning_records_lesson_id_fkey
			FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE
		`;
		console.log("   ✅ 外键约束已重新添加\n");

		console.log("4️⃣  删除旧的唯一约束...");
		await sql`
			ALTER TABLE learning_records
			DROP CONSTRAINT IF EXISTS learning_records_user_wallet_address_course_id_lesson_id_key
		`;
		console.log("   ✅ 旧唯一约束已删除\n");

		console.log("5️⃣  创建新的唯一索引(处理 NULL 值)...");

		// 对于非 NULL 的 lesson_id,保证 (user, course, lesson) 唯一
		await sql`
			CREATE UNIQUE INDEX IF NOT EXISTS learning_records_user_course_lesson_unique
			ON learning_records (user_wallet_address, course_id, lesson_id)
			WHERE lesson_id IS NOT NULL
		`;
		console.log("   ✅ 已创建索引: learning_records_user_course_lesson_unique\n");

		// 对于 NULL 的 lesson_id,保证 (user, course) 唯一
		await sql`
			CREATE UNIQUE INDEX IF NOT EXISTS learning_records_user_course_null_lesson_unique
			ON learning_records (user_wallet_address, course_id)
			WHERE lesson_id IS NULL
		`;
		console.log("   ✅ 已创建索引: learning_records_user_course_null_lesson_unique\n");

		console.log("✨ 迁移成功完成!");
		console.log("\n📊 新架构:");
		console.log("  • 单视频课程: lesson_id = NULL");
		console.log("  • 多课时课程: lesson_id = 实际课时 ID");
		console.log("  • 每个用户每门课程只能有一条 NULL lesson_id 记录");
		console.log("  • 每个用户每门课程可以有多条不同 lesson_id 的记录\n");

		await sql.end();
	} catch (error: any) {
		console.error("\n❌ 迁移失败:");
		console.error(error.message);
		console.error("\n详细错误:");
		console.error(error);
		await sql.end();
		process.exit(1);
	}
}

main().catch((error) => {
	console.error("\n❌ 脚本执行失败:");
	console.error(error);
	process.exit(1);
});
