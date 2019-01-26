const {BusinessError} = require('../../../index.js');
module.exports = async ({request, socket}) => {
    switch(request) {
        case 'hello':
            return request;
        case 'server_error': 
            throw new Error('error from server');
        case 'response_invalid': 
            return {a: 123};
        case 'business_error':
            throw new BusinessError('服务器向你抛了个业务错', 123);
    }
};