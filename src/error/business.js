module.exports = class BusinessError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}