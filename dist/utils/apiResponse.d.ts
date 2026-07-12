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
declare function success<T>(res: Response, data: T, message?: string, status?: number): void;
declare function error(res: Response, message: string, status?: number): void;
declare const apiResponse: {
    success: typeof success;
    error: typeof error;
};
export default apiResponse;
export type { ApiSuccessBody, ApiErrorBody };
//# sourceMappingURL=apiResponse.d.ts.map