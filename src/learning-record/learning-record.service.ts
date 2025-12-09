import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type { CreateLearningRecordInput } from './dto/create-learning-record.input';
import type { UpdateLearningRecordInput } from './dto/update-learning-record.input';
import type { LearningRecord } from './entities/learning-record.entity';

type LearningRecordRow = {
	id: string;
	user_wallet_address: string;
	course_id: string;
	lesson_id: string;
	watch_time: number | null;
	progress_percentage: number | null;
	completed: boolean;
	last_watched_at: string | null;
	created_at: string;
	updated_at: string;
};

@Injectable()
export class LearningRecordService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async create(createLearningRecordInput: CreateLearningRecordInput): Promise<LearningRecord> {
    // For single-video courses: lessonId should be NULL
    // For multi-lesson courses: lessonId should reference an actual lesson
    const lessonId = createLearningRecordInput.lessonId || null;

    // Check if a record already exists
    const existingQuery = this.supabaseService
      .getClient()
      .from('learning_records')
      .select('*')
      .eq('user_wallet_address', createLearningRecordInput.userWalletAddress)
      .eq('course_id', createLearningRecordInput.courseId);

    // Add lesson_id filter (handle NULL case)
    if (lessonId === null) {
      existingQuery.is('lesson_id', null);
    } else {
      existingQuery.eq('lesson_id', lessonId);
    }

    const { data: existingRecord } = await existingQuery.maybeSingle();

    // If record exists, update it
    if (existingRecord) {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('learning_records')
        .update({
          watch_time: createLearningRecordInput.watchTime ?? existingRecord.watch_time,
          progress_percentage: createLearningRecordInput.progressPercentage ?? existingRecord.progress_percentage,
          completed: createLearningRecordInput.completed ?? existingRecord.completed,
          last_watched_at: new Date().toISOString(),
        })
        .eq('id', existingRecord.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update learning record: ${error.message}`);
      }

      return this.mapToLearningRecord(data);
    }

    // Create new record
    const { data, error } = await this.supabaseService
      .getClient()
      .from('learning_records')
      .insert({
        user_wallet_address: createLearningRecordInput.userWalletAddress,
        course_id: createLearningRecordInput.courseId,
        lesson_id: lessonId,
        watch_time: createLearningRecordInput.watchTime,
        progress_percentage: createLearningRecordInput.progressPercentage,
        completed: createLearningRecordInput.completed,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create learning record: ${error.message}`);
    }

    return this.mapToLearningRecord(data);
  }

  async findAll(filters?: { userWalletAddress?: string; courseId?: string }): Promise<LearningRecord[]> {
    let query = this.supabaseService.getClient().from('learning_records').select('*');

    if (filters?.userWalletAddress) {
      query = query.eq('user_wallet_address', filters.userWalletAddress);
    }
    if (filters?.courseId) {
      query = query.eq('course_id', filters.courseId);
    }

    const { data, error } = await query.order('last_watched_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch learning records: ${error.message}`);
    }

    return data.map(this.mapToLearningRecord);
  }

  async findOne(id: string): Promise<LearningRecord> {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('learning_records')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Learning record with ID ${id} not found`);
    }

    return this.mapToLearningRecord(data);
  }

  async update(id: string, updateLearningRecordInput: UpdateLearningRecordInput): Promise<LearningRecord> {
    const updateData: Partial<{
      watch_time: number;
      progress_percentage: number;
      completed: boolean;
      last_watched_at: string;
    }> = { last_watched_at: new Date().toISOString() };

    if (updateLearningRecordInput.watchTime !== undefined) {
      updateData.watch_time = updateLearningRecordInput.watchTime;
    }
    if (updateLearningRecordInput.progressPercentage !== undefined) {
      updateData.progress_percentage = updateLearningRecordInput.progressPercentage;
    }
    if (updateLearningRecordInput.completed !== undefined) {
      updateData.completed = updateLearningRecordInput.completed;
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .from('learning_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Learning record with ID ${id} not found`);
    }

    return this.mapToLearningRecord(data);
  }

  private mapToLearningRecord(data: LearningRecordRow): LearningRecord {
    return {
      id: data.id,
      userWalletAddress: data.user_wallet_address,
      courseId: data.course_id,
      lessonId: data.lesson_id,
      watchTime: data.watch_time || 0,
      progressPercentage: data.progress_percentage || 0,
      completed: data.completed || false,
      lastWatchedAt: new Date(data.last_watched_at),
      createdAt: new Date(data.created_at),
    };
  }
}
