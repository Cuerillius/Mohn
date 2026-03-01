export interface ApiResponse<T> {
	success: boolean;
	error?: string | null;
	detail?: string;
	message?: string;
	data: T;
}
