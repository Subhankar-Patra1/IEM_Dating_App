export class ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  message?: string;

  constructor(success: boolean, data: T | null, message?: string, error?: string) {
    this.success = success;
    this.data = data;
    this.message = message;
    if (error) {
      this.error = error;
    }
  }

  static success<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse(true, data, message);
  }

  static error(message: string, errorDetails?: string): ApiResponse<null> {
    return new ApiResponse(false, null, message, errorDetails);
  }
}
