class ApiResponse {
    constructor(statusCode, message = "Success", data, success, errors) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode < 400;
        this.errors = errors;
    }
}