module.exports = class Validation extends Error {
    constructor(message, uuid, data) {
        super(message);
        this.uuid = uuid;
        this.data = data;
    }
}