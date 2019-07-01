module.exports = class Validator {
    requestCheck({command, instance, schema}) {
        throw new Error(`this method should be implemented by subclasses`);
    }

    responseCheck({command, instance, schema}) {
        throw new Error(`this method should be implemented by subclasses`);
    }
}