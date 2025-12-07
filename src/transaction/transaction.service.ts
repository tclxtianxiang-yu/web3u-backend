import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { CreateTransactionInput } from './dto/create-transaction.input';
import type { Transaction } from './entities/transaction.entity';

type TransactionRow = {
	id: string;
	from_wallet_address: string;
	to_wallet_address: string;
	amount_yd: number | string;
	transaction_type: string;
	transaction_hash?: string;
	status: string;
	metadata?: Record<string, unknown>;
	created_at: string;
};

@Injectable()
export class TransactionService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createTransactionInput: CreateTransactionInput): Promise<Transaction> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('transactions')
      .insert({
        from_wallet_address: createTransactionInput.fromWalletAddress,
        to_wallet_address: createTransactionInput.toWalletAddress,
        amount_yd: createTransactionInput.amountYd,
        transaction_type: createTransactionInput.transactionType,
        transaction_hash: createTransactionInput.transactionHash,
        metadata: createTransactionInput.metadata,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    return this.mapToTransaction(data);
  }

  async findAll(walletAddress?: string): Promise<Transaction[]> {
    let query = this.supabaseService.getClient().from('transactions').select('*');

    if (walletAddress) {
      query = query.or(`from_wallet_address.eq.${walletAddress},to_wallet_address.eq.${walletAddress}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    return data.map(this.mapToTransaction);
  }

  async findOne(id: string): Promise<Transaction> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return this.mapToTransaction(data);
  }

  async updateStatus(id: string, status: string): Promise<Transaction> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('transactions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return this.mapToTransaction(data);
  }

  private mapToTransaction(data: TransactionRow): Transaction {
    return {
      id: data.id,
      fromWalletAddress: data.from_wallet_address,
      toWalletAddress: data.to_wallet_address,
      amountYd: parseFloat(String(data.amount_yd ?? '0')),
      transactionType: data.transaction_type,
      transactionHash: data.transaction_hash,
      status: data.status,
      metadata: data.metadata,
      createdAt: new Date(data.created_at),
    };
  }
}
