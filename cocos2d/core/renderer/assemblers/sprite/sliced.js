/****************************************************************************
 Copyright (c) 2017-2018 Xiamen Yaji Software Co., Ltd.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

const Sprite = require('../../../components/CCSprite');
const FillType = Sprite.FillType;

module.exports = {
    createData (sprite) {
        let renderData = sprite.requestRenderData();
        renderData.dataLength = 4;
        renderData.vertexCount = 16;
        renderData.indiceCount = 54;
        return renderData;
    },
    
    update (sprite) {
        let renderData = sprite._renderData;
        if (renderData.uvDirty) {
            this.updateUVs(sprite);
        }
        if (renderData.vertDirty) {
            this.updateVerts(sprite);
        }
    },

    updateUVs (sprite) {
        let material = sprite.getMaterial();
        let renderData = sprite._renderData;
        if (material && renderData) {
            let texture = material.effect.getProperty('texture');
            let frame = sprite.spriteFrame;
            let rect = frame._rect;
            let atlasWidth = texture._width;
            let atlasHeight = texture._height;
        
            // caculate texture coordinate
            let leftWidth = frame.insetLeft;
            let rightWidth = frame.insetRight;
            let centerWidth = rect.width - leftWidth - rightWidth;
            let topHeight = frame.insetTop;
            let bottomHeight = frame.insetBottom;
            let centerHeight = rect.height - topHeight - bottomHeight;
        
            // uv computation should take spritesheet into account.
            let data = renderData._data;
            if (frame._rotated) {
                data[0].u = (rect.x) / atlasWidth;
                data[0].v = (rect.y) / atlasHeight;
                data[1].u = (bottomHeight + rect.x) / atlasWidth;
                data[1].v = (leftWidth + rect.y) / atlasHeight;
                data[2].u = (bottomHeight + centerHeight + rect.x) / atlasWidth;
                data[2].v = (leftWidth + centerWidth + rect.y) / atlasHeight;
                data[3].u = (rect.x + rect.height) / atlasWidth;
                data[3].v = (rect.y + rect.width) / atlasHeight;
            }
            else {
                data[0].u = (rect.x) / atlasWidth;
                data[1].u = (leftWidth + rect.x) / atlasWidth;
                data[2].u = (leftWidth + centerWidth + rect.x) / atlasWidth;
                data[3].u = (rect.x + rect.width) / atlasWidth;
                data[3].v = (rect.y) / atlasHeight;
                data[2].v = (topHeight + rect.y) / atlasHeight;
                data[1].v = (topHeight + centerHeight + rect.y) / atlasHeight;
                data[0].v = (rect.y + rect.height) / atlasHeight;
            }
            renderData.uvDirty = false;
        }
    },
    
    updateVerts (sprite) {
        let renderData = sprite._renderData,
            data = renderData._data,
            width = renderData._width,
            height = renderData._height,
            appx = renderData._pivotX * width, 
            appy = renderData._pivotY * height;
    
        let frame = sprite.spriteFrame;
        let rect = frame._rect;
        let leftWidth = frame.insetLeft;
        let rightWidth = frame.insetRight;
        let topHeight = frame.insetTop;
        let bottomHeight = frame.insetBottom;
    
        let sizableWidth = width - leftWidth - rightWidth;
        let sizableHeight = height - topHeight - bottomHeight;
        let xScale = width / (leftWidth + rightWidth);
        let yScale = height / (topHeight + bottomHeight);
        xScale = (isNaN(xScale) || xScale > 1) ? 1 : xScale;
        yScale = (isNaN(yScale) || yScale > 1) ? 1 : yScale;
        sizableWidth = sizableWidth < 0 ? 0 : sizableWidth;
        sizableHeight = sizableHeight < 0 ? 0 : sizableHeight;
        data[0].x = -appx;
        data[0].y = -appy;
        data[1].x = leftWidth * xScale - appx;
        data[1].y = bottomHeight * yScale - appy;
        data[2].x = data[1].x + sizableWidth;
        data[2].y = data[1].y + sizableHeight;
        data[3].x = width - appx;
        data[3].y = height - appy;

        renderData.vertDirty = false;
    },
    
    fillVertexBuffer (sprite, index, vbuf, uintbuf) {
        let node = sprite.node;
        let renderData = sprite._renderData;
        let data = renderData._data;
        let z = node._position.z;
        
        let color = node._color._val;
        
        node._updateWorldMatrix();
        let matrix = node._worldMatrix;
        let a = matrix.m00,
            b = matrix.m01,
            c = matrix.m04,
            d = matrix.m05,
            tx = matrix.m12,
            ty = matrix.m13;

        let colD, rowD;
        for (let row = 0; row < 4; ++row) {
            rowD = data[row];
            for (let col = 0; col < 4; ++col) {
                colD = data[col];
                vbuf[index] = colD.x*a + rowD.y*c + tx;
                vbuf[index + 1] = colD.x*b + rowD.y*d + ty;
                vbuf[index + 2] = z;
                vbuf[index + 4] = colD.u;
                vbuf[index + 5] = rowD.v;
                uintbuf[index + 3] = color;
                index += 6;
            }
        }
    },
    
    fillIndexBuffer (sprite, offset, vertexId, ibuf) {
        for (let r = 0; r < 3; ++r) {
            for (let c = 0; c < 3; ++c) {
                let start = vertexId + r*4 + c;
                ibuf[offset++] = start;
                ibuf[offset++] = start + 1;
                ibuf[offset++] = start + 4;
                ibuf[offset++] = start + 1;
                ibuf[offset++] = start + 5;
                ibuf[offset++] = start + 4;
            }
        }
    }
};
