module.exports = class Validator {
    requestCheck({instance, schema}) {
        throw new Error(`this method should be implemented by subclasses`);
    }

    responseCheck({instance, schema}) {
        throw new Error(`this method should be implemented by subclasses`);
    }
}