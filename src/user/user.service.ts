import { Injectable, NotFoundException } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import type { CreateUserInput } from "./dto/create-user.input";
import type { UpdateUserInput } from "./dto/update-user.input";
import type { UpdateProfileInput } from "./dto/update-profile.input";
import type { User } from "./entities/user.entity";

type UserRow = {
	wallet_address: string;
	username: string;
	email: string;
	role: string;
	yd_token_balance?: number | string;
	avatar_url?: string | null;
	created_at: string;
	updated_at: string;
};

@Injectable()
export class UserService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createUserInput: CreateUserInput): Promise<User> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .insert({
        wallet_address: createUserInput.walletAddress,
        username: createUserInput.username,
        email: createUserInput.email,
        role: createUserInput.role,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return this.mapToUser(data);
  }

  async findAll(): Promise<User[]> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data.map(this.mapToUser);
  }

  async findOne(walletAddress: string): Promise<User> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }

    return this.mapToUser(data);
  }

  async findOneOptional(walletAddress: string): Promise<User | null> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data ? this.mapToUser(data) : null;
  }

  async update(walletAddress: string, updateUserInput: UpdateUserInput): Promise<User> {
    const updateData: Partial<{
      username: string;
      email: string;
      yd_token_balance: number;
      avatar_url: string;
    }> = {};

    if (updateUserInput.username !== undefined) {
      updateData.username = updateUserInput.username;
    }
    if (updateUserInput.email !== undefined) {
      updateData.email = updateUserInput.email;
    }
    if (updateUserInput.ydTokenBalance !== undefined) {
      updateData.yd_token_balance = updateUserInput.ydTokenBalance;
    }
    if ((updateUserInput as UpdateProfileInput).avatarUrl !== undefined) {
      updateData.avatar_url = (updateUserInput as UpdateProfileInput).avatarUrl ?? null;
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .update(updateData)
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`User with wallet address ${walletAddress} not found`);
    }

    return this.mapToUser(data);
  }

  async remove(walletAddress: string): Promise<boolean> {
    const { error } = await this.supabaseService
      .getClient()
      .from('users')
      .delete()
      .eq('wallet_address', walletAddress);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    return true;
  }

  async ensureUserExists(walletAddress: string): Promise<User> {
    const existing = await this.findOneOptional(walletAddress);
    if (existing) {
      return existing;
    }

    const username = `User_${walletAddress.slice(-4).toLowerCase()}`;
    const { data, error } = await this.supabaseService
      .getClient()
      .from('users')
      .insert({
        wallet_address: walletAddress,
        username,
        email: null,
        role: 'student',
        avatar_url: null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to auto-create user: ${error.message}`);
    }

    return this.mapToUser(data);
  }

  private mapToUser(data: UserRow): User {
    return {
      walletAddress: data.wallet_address,
      username: data.username,
      email: data.email,
      role: data.role,
      ydTokenBalance: parseFloat(String(data.yd_token_balance ?? '0')),
      avatarUrl: data.avatar_url ?? undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
