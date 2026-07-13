import { Response } from "express";
interface ApiSuccessBody<T = unknown> {
    success: true;
    data: T;
    message?: string;
    pagination?: {
        totalGames: number;
        currentPage: number;
        totalPages: number;
        limit: number;
    };
}
interface ApiErrorBody {
    success: false;
    error: string;
    status: number;
}
declare function success<T>(res: Response, data: T, message?: string, status?: number, pagination?: {
    totalGames: number;
    currentPage: number;
    totalPages: number;
    limit: number;
}): void;
declare function error(res: Response, message: string, status?: number): void;
declare const apiResponse: {
    success: typeof success;
    error: typeof error;
};
export default apiResponse;
export type { ApiSuccessBody, ApiErrorBody };
//# sourceMappingURL=apiResponse.d.ts.map