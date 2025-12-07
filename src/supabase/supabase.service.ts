import { Injectable, type OnModuleInit } from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService implements OnModuleInit {
	private supabase: SupabaseClient;

	onModuleInit() {
		const supabaseUrl = process.env.SUPABASE_URL;
		const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

		if (!supabaseUrl || !supabaseKey) {
			throw new Error("Supabase URL and Service Role Key must be provided");
		}

		this.supabase = createClient(supabaseUrl, supabaseKey);
	}

	getClient(): SupabaseClient {
		return this.supabase;
	}

	async query(table: string) {
		return this.supabase.from(table);
	}
}
