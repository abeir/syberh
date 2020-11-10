

function NativeImage(webview){
    this.webview = webview
    this.images = {}
}

NativeImage.prototype.create = function(handlerId, data){
    console.log('>>>>>>>>>> create: ' + JSON.stringify(data))

    var imageObj = this.webview.object.createImage(data)
    this.images[handlerId] = imageObj
    this._success(handlerId, {id: handlerId})
}

NativeImage.prototype.change = function(handlerId, data){
    console.log('>>>>>>>>>> change: ' + JSON.stringify(data))
    
    var imageId = data['id']
    if(!imageId || !this.images[imageId]){
        this._fail(handlerId, 9000, "undefined image component: " + imageId)
        return
    }
    this.webview.object.changeImage(this.images[imageId], data)

    this._success(handlerId, {id:imageId, src: data['src']})
}

NativeImage.prototype.remove = function(handlerId, data){

}

NativeImage.prototype._success = function(handlerId, result){
    console.log('>>>>>>>>>> _success: ' + handlerId + ' result:' + JSON.stringify(result))
    this.webview.onSuccess(handlerId, result)
}

NativeImage.prototype._fail = function(handlerId, errorCode, errorMsg){
    this.webview.onFailed(handlerId, errorCode, errorMsg)
}
