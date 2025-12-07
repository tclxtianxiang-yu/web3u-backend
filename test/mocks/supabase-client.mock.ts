export type SupabaseOperationResult<T> = { data: T | null; error: { message: string } | null };

export function createSupabaseMock<T>({
	insertResult,
	selectResult,
	updateResult,
}: {
	insertResult?: SupabaseOperationResult<T>;
	selectResult?: SupabaseOperationResult<T>;
	updateResult?: SupabaseOperationResult<T>;
}) {
	const response = (result?: SupabaseOperationResult<T>) => async () => result ?? { data: null, error: null };

	const mockBuilder = {
		insert: jest.fn().mockReturnThis(),
		select: jest.fn().mockReturnThis(),
		single: jest.fn().mockImplementation(response(insertResult ?? selectResult)),
		update: jest.fn().mockReturnThis(),
		eq: jest.fn().mockReturnThis(),
		order: jest.fn().mockReturnThis(),
		or: jest.fn().mockReturnThis(),
	};

	return {
		from: jest.fn().mockReturnThis(),
		insert: mockBuilder.insert,
		select: mockBuilder.select,
		single: mockBuilder.single,
		update: mockBuilder.update,
		eq: mockBuilder.eq,
		order: mockBuilder.order,
		or: mockBuilder.or,
		_response: {
			insertResult,
			selectResult,
			updateResult,
		},
	};
}
