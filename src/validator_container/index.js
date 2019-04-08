const BaseValidator = require('@qtk/schema-tcp-framework').Validator;
const ValidationError = require('../error/validation');

module.exports = class V extends BaseValidator {
    
    constructor(schemaDir, Validator) {
        super();
        this._schemaDir = schemaDir;
        this._validator = new Validator();
    }

    requestCheck(uuid, {command, success, payload}) {
        try {
            const {request} = require(`${this._schemaDir}/${command}`);
            this._validator.requestCheck({command, instance: payload, schema: request});
        }
        catch (error) {
            throw new ValidationError(error.message, uuid, {command, payload});            
        }
    }


    responseCheck(uuid, {command, success, payload}) {
        if (success === false) return; //抛错情况不校验
        try {
            const {response} = require(`${this._schemaDir}/${command}`);
            this._validator.responseCheck({command, instance: payload, schema: response});
        }
        catch (error) {
            throw new ValidationError(error.message, uuid, {command, payload});            
        }
    }
}