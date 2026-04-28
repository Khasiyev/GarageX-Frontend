export interface BaseResponse<T = null> {
  data: T;
  success: boolean;
  message: string;
  errors?: string[];
  errorType?: number;
}
