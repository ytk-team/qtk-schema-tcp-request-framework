module.exports = class Validation extends Error {
    constructor(message, {command, instance, schema, side}, uuid) {
        super(message);
        this._command = command;
        this._instance = instance;
        this._schema = schema;
        this._side = side;
        this._uuid = uuid;
    }

    get command() {
        return this._command;
    }

    get instance() {
        return this._instance;
    }

    get schema() {
        return this._schema;
    }

    get side() {
        return this._side;
    }

    get uuid() {
        return this._uuid;
    }
}