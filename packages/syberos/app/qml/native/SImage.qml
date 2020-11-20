/***************************************************************************
 *
 * Copyright (C) 2014 Beijing Yuan Xin Technology Co.,Ltd. All rights reserved.
 *
 * Authors:
 *       Liu Jingpeng <liujingpeng@syberos.com>
 *
 * This software, including documentation, is protected by copyright controlled
 * by Beijing Yuan Xin Technology Co.,Ltd. All rights are reserved.
 ****************************************************************************/

import QtQuick 2.5
import com.syberos.basewidgets 2.0

Image {
    id: image

    property var imageId
    property bool useArchors: false
    property string tagId:""
    property string bakId:""

    property bool hide: false

    signal imageEvent(var imgId, string eventType, var eventData)
    
    cache: false
    asynchronous: true
    smooth: false
    visible:true
    z: parent.z + 1

    function changeSource(source){
        image.source="";
        image.source=source;
    }

    onStatusChanged:  {
        console.log('status',image.status)
        if(image.hide){
            return
        }
        if (image.status == Image.Ready) {
            if(!image.visible){
                imageEvent(imageId, 'ready', { bakId: image.bakId, tagId: image.tagId })
            }
        }
    }

    Component.onCompleted: {
        if(useArchors){
            anchors.top = parent.top
            anchors.left = parent.left
        }
    }

    MouseArea {
        anchors.fill: parent

        // enabled: !image.hide

        onPositionChanged: {
            mouse.accepted = true
            imageEvent(imageId, 'move', {x: mouse.x, y: mouse.y})
        }
        onPressed: {
            mouse.accepted = true
            imageEvent(imageId, 'pressed', {x: mouse.x, y: mouse.y})
        }
        onReleased: {
            mouse.accepted = true
            imageEvent(imageId, 'released', {x: mouse.x, y: mouse.y})
        }
        onDoubleClicked: {
            mouse.accepted = true
            imageEvent(imageId, 'doubleClicked', {x: mouse.x, y: mouse.y})
        }
    }
}