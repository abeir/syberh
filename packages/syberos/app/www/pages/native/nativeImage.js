
function NativeImagePlugin(){
}

// 模块名, 必须实现
NativeImagePlugin.prototype.module = function(){
    return 'nativeImage'
}

// 运行环境,默认是syberos环境, 必须实现的方法
NativeImagePlugin.prototype.os = function(){
    return ['syberos']
}

// 模块的方法, 返回的是默认值, 格式是method_[name]
NativeImagePlugin.prototype.method_create = function(){
    return {
        src: '',
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        offsetTop: 0,
        offsetLeft: 0
    }
}

NativeImagePlugin.prototype.method_change = function(){
    return {id: '', src: ''}
}

NativeImagePlugin.prototype.method_show = function(){
    return {id: ''}
}

NativeImagePlugin.prototype.method_hide = function(){
    return {id: ''}
}

NativeImagePlugin.prototype.method_remove = function(){
    return {id:''}
}

NativeImagePlugin.prototype.method_removeAll = function(){
    return {}
}
