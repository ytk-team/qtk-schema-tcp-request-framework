const Server = require('@qtk/schema-tcp-framework').Server;
const ValidatorContainer = require('../validator_container');
const DefaultValidator = require('../validator/default');
const ValidationError = require('../error/validation');
const EventEmitter = require('events').EventEmitter;
const BusinessError = require('../error/business');

module.exports = class extends EventEmitter {
    constructor({host, port, handlerDir, schemaDir, Validator = DefaultValidator}) {
        super();
        this._server = new Server({
            host, 
            port, 
            validator: new ValidatorContainer(schemaDir, ValidatorContainer.Type.SERVER, Validator)
        });
        this._handlerDir = handlerDir;
        this.schemaDir = schemaDir;

        this._server.on("data", async (socket, {uuid, data:{command, payload:request, clientId}}) => {
            let response = undefined;
            try {
                const constant = require(`${this.schemaDir}/${command}`).constant;
                response = await require(`${this._handlerDir}/${command}`)({request, socket, clientId, constant});
                if (response === undefined) {
                    response = null;
                }
            }
            catch(err) {
                let error = err instanceof BusinessError ? {type: 'business', message: err.message, code: err.code} : {type: 'default', message: err.message};
                this._server.send(socket, {uuid, data:{command, success: false, error}});
                this.emit("exception", socket, err);
                return;
            }
            this._server.send(socket, {uuid, data:{command, success: true, payload: response}});
        });

        this._server.on("started", () => {this.emit("started");});
        this._server.on("stopped", () => {this.emit("stopped");});
        this._server.on("connected", (socket) => {this.emit("connected", socket);});
        this._server.on("closed", (socket) => {this.emit("closed", socket);});
        this._server.on("exception", (socket, error) => {
            if (error instanceof ValidationError) {
                this._server.send(socket, {
                    uuid: error.uuid, 
                    data:{
                        command: error.data.command, 
                        success: false, 
                        error: {type: 'validation', message: error.message}
                    }
                });
            }
            this.emit('exception', socket, error);
        });
    }
    
    start() {
        this._server.start();
    }

    stop() {
		this._server.stop();
	}
}