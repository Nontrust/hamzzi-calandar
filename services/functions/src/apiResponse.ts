export interface ApiSuccess<T> {
  success: true;
  data: T;
  errorCode: null;
  errorMessage: null;
  requestId: string;
}

export interface ApiFailure {
  success: false;
  data: null;
  errorCode: string;
  errorMessage: string;
  requestId: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function successResponse<T>(data: T, requestId: string): ApiSuccess<T> {
  return {
    success: true,
    data,
    errorCode: null,
    errorMessage: null,
    requestId
  };
}

export function failureResponse(errorCode: string, errorMessage: string, requestId: string): ApiFailure {
  return {
    success: false,
    data: null,
    errorCode,
    errorMessage,
    requestId
  };
}
