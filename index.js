module.exports = {
    Server: require("./src/server"),
    Client: require("./src/client"),
    Validator: require("./src/validator"),
    BusinessError: require("./src/error/business"),
    ValidationError: require("./src/error/validation")
}