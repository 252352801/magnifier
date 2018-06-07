/**
 *图片放大镜
 *@Author Qingyu Wei
 */
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS
        module.exports = factory();
    } else {
        // 浏览器全局变量(root 即 window)
        root.magnifier = factory();
    }
}(this, function() {
    "use strict";

    function getMousePosition(event) {
        var e = event || window.event;
        var scrollX = document.documentElement.scrollLeft || document.body.scrollLeft;
        var scrollY = document.documentElement.scrollTop || document.body.scrollTop;
        var x = e.pageX || e.clientX + scrollX;
        var y = e.pageY || e.clientY + scrollY;
        return {
            left: x,
            top: y
        };
    }

    function getElementPosition(elem) {
        let result = {
            left: 0,
            yop: 0
        };
        if (elem instanceof HTMLElement) {
            var rect = elem.getBoundingClientRect();
            var scroll = getDocumentScroll();
            var scrollX = scroll.scrollLeft;
            var scrollY = scroll.scrollTop;
            result.left = rect.left + scrollX;
            result.top = rect.top + scrollY;
        }
        return result;
    }

    function getDocumentScroll() {
        return {
            scrollLeft: document.documentElement.scrollLeft || document.body.scrollLeft,
            scrollTop: document.documentElement.scrollTop || document.body.scrollTop
        }
    }

    function Magnifier() {
        this.wrapper = null; //图片的容器 将以此元素为放大区位置的参照
        this.img = null; //将会放大的图片
        this.scaner = null; //扫描块
        this.displayElememt = null; //用于展示的元素
        this.largeImg = null; //大图
        this.direction = 'right'; //displayElememt的位置  right bottom left top

        this.src = '';
        this.scanerWidth = 0; //扫描块宽度
        this.scanerHeight = 0; //扫描块高度

        this.scanerBackground = 'rgba(255,255,255,0.25)'; //扫描块背景

        this.offset = 10; //放大区与wrapper距离

    }
    Magnifier.prototype.init = function() {
        if (this.img instanceof HTMLElement) {
            let elem = this.img;
            let _ = this;
            elem.addEventListener('mouseenter', function(ev) {
                //获取图片宽高，位置
                //创建并设置扫描块大小
                //创建并设置放大显示框大小
                //设置放大显示框位置
                var rect = elem.getBoundingClientRect();
                _.createScaner();
                _.createDisplayArea();
                _.setScanerPosition(getElementPosition(_.img), getMousePosition(ev));
                _.setLargeImgPosition();
            });
            elem.addEventListener('mouseout', function(ev) {
                var rect = elem.getBoundingClientRect();
                var mousePos = getMousePosition(ev);
                var scroll = getDocumentScroll();
                var scrollX = scroll.scrollLeft;
                var scrollY = scroll.scrollTop;
                var l = rect.left + scrollX,
                    r = rect.right + scrollX,
                    t = rect.top + scrollY,
                    b = rect.bottom + scrollY;
                if (mousePos.left < l || mousePos.left > r ||
                    mousePos.top < t || mousePos.top > b) {
                    _.removeScaner();
                    _.removeDisplayElememt();
                }
            });
            elem.addEventListener('mousemove', function(ev) {
                _.mouseMoveAction(ev);
            });
        }

    };

    Magnifier.prototype.createScaner = function() {
        if (this.scaner instanceof HTMLElement) {
            return;
        }
        var scaner = document.createElement('DIV');
        scaner.style.width = (this.scanerWidth || 100) + 'px';
        scaner.style.height = (this.scanerHeight || 100) + 'px';
        //scaner.style.border = '1px solid red';
        scaner.style.boxSizing = 'border-box';
        scaner.style.position = 'absolute';
        scaner.style.background = this.scanerBackground;
        scaner.style.cursor = 'move';
        document.body.appendChild(scaner);
        this.scaner = scaner;
        var _ = this;
        this.scaner.addEventListener('mouseleave', function() {
            _.removeScaner();
            _.removeDisplayElememt();
        });
        this.scaner.addEventListener('mousemove', function(ev) {
            _.mouseMoveAction(ev);
        });
    };
    Magnifier.prototype.removeScaner = function() {
        if (this.scaner instanceof HTMLElement) {
            document.body.removeChild(this.scaner);
            this.scaner = null;
        }
    };
    Magnifier.prototype.removeDisplayElememt = function() {
        if (this.displayElememt instanceof HTMLElement) {
            document.body.removeChild(this.displayElememt);
            this.displayElememt = null;
            this.largeImg = null;
        }
    };
    Magnifier.prototype.mouseMoveAction = function(ev) {
        //获取鼠标位置
        //设置扫描块位置
        //计算扫描到的区域，等比放大到显示框
        this.setScanerPosition(getElementPosition(this.img), getMousePosition(ev));
        this.setLargeImgPosition();
    };
    Magnifier.prototype.setScanerPosition = function(imgPos, mousePos) {
        if (this.scaner instanceof HTMLElement) {
            var left = mousePos.left - this.scanerWidth / 2;
            var top = mousePos.top - this.scanerHeight / 2;
            var imgRect = img.getBoundingClientRect();
            var imgWidth = img.offsetWidth;
            var imgHeight = img.offsetHeight;
            var minLeft = imgPos.left;
            var minTop = imgPos.top;
            var maxLeft = imgPos.left + imgWidth - this.scanerWidth;
            var maxTop = imgPos.top + imgHeight - this.scanerHeight;
            if (left < minLeft) {
                left = minLeft;
            } else if (left > maxLeft) {
                left = maxLeft;
            }
            if (top < minTop) {
                top = minTop;
            } else if (top > maxTop) {
                top = maxTop;
            }
            this.scaner.style.left = left + 'px';
            this.scaner.style.top = top + 'px';
        }
    };
    Magnifier.prototype.createDisplayArea = function() {
        if (this.wrapper instanceof HTMLElement) {
            var wrapperRect = this.wrapper.getBoundingClientRect();
            var w = wrapperRect.right - wrapperRect.left,
                h = wrapperRect.bottom - wrapperRect.top;
            var direction = 'right'; //方向
            var directions = ['right', 'bottom', 'left', 'top'];
            if (directions.indexOf(this.position) >= 0) {
                direction = this.position;
            } else { //未设置位置时，将按照
                var bodyWidth = document.body.clientWidth;
                var bodyHeight = document.body.clientHeight;
                var selections = [{
                    direction: 'right', //方向
                    offset: bodyWidth - wrapperRect.right //wrapper右边框与可视区右边缘距离
                }, {
                    direction: 'left',
                    offset: wrapperRect.left
                }, {
                    direction: 'bottom',
                    offset: bodyHeight - wrapperRect.bottom
                }, {
                    direction: 'top',
                    offset: wrapperRect.top
                }].sort(function(a, b) { //倒序
                    return b.offset - a.offset
                });
                //选出空位做多的方向
                direction = selections[0].direction;
            }

            var left = 0,
                top = 0,
                offset = this.offset; //间隔距离
            var scroll = getDocumentScroll();
            switch (direction) {
                case 'right':
                    w = this.scanerWidth / this.scanerHeight * h;
                    left = wrapperRect.right + offset;
                    top = wrapperRect.top;
                    break;
                case 'bottom':
                    w = this.wrapper.offsetWidth;
                    h = this.scanerHeight / this.scanerWidth * w;
                    left = wrapperRect.left;
                    top = wrapperRect.bottom + offset;
                    break;
                case 'left':
                    w = this.scanerWidth / this.scanerHeight * h;
                    left = wrapperRect.left - offset - w;
                    top = wrapperRect.top;
                    break;
                case 'top':
                    w = this.wrapper.offsetWidth;
                    h = this.scanerHeight / this.scanerWidth * w;
                    left = wrapperRect.left;
                    top = wrapperRect.top - offset - h;
                    break;
            }
            //
            var box = document.createElement('DIV');
            box.style.width = w + 'px';
            box.style.height = h + 'px';
            box.style.position = 'absolute';
            box.style.left = left + 'px';
            box.style.top = top + 'px';
            box.style.background = '#fff';
            box.style.overflow = 'hidden';
            box.style.border = '1px solid #ddd';
            box.style.boxSizing = 'border-box';

            document.body.appendChild(box);
            this.displayElememt = box;

            var largeImg = document.createElement('IMG');
            var largeImgW = this.img.offsetWidth * (this.displayElememt.offsetWidth / this.scaner.offsetWidth);
            var largeImgH = this.img.offsetHeight * (this.displayElememt.offsetHeight / this.scaner.offsetHeight);
            largeImg.style.width = largeImgW + 'px';
            largeImg.style.height = largeImgH + 'px';
            largeImg.style.position = 'absolute';
            largeImg.style.position = 'absolute';
            largeImg.style.left = '0';
            largeImg.style.top = '0';
            largeImg.src = this.src;
            box.appendChild(largeImg);
            this.largeImg = largeImg;

        }
    };
    Magnifier.prototype.setLargeImgPosition = function() {
        if (this.img instanceof HTMLElement && this.scaner instanceof HTMLElement &&
            this.largeImg instanceof HTMLElement) {
            var imgRect = this.img.getBoundingClientRect();
            var scanerRect = this.scaner.getBoundingClientRect();
            var displayRect = this.displayElememt.getBoundingClientRect();
            var left = -(scanerRect.left - imgRect.left) / this.scaner.offsetWidth * 100;
            var top = -(scanerRect.top - imgRect.top) / this.scaner.offsetHeight * 100;
            this.largeImg.style.left = left + '%';
            this.largeImg.style.top = top + '%';
        }
    };
    var magnifier = function(options) {
        /*
        options = {
            element: null, //HTMLElement,//图片节点（必选）
            src:'',//大图链接（必选）
            wrapper: null, //HTMLElement,//图片容器节点（可选）
            offset:10,//wrapper与放大区域的距离
            direction: 'right', //方向  有效值：left top right bottom   （可选）
            scanerWidth: 80, //扫描块宽度 单位：px （可选）
            scanerHeight: 80 //扫描块高度 单位：px （可选）
        };
        */
        var ma = new Magnifier();
        if (options && typeof options == 'object') {
            if (options.element instanceof HTMLElement) {
                ma.img = options.element;
                ma.scanerWidth = options.scanerWidth || 80;
                ma.scanerHeight = options.scanerHeight || 80;
                ma.src = options.src || '';
                ma.direction = options.direction;
                if (options.offset) {
                    ma.offset = options.offset;
                }
                if (options.scanerBackground) {
                    ma.scanerBackground = options.scanerBackground;
                }
                if (options.wrapper instanceof HTMLElement) {
                    ma.wrapper = options.wrapper;
                } else {
                    var imgParent = ma.img.parentNode;
                    if (imgParent instanceof HTMLElement) {
                        ma.wrapper = imgParent;
                    }
                }
                ma.init();
            }
        }
    };
    return magnifier;
}));