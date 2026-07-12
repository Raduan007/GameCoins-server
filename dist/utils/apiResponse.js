"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function success(res, data, message, status = 200) {
    const body = {
        success: true,
        data,
        ...(message && { message }),
    };
    res.status(status).json(body);
}
function error(res, message, status = 500) {
    const body = {
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
exports.default = apiResponse;
//# sourceMappingURL=apiResponse.js.map