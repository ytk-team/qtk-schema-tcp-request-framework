const BaseValidator = require('@qtk/schema-tcp-framework').Validator;
const ValidationError = require('../error/validation');

module.exports = class V extends BaseValidator {
    static get Type() {
        return {
            SERVER: 0,
            CLIENT: 1
        };
    }
    
    constructor(schemaDir, type, Validator) {
        super();
        this._schemaDir = schemaDir;
        this._type = type;
        this._validator = new Validator();
    }

    check(uuid, {command, success, payload}) {
        try {
            const {request, response} = require(`${this._schemaDir}/${command}`);
            if (this._type == V.Type.SERVER) {
                this._validator.requestCheck({command, instance: payload, schema: request});
            }
            else if (this._type == V.Type.CLIENT) {
                if (success) this._validator.responseCheck({command, instance: payload, schema: response})
            }
            else {
                throw new Error(`no support type ${this._type}`);
            }
        }
        catch (error) {
            throw new ValidationError(error.message, uuid, {command, payload});            
        }
    }
}