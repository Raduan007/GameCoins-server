import { Response } from "express";

interface ApiSuccessBody<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

interface ApiErrorBody {
  success: false;
  error: string;
  status: number;
}

function success<T>(
  res: Response,
  data: T,
  message?: string,
  status = 200
): void {
  const body: ApiSuccessBody<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  res.status(status).json(body);
}

function error(res: Response, message: string, status = 500): void {
  const body: ApiErrorBody = {
    success: false,
    error: message,
    status,
  };
  res.status(status).json(body);
}

const apiResponse = {
  success,
  error,
};

export default apiResponse;
export type { ApiSuccessBody, ApiErrorBody };