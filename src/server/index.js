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
            validator: new ValidatorContainer(schemaDir, Validator)
        });
        this._handlerDir = handlerDir;
        this.schemaDir = schemaDir;

        this._server.on("data", async (socket, {uuid, data:{command, payload:request, clientId}}) => {
            let response = undefined;
            try {
                const constant = require(`${this.schemaDir}/${command}`).constant;
                response = await require(`${this._handlerDir}/${command}`)({request, socket, clientId, constant});
                if (response === undefined) response = null;
                this._server.send(socket, {uuid, data:{command, success: true, payload: response}});
            }
            catch(err) {
                let error = undefined;
                if (err instanceof BusinessError) {
                    error = {type: 'business', message: err.message, code: err.code};
                }
                else if (err instanceof ValidationError) { //response schema校验出错
                    error = {type: 'validation', message: err.message};
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