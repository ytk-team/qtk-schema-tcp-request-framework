module.exports = class BusinessError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}