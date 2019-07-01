const Server = require('@qtk/schema-tcp-framework').Server;
const ValidatorContainer = require('../validator_container');
const DefaultValidator = require('../validator/default');
const ValidationError = require('../error/validation');
const EventEmitter = require('events').EventEmitter;
const BusinessError = require('../error/business');

module.exports = class extends EventEmitter {
    constructor({host, port, handlerDir, schemaDir, Validator = DefaultValidator}) {
        super();
        this._validator = new ValidatorContainer(schemaDir, Validator)
        this._server = new Server({
            host, 
            port, 
            validator: this._validator
        });
        this._handlerDir = handlerDir;
        this.schemaDir = schemaDir;
        this._handlerCache = new Map();

        this._server.on("data", async (socket, {uuid, data:{command, payload:request, clientId}}) => {
            let response = undefined;
            try {
                let commandSchema = this._validator.getSchema(command);
                let handler = this._handlerCache.get(`${this._handlerDir}/${command}`);
                if (handler === undefined) {
                    handler = require(`${this._handlerDir}/${command}`);
                    this._handlerCache.set(`${this._handlerDir}/${command}`, handler);
                }
                response = await handler({request, socket, clientId, constant: commandSchema.constant});
                if (response === undefined) response = null;
                this._server.send(socket, {uuid, data:{command, success: true, payload: response}});
            }
            catch(err) {
                let error = undefined;
                if (err instanceof BusinessError) {
                    error = {type: 'business', message: err.message, code: err.code};
                }
                else if (err instanceof ValidationError) { //response schema校验出错
                    error = {type: 'validation', message: err.message, side: err.side, command: err.command};
                    this.emit("exception", socket, err);
                }
                else {
                    error = {type: 'default', message: err.message};
                    this.emit("exception", socket, err);
                }
                this._server.send(socket, {
                    uuid, 
                    data:{
                        command, 
                        success: false, 
                        error
                    }
                });
            }
            
        });

        this._server.on("started", () => {this.emit("started");});
        this._server.on("stopped", () => {this.emit("stopped");});
        this._server.on("connected", (socket) => {this.emit("connected", socket);});
        this._server.on("closed", (socket) => {this.emit("closed", socket);});
        this._server.on("exception", (socket, error) => { //request schema校验出错或网络出错
            if (error instanceof ValidationError) {
                this._server.send(socket, {
                    uuid: error.uuid, 
                    data:{
                        command: error.command, 
                        success: false, 
                        error: {type: 'validation', message: error.message, side: error.side, command: error.command}
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