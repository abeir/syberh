const { QWebChannel } = require('../util/qwebchannel');
/**
 * h5和原生交互，jsbridge核心代码
 * 依赖于showError，globalError，os
 */
export default function jsbridgeMixin(hybrid) {
    const hybridJs = hybrid;

    // 必须要有一个全局的JSBridge，否则原生和H5无法通信
    // 定义每次重新生成一个JSBridge
    window.JSBridge = { trans: undefined, channel: undefined };

    const JSBridge = window.JSBridge;
    // 声明依赖
    const showError = hybridJs.showError;
    const globalError = hybridJs.globalError;
    const os = hybridJs.os;

    hybridJs.JSBridge = JSBridge;

    /* if (hybridJs.os.syberos) {
// native 通知回调
navigator.qt.onmessage((messageJSON) => {
console.log(JSON.stringify(messageJSON));
JSBridge._handleMessageFromNative(messageJSON);
});
} */

    // jsbridge协议定义的名称
    const CUSTOM_PROTOCOL_SCHEME = 'SyberHybridJSBridge';
    // 本地注册的方法集合,原生只能调用本地注册的方法,否则会提示错误
    const messageHandlers = {};
    // 短期回调函数集合
    // 在原生调用完对应的方法后,会执行对应的回调函数id，并删除
    const responseCallbacks = {};
    // 长期存在的回调，调用后不会删除
    const responseCallbacksLongTerm = {};

    // 唯一id,用来确保长期回调的唯一性，初始化为最大值
    const uniqueLongCallbackId = 2147483647;

    new QWebChannel(qt.webChannelTransport, ((channel) => {
        window.JSBridge.trans = channel.objects.trans;
        window.JSBridge.channel = channel;
    }));

    /**
* 获取短期回调id，内部要避免和长期回调的冲突
* @return {Number} 返回一个随机的短期回调id
*/
    function getCallbackId() {
    // 确保每次都不会和长期id相同
        return Math.floor(Math.random() * uniqueLongCallbackId);
    }

    /**
* 将JSON参数转为字符串
* @param {Object} data 对应的json对象
* @return {String} 转为字符串后的结果
*/
    function getParam(data) {
        if (typeof data !== 'string') {
            return JSON.stringify(data);
        }

        return data;
    }

    /**
* 转换message对象为字符串
* @param proto module
* @param message
* @param {boolean}  isLong 是否为长回调
* @return {String} message 字符串
*
*/
    const getMessageStr = (proto, message, isLong) => {
        if (typeof message !== 'string') {
            message.module = proto;
            message.isLong = isLong;
            return JSON.stringify(message);
        }
        return message;
    };

    /**
* JS调用原生方法前,会先send到这里进行处理
* @param {String} proto 这个属于协议头的一部分
* @param {JSON} message 调用的方法详情,包括方法名,参数
* @param {Object} responseCallback 调用完方法后的回调,或者长期回调的id
* @param {boolean} isLong 是否为长回调
*/
    function doSend(proto, message, responseCallback, isLong = false) {
        const newMessage = message;
        if (typeof responseCallback === 'function') {
            // 如果传入的回调时函数，需要给它生成id
            // 取到一个唯一的callbackid
            const callbackId = getCallbackId();
            // 回调函数添加到短期集合中
            responseCallbacks[callbackId] = responseCallback;
            // 方法的详情添加回调函数的关键标识
            newMessage.callbackId = callbackId;
        } else {
            // 如果传入时已经是id，代表已经在回调池中了，直接使用即可
            newMessage.callbackId = responseCallback;
        }

        // 获取 触发方法的url scheme
        // const uri = getUri(proto, newMessage);
        const messageStr = getMessageStr(proto, newMessage, isLong);
        if (os.syberos) {
            // navigator.qt.postMessage(messageStr);
            window.JSBridge.trans.postMessage(messageStr);
        } else {
            // 浏览器
            warn(`浏览器中jsbridge无效,对应scheme:${messageStr}`);
        }
    }

    /**
* 注册本地JS方法通过JSBridge给原生调用
* 我们规定,原生必须通过JSBridge来调用H5的方法
* 注意,这里一般对本地函数有一些要求,要求第一个参数是data,第二个参数是callback
* @param {String} handlerName 方法名
* @param {Function} handler 对应的方法
*/
    hybridJs.subscribe = function subscribe(handlerName, handler) {
        messageHandlers[handlerName] = handler;
    };

    /**
* 注册长期回调到本地
* @param {String} callbackId 回调id
* @param {Function} callback 对应回调函数
*/
    JSBridge.registerLongCallback = function registerLongCallback(callbackId, callback) {
        responseCallbacksLongTerm[callbackId] = callback;
    };

    /**
* 获得本地的长期回调，每一次都是一个唯一的值
* @retrurn 返回对应的回调id
* @return {Number} 返回长期回调id
*/
    JSBridge.getLongCallbackId = function getLongCallbackId() {
        return getCallbackId();
    };

    /**
* 调用原生开放的方法
* @param {String} proto 这个属于协议头的一部分
* @param {String} handlerName 方法名
* @param {JSON} data 参数
* @param {Object} callback 回调函数或者是长期的回调id
*/
    JSBridge.callHandler = function callHandler(proto, handlerName, data, callback, isLong = false) {
        doSend(
            proto,
            {
                handlerName,
                data,
            },
            callback,
            isLong,
        );
    };

    /**
* 原生调用H5页面注册的方法,或者调用回调方法
* @param {String} messageJSON 对应的方法的详情,需要手动转为json
*/
    JSBridge._handleMessageFromNative = function _handleMessageFromNative(messageJSON) {
        if (!messageJSON) {
            return;
        }
        // 处理原生过来的方法
        function doDispatchMessageFromNative() {
            let message;

            try {
                if (typeof messageJSON === 'string') {
                    message = decodeURIComponent(messageJSON);
                    message = JSON.parse(message);
                } else {
                    message = messageJSON;
                }
            } catch (e) {
                showError(
                    globalError.ERROR_TYPE_NATIVECALL.code,
                    globalError.ERROR_TYPE_NATIVECALL.msg,
                );

                return;
            }

            // 回调函数
            const responseId = message.responseId;
            const responseData = message.responseData;
            let responseCallback;

            if (responseId) {
                // 这里规定,原生执行方法完毕后准备通知h5执行回调时,回调函数id是responseId
                responseCallback = responseCallbacks[responseId];
                // 默认先短期再长期
                responseCallback = responseCallback || responseCallbacksLongTerm[responseId];

                // 执行本地的回调函数
                responseCallback && responseCallback(responseData);

                delete responseCallbacks[responseId];
            } else {
                /**
* 否则,代表原生主动执行h5本地的函数
* 从本地注册的函数中获取
*/
                const handler = messageHandlers[message.handlerName];
                const data = message.data;

                // 执行本地函数,按照要求传入数据和回调
                handler && handler(data);
            }
        }

        // 使用异步
        setTimeout(doDispatchMessageFromNative);
    };
}
