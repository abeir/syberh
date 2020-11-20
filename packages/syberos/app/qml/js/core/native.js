
function NativeImage(webview){
    this.webview = webview
    // 保存原生图片对象，key: handlerId， value: 图片组件对象
    this.images = {}
}

NativeImage.prototype.create = function(handlerId, data){
    console.log('NativeImage create: ', handlerId, ', width:', data.width, ', height:', data.height);

    var navBarHeight = this.webview.object.getNavigationBarHeight();

    var properties = { imageId: handlerId.toString() }
    if(data.width){
        properties.width = this._ratio(data.width);
        properties['sourceSize.width'] = properties.width
    }
    if(data.height){
        properties.height = this._ratio(data.height);
        properties['sourceSize.height'] = properties.height
    }
    if(data.src){
        properties.source = data.src;
    }
    if(data.x){
        properties.x = parseInt(data.x) + navBarHeight;
    }
    if(data.y){
        properties.y = parseInt(data.y);
    }  if(data.offsetTop){
        properties.useArchors = true;
        properties['anchors.topMargin'] = this._ratio(data.offsetTop) + navBarHeight;
    }
    if(data.offsetLeft){
        properties.useArchors = true;
        properties['anchors.leftMargin'] = this._ratio(data.offsetLeft);
    }

    var tagId = handlerId.toString();
    var bakId = this._backId(tagId);
    var component = Qt.createComponent("qrc:/qml/native/SImage.qml");
    if (component.status == Component.Ready) {
        properties.tagId = tagId;
        properties.bakId = bakId;
        var imageObj = component.createObject(this.webview.object.getWebview(), properties);
        //缓存图片组件对象
        this.images[tagId] = imageObj;
        
        var that = this
        //绑定信号
        imageObj.imageEvent.connect(function (imgId, eventType, eventData) {
            if (eventType === 'ready') {
                console.log("NativeImage on ready", imgId);
                //当前图片
                var currentImage = that.images[eventData.tagId]
                var bakImage = that.images[eventData.bakId];
                currentImage.visible = true
                bakImage.visible = false
                bakImage.source = "";
                return;
            }
            //解决 this指向问题
            that._subscribe(that.webview, imgId, eventType, eventData)
        })
        
        //创建备用图片
        properties.tagId = bakId;
        properties.bakId = tagId;
        properties.visible = false
        properties.source=""
        var imageObj2 = component.createObject(this.webview.object.getWebview(), properties);
        //缓存图片组件对象
        this.images[bakId] = imageObj2;

        //绑定信号
        imageObj2.imageEvent.connect(function (imgId, eventType, eventData) {
            if (eventType === 'ready') {
                console.log("NativeImage on ready", imgId);
                //当前图片
                var currentImage = that.images[eventData.tagId]
                var bakImage = that.images[eventData.bakId];
                currentImage.visible = true
                bakImage.visible = false
                bakImage.source = "";
                return;
            }
            //解决 this指向问题
            that._subscribe(that.webview, imgId, eventType, eventData)
        })
        //监听sloadingChanged信号
        // this.webview.object.sloadingChanged.connect(function(loadRequest){
        //     if(loadRequest.status === 0){
        //         that.removeAll()
        //     }
        // })

        this._success(handlerId, { 
            id: handlerId, 
            width: properties.width, 
            height: properties.height,
            offsetTop: properties['anchors.topMargin'],
            offsetLeft: properties['anchors.leftMargin'],
            navigationBarHeight: navBarHeight
        });
        return;
    }
    this._fail(handlerId, 9000, "can't create native image: " + component.errorString());
}

NativeImage.prototype.change = function(handlerId, data){
    console.log('NativeImage change: ', data.id);
    
    var imgObj = this._getImage(data.id);
    if(!imgObj){
        this._fail(handlerId, 9000, "can't change native image: " + data.id);
        return;
    }
    var bakId = this._backId(data.id);
    //如果当前是可见的,则设置备用图片
    if (imgObj.visible) {
        //备用图片
       imgObj = this._getImage(bakId);
    }

    if (data.src && data.src.length>0) {
        imgObj.source = data.src
        //imgObj.changeSource(data.src);
    } else {
        console.log('>>native.js>>src>>>false')
    }
    this._success(handlerId, {id: data.id})
}

NativeImage.prototype.hide = function(handlerId, data){
    console.log('NativeImage hide ', data.id);
    
    var imgObj = this._getImage(data.id);
    if(!imgObj){
        this._fail(handlerId, 9000, "can't hide native image: " + data.id);
        return;
    }
    imgObj.hide = true;
    imgObj.visible = false;

    var bakId = this._backId(data.id);
    var imgBkObj = this._getImage(bakId);
    if(!imgBkObj){
        this._fail(handlerId, 9000, "can't hide native back image: " + bakId);
        return;
    }
    imgBkObj.hide = true;
    imgBkObj.visible = false;
    
    this._success(handlerId, {id:data.id})
}

NativeImage.prototype.show = function(handlerId, data){
    console.log('NativeImage show ', data.id);
    
    var imgObj = this._getImage(data.id);
    if(!imgObj){
        this._fail(handlerId, 9000, "can't show native image: " + data.id);
        return;
    }
    if(data.id){
        imgObj.hide = false;
        imgObj.visible = true;
    }
    var bakId = this._backId(data.id);
    var imgBkObj = this._getImage(bakId);
    if(!imgBkObj){
        this._fail(handlerId, 9000, "can't hide native back image: " + bakId);
        return;
    }
    imgBkObj.hide = false;
    this._success(handlerId, {id:data.id})
}

NativeImage.prototype.remove = function(handlerId, data){

    var imgObj = this._getImage(data.id);
    if(!imgObj){
        this._fail(handlerId, 9000, "can't remove native image: " + data.id);
        return;
    }
    imgObj.destroy();
    delete this.images[data.id];

    var backId = this._backId(data.id);
    var imgBkObj = this._getImage(backId);
    if(!imgBkObj){
        return;
    }
    imgBkObj.destroy();
    delete this.images[backId];

    this._success(handlerId, true)
}


NativeImage.prototype.removeAll = function(handlerId){
    var removeImageIds = Object.keys(this.images);
    console.log('NativeImage removeAll: ', removeImageIds);

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

NativeImage.prototype._backId = function(id){
    return id + '_b';
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
