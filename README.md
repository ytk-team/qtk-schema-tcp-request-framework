# qtk-schema-tcp-request-framework
一个基于TCP的同步请求框架，自带schema校验功能，并且可以自定义schema语法及数据校验器．

## 用法：

### 目录结构:
```sh
.
├── handler
│   └── echo
│       └── index.js
├── schema
│   └── echo
│       └── index.js
```

### Server:
```js
const Server = require('@qtk/schema-tcp-request-framework').Server;
let server = new Server({
    host: '127.0.0.1'，　//服务端ip
    port: 3000,　//服务端端口
    handlerDir: `${__dirname}/handler`, //handler目录
    schemaDir: `${__dirname}/schema`　//schema文件目录
});
server.on("exception", (socket, err) => {
    console.log(err.stack);
});
server.on("started", () => {
    console.log('服务已经启动');
});
server.start();
```

### Schema:
/schema/echo/index.js
```js
const {string} = require('@qtk/schema').schema;
const request = string().desc("请求的内容");　//请求数据必须为字符串
const response = string().desc("返回的内容");　//返回数据必须为字符串
module.exports = {response, request};
```

### Handler:
/handler/echo/index.js
```js
module.exports = async ({request}) => {
    return request;
};
```

### Client:
```js
const Client = require('@qtk/schema-tcp-request-framework').Client;
const client = new Client({
    host: '127.0.0.1', //服务端ip
    port: 3000, //服务端端口
});
const response = await client.send({
    command: 'echo', //接口名
    payload: 'hello' //接口数据
});
console.log(response); //输出hello
```

## 对客户端抛错
有时服务端handler里在报错时想要同时给客户端返回错误码,这时可以使用框架提供的BusinessError类.
BusinessError类有两个属性:``code``, ``message``,分别对应错误码及错误信息.
在handler里抛BusinessError,那么客户端也会收到回应后也会抛BusinessError,包含服务端给回的``code``及``message``.
目前客户端会有三种Error类型: ``Error``,``BusinessError``,``ValidationError``.
- schema校验失败的话就会抛``ValidationError``
- handler主动抛业务错``BusinessError``
- 其他出错情况抛``Error``

## 自定义Schema语法&&数据校验器
默认使用的是基于JSON Schema语法封装的[Semantic Schema](https://www.npmjs.com/package/semantic-schema),若想自定义语法的话，Schema文件需保证导出request及response节点，同时重写校验器．以上面例子为例，演示基于原生JSON Schema及ajv库数据校验

### 自定数据校验器
ajv_validator.js
```js
const Ajv = require('ajv');
const ajv = new Ajv();
const BaseValidator = require('@qtk/schema-tcp-request-framework').Validator;
module.exports = class AjvValidator extends BaseValidator {
    requestCheck({command, instance, schema}) { //服务端收到请求后，对数据做校验，command为接口名，instance为请求报文，schema为对应接口schema的request接口数据
        let validator = ajv.compile(schema);
        if (!validator(instance)) {
            throw new Error(`invalid ${command} request\n instance: ${JSON.stringify(instance)}\n schema: ${JSON.stringify(schema)}\n error: ${ajv.errorsText(validator.errors)}`);
        }
    }

    responseCheck({command, instance, schema}) { //客户端收到服务端返回数据后，对数据做校验，command为接口名，instance为返回报文，schema为对应接口schema的response接口数据
        let validator = ajv.compile(schema);
        if (!validator(instance)) {
            throw new Error(`invalid ${command} response\n instance: ${JSON.stringify(instance)}\n schema: ${JSON.stringify(schema)}\n error: ${ajv.errorsText(validator.errors)}`);
        }
    }
}
```

### Server:
```js
const Server = require('@qtk/schema-tcp-request-framework').Server;
let server = new Server({
    host: '127.0.0.1'，　//服务端ip
    port: 3000,　//服务端端口
    handlerDir: `${__dirname}/handler`, //handler目录
    schemaDir: `${__dirname}/schema`　//schema文件目录
    Validator: `${__dirname}/ajv_validator.js` //自定义数据校验器
});
server.on("exception", (socket, err) => {
    console.log(err.stack);
});
server.on("started", () => {
    console.log('服务已经启动');
});
server.start();
```

### Schema:
/schema/echo/index.js
```js
const request = {
    "type": "string",
    "description": "请求的内容"
}
const response = {
    "type": "string",
    "description": "返回的内容"
}
module.exports = {response, request};
```

### Handler:
/handler/echo/index.js
```js
module.exports = async ({request}) => {
    return request;
};
```

### Client:
```js
const Client = require('@qtk/schema-tcp-request-framework').Client;
const client = new Client({
    host: '127.0.0.1', //服务端ip
    port: 3000, //服务端端口
});
const response = await client.send({
    command: 'echo', //接口名
    payload: 'hello' //接口数据
});
console.log(response); //输出hello
```

### 备注
1. 从2.3.0版本起，schema校验由谁收到数据谁校验方式改为全部为server端校验，避免client端还要携带schema产生的依赖问题