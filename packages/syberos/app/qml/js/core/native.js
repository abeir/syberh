
function NativeImage(webview){
    this.webview = webview
    // 保存原生图片对象，key: handlerId， value: 图片组件对象
    this.images = {}
}

NativeImage.prototype.create = function(handlerId, data){
    logger.verbose('NativeImage create ');


    var properties = { imageId: handlerId };
    if(data.width){
        properties.width = this._ratio(data.width);
        properties['sourceSize.width'] = properties.width;
    }
    if(data.height){
        properties.height = this._ratio(data.height);
        properties['sourceSize.height'] = properties.height;
    }
    if(data.src){
        properties.source = data.src;
        delete data['src']
    }
    if(data.x){
        properties.x = parseInt(data.x) + this.webview.object.getNavigationBarHeight();
    }
    if(data.y){
        properties.y = parseInt(data.y);
    }
    if(data.offsetTop){
        properties.useArchors = true;
        properties['anchors.topMargin'] = this._ratio(data.offsetTop) + this.webview.object.getNavigationBarHeight();
    }
    if(data.offsetLeft){
        properties.useArchors = true;
        properties['anchors.leftMargin'] = this._ratio(data.offsetLeft);
    }

    var component = Qt.createComponent("qrc:/qml/native/SImage.qml");
    if(component.status == Component.Ready){
        var imageObj = component.createObject(this.webview.object.getWebview(), properties);
        //缓存图片组件对象
        this.images[handlerId.toString()] = imageObj;
        
        var that = this
        //绑定信号
        imageObj.imageEvent.connect(function(imageId, eventType, eventData){
            //解决 this指向问题
            that._subscribe(that.webview, imageId, eventType, eventData)
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
    logger.verbose('NativeImage change ', data.id);
    
    var imgObj = this._getImage(data.id);
    if(!imgObj){
        this._fail(handlerId, 9000, "can't change native image: " + data.id);
        return;
    }
    if(data.src){
        imgObj.changeSource(data.src);
        delete data['src']
    }else if(!data.src || data.src.length < 20){
        this._fail(handlerId, 9000, "data.src empty: " + data.id);
        return;
    }
    this._success(handlerId, {id:data.id})
}

NativeImage.prototype.hide = function(handlerId, data){
    logger.verbose('NativeImage hide ', data.id);
    
    var imgObj = this._getImage(data.id);
    if(!imgObj){
        this._fail(handlerId, 9000, "can't hide native image: " + data.id);
        return;
    }
    if(data.id){
        imgObj.visible = false
    }
    this._success(handlerId, {id:data.id})
}

NativeImage.prototype.show = function(handlerId, data){
    logger.verbose('NativeImage show ', data.id);
    
    var imgObj = this._getImage(data.id);
    if(!imgObj){
        this._fail(handlerId, 9000, "can't show native image: " + data.id);
        return;
    }
    if(data.id){
        imgObj.visible = true
    }
    this._success(handlerId, {id:data.id})
}

NativeImage.prototype.remove = function(handlerId, data){
    logger.verbose('NativeImage remove ', data.id);

    var imgObj = this._getImage(data.id);
    if(!imgObj){
        this._fail(handlerId, 9000, "can't remove native image: " + data.id);
        return;
    }
    imgObj.destroy();
    delete this.images[data.id];

    this._success(handlerId, true)
}

NativeImage.prototype.removeAll = function(handlerId){
    var removeImageIds = Object.keys(this.images);
    logger.verbose('NativeImage removeAll: ', removeImageIds);

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


NativeImage.prototype._ratio = function(px){
    var ratio = gScreenInfo.density ? gScreenInfo.density : 1;
    try{
        px = parseInt(px);
    }catch(e){
        px = 1;
        console.log('_ratio()  parseInt(px) failed:', px, e);
    }
    return px * ratio;
}

NativeImage.prototype._getImage = function(imageId) {
    if(!imageId || !this.images[imageId]){
        return null;
    }
    return this.images[imageId];
}

NativeImage.prototype._success = function(handlerId, result){
    logger.verbose('NativeImage _success: %s result: %j', handlerId, result)
    this.webview.onSuccess(handlerId, result)
}

NativeImage.prototype._fail = function(handlerId, errorCode, errorMsg){
    this.webview.onFailed(handlerId, errorCode, errorMsg)
}

NativeImage.prototype._subscribe = function(webview, imageId, eventType, eventData){
    var curUrl = webview.object.getCurrentUrl()

    webview.pushQueue('subscribe', {
      url: curUrl,
      handlerName: 'onImageEvent',
      result: {
        id: imageId,
        type: eventType,
        data: eventData
      }
    });

    webview.dog(curUrl);
}
