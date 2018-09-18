const BaseValidator = require('./index.js');
const {validator: Validator} = require('semantic-schema');

module.exports = class SemanticValidator extends BaseValidator {
    requestCheck({command, instance, schema}) {
        let validator = Validator.from(schema);
        if (!validator.validate(instance)) {
            throw new Error(`invalid ${command} request\n instance: ${JSON.stringify(instance)}\n schema: ${JSON.stringify(validator.jsonSchema)}\n error: ${validator.errorsText()}`);
        }
    }

    responseCheck({command, instance, schema}) {
        let validator = Validator.from(schema);
        if (!validator.validate(instance)) {
            throw new Error(`invalid ${command} response\n instance: ${JSON.stringify(instance)}\n schema: ${JSON.stringify(validator.jsonSchema)}\n error: ${validator.errorsText()}`);
        }
    }
}