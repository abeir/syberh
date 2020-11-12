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

    signal imageEvent(string eventType, var eventData)

    anchors.top: parent.top
    anchors.left: parent.left
    z: parent.z + 1

    MouseArea {
        anchors.fill: parent

        onPositionChanged: {
            mouse.accepted = true
            imageEvent('move', {x: mouse.x, y: mouse.y})
        }
        onPressed: {
            mouse.accepted = true
            imageEvent('pressed', {x: mouse.x, y: mouse.y})
        }
        onReleased: {
            mouse.accepted = true
            imageEvent('released', {x: mouse.x, y: mouse.y})
        }
    }
}