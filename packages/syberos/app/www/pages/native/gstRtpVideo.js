
function GstRtpVideoPlugin(){
}

// 模块名, 必须实现
GstRtpVideoPlugin.prototype.module = function(){
    return 'gstRtpVideo'
}

// 运行环境,默认是syberos环境, 必须实现的方法
GstRtpVideoPlugin.prototype.os = function(){
    return ['syberos']
}

// 模块的方法, 返回的是默认值, 格式是method_[name]
GstRtpVideoPlugin.prototype.method_create = function(){
    return {
        address: '',
        port: 0,
        width: 0,
        height: 0,
        offsetTop: 0,
        offsetLeft: 0,
        format: 'NV12',
        pixelWidth: 1920,
        pixelHeight: 1080,
        autoPlay: true
    }
}

GstRtpVideoPlugin.prototype.method_start = function(){
    return {id: ''}
}

GstRtpVideoPlugin.prototype.method_stop = function(){
    return {id: ''}
}

GstRtpVideoPlugin.prototype.method_show = function(){
    return {id: ''}
}

GstRtpVideoPlugin.prototype.method_hide = function(){
    return {id: ''}
}

GstRtpVideoPlugin.prototype.method_remove = function(){
    return {id:''}
}

GstRtpVideoPlugin.prototype.method_removeAll = function(){
    return {}
}
