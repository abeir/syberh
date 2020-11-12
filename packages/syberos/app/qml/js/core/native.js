
function NativeImage(webview){
    this.webview = webview
    // 保存原生图片对象，key: handlerId， value: 图片组件对象
    this.images = {}
}

NativeImage.prototype.create = function(handlerId, data){
    console.log('>>>>>>>>>> create: ' + JSON.stringify(data));


    var properties = {}
    if(data['width']){
        properties['width'] = this._ratio(data['screenOffsetWidth'], data['width']);
    }
    if(data['height']){
        properties['height'] = this._ratio(data['screenOffsetWidth'], data['height']);
    }
    if(data['src']){
        properties['source'] = data['src'];
    }
    if(data['offsetTop']){
        properties['anchors.topMargin'] = parseInt(data['offsetTop']) + this.webview.object.getNavigationBarHeight();
    }
    if(data['offsetLeft']){
        properties['anchors.leftMargin'] = parseInt(data['offsetLeft']);
    }

    console.log('>>>>>>>>> properties:', JSON.stringify(properties));

    var component = Qt.createComponent("qrc:/qml/native/SImage.qml");
    if(component.status == Component.Ready){
        var imageObj = component.createObject(this.webview.object.getWebview(), properties);
        //缓存图片组件对象
        this.images[handlerId.toString()] = imageObj;
        
        var that = this
        //绑定信号
        imageObj.imageEvent.connect(function(eventType, eventData){
            //解决 this指向问题
            that._subscribe(that.webview, eventType, eventData)
        })
        //监听sloadingChanged信号
        this.webview.object.sloadingChanged.connect(function(loadRequest){
            if(loadRequest.status === 0){
                that.removeAll()
            }
        })

        this._success(handlerId, {id: handlerId});
        return;
    }
    this._fail(handlerId, 9000, "can't create native image: " + component.errorString());
}

NativeImage.prototype.change = function(handlerId, data){
    console.log('>>>>>>>>>> change: ' + JSON.stringify(data));
    
    var imgObj = this._getImage(handlerId, data['id']);
    if(!imgObj){
        return;
    }
    if(data['src']){
        imgObj.source = data['src']
    }
    this._success(handlerId, {id:imageId, src: data['src']})
}

NativeImage.prototype.remove = function(handlerId, data){
    console.log('>>>>>>>>>> remove: ' + JSON.stringify(data));

    var imgObj = this._getImage(handlerId, data['id']);
    if(!imgObj){
        return;
    }
    imgObj.destroy();
    delete this.images[data['id']];

    this._success(handlerId, true)
}

NativeImage.prototype.removeAll = function(handlerId){
    var removeImageIds = Object.keys(this.images);
    console.log('>>>>>>>>>> removeAll: ', removeImageIds);

    var removeCount = 0;
    for(var k in removeImageIds){
        var imgId = removeImageIds[k];
        var imgObj = this.images[imgId];
        if(imgObj){
            imgObj.destroy();
            removeCount++;
        }
        delete this.images[imgId];
    }
    if(handlerId){
        this._success(handlerId, {count: removeCount})
    }
}

NativeImage.prototype.destroy = function(){
    this.removeAll();
    this.webview = null;
}


NativeImage.prototype._ratio = function(screenOffsetWidth, px){
    var qmlScreenWidth = gScreenInfo.platformWidth;
    if(!screenOffsetWidth){
        screenOffsetWidth = qmlScreenWidth;
    }
    try{
        px = parseInt(px);
    }catch(e){
        px = 1;
        console.log('_ratio()  parseInt(px) failed:', px, e);
    }
    return qmlScreenWidth / screenOffsetWidth * px;
}



NativeImage.prototype._px2dp = function(px){
    if(!px){
        return px;
    }
    if(typeof px === 'string'){
        px = parseInt(px);
    }
    if(typeof env === 'undefined'){
        console.log("Error: can not find gScreenInfo");
        return px;
    }
    return parseInt(px / env.dp(1) + 0.5);
}


NativeImage.prototype._getImage = function(handlerId, imageId) {
    if(!imageId || !this.images[imageId]){
        this._fail(handlerId, 9000, "undefined image component: " + imageId);
        return null;
    }
    return this.images[imageId];
}

NativeImage.prototype._getWebview = function(){
    return swebviewCache[this.webviewId]
}

NativeImage.prototype._success = function(handlerId, result){
    console.log('>>>>>>>>>> _success: ' + handlerId + ' result:' + JSON.stringify(result))
    this.webview.onSuccess(handlerId, result)
}

NativeImage.prototype._fail = function(handlerId, errorCode, errorMsg){
    this.webview.onFailed(handlerId, errorCode, errorMsg)
}

NativeImage.prototype._subscribe = function(webview, eventType, eventData){
    var curUrl = webview.object.getCurrentUrl()

    webview.pushQueue('subscribe', {
      url: curUrl,
      handlerName: 'onImageEvent',
      result: {
        type: eventType,
        data: eventData
      }
    });

    webview.dog(curUrl);
}
