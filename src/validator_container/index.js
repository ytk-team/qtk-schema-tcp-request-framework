const BaseValidator = require('@qtk/schema-tcp-framework').Validator;
const ValidationError = require('../error/validation');

module.exports = class V extends BaseValidator {
    
    constructor(schemaDir, Validator) {
        super();
        this._schemaDir = schemaDir;
        this._validator = new Validator();
        this._schemaCache = new Map();
    }

    getSchema(command) {
        if(!command) throw new Error('command must be provided.');
        let schema;
        try {
            schema = this._schemaCache.get(`${this._schemaDir}/${command}`);
            if (schema === undefined) {
                schema = require(`${this._schemaDir}/${command}`);
                this._schemaCache.set(`${this._schemaDir}/${command}`, schema);
            }
        }
        catch(err) {
            throw new Error(`invalid schema ${command}, error: ${err.stack}`)
        }

        if (schema.request === undefined || schema.response === undefined) {
            throw new Error(`bad format of schema ${command}, expecting schema to have properties request, response.`);
        }
        return {
            constant: schema.constant,
            request: schema.request,
            response: schema.response
        };
    }

    requestCheck(uuid, {command, success, payload}) {
        let requestSchema = null;
        try {
            requestSchema = this.getSchema(command).request;
            this._validator.requestCheck({command, instance: payload, schema: requestSchema});
        }
        catch (error) {
            throw new ValidationError(error.message, {command, instance: payload, schema: requestSchema, side: "request"}, uuid);            
        }
    }


    responseCheck(uuid, {command, success, payload}) {
        let responseSchema = null;
        if (success === false) return; //抛错情况不校验
        try {
            responseSchema = this.getSchema(command).response;
            this._validator.responseCheck({command, instance: payload, schema: responseSchema});
        }
        catch (error) {
            throw new ValidationError(error.message, {command, instance: payload, schema: responseSchema, side: "response"}, uuid);            
        }
    }
}