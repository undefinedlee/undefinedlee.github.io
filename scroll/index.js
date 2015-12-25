/**
	空气阻力公式：
 		F = C × v × v
 		C为阻力系数（物理中为：1 / 2 × 空气阻力系数 × 空气密度 × 迎风面积）
 		v为速度

 	弹力公式：
 		F = C × L
 		C为弹力系数
 		L为拉伸长度

 	加速度公式：
 		A = C × F
 		C为加速度系数（物理中为：1 / 质量）
 */

// 帧频
var fps = 50;
// 弹力系数
var CSpring = 10;
// 加速度系数
var CA = 0.05;
// 空气阻力系数
var CAir = 0.015;
// 最小阻力
var minF = 10;
// 反弹系数
var CBack = 0.1;
// 最低反弹速度
var minVBack = 0.5;

function Scroll(config, pluginsConfig){
	this.container = config.container;
	this.target = config.target;

	this.refreshRange();
	this.bindEvent();

	// 初始化插件
	var self = this;
	pluginsConfig = pluginsConfig || {};
	Scroll.Plugins.forEach(function(plugin){
		var config = pluginsConfig[plugin.name];

		if(plugin.default){
			if(config === false){
				return;
			}
		}else if(!config){
			return;
		}

		new plugin.factory(self, config && typeof config === "object" ? config : {});
	});
}
Scroll.prototype = {
	// 最大溢出范围
	maxOverflow: 100,
	bindEvent: function(){
		var target = this.target,
			interval,
			maxOverflow,
			minTop,
			maxTop,
			self = this;

		var offsetY,
			top = 0,
			lastTime,
			lastTop,
			nowTime,
			nowTop,
			onchange;

		// 获取当前弹力
		function getFSpring(){
			if(top < minTop){
				return CSpring * (minTop - top);
			}else if(top > maxTop){
				return -CSpring * (top - maxTop);
			}
			return 0;
		}

		function moveHandler(e){
			e.preventDefault();

			e = e.targetTouches[0];

			lastTime = nowTime;
			lastTop = nowTop;

			nowTime = +new Date();
			nowTop = e.pageY - offsetY;

			// 超出
			if(top < minTop){
				top += (nowTop - lastTop) * (0.5 - (minTop - top) / maxOverflow);
			}else if(top > maxTop){
				top += (nowTop - lastTop) * (0.5 - (top - maxTop) / maxOverflow);
			}else{
				top += nowTop - lastTop;
			}

			onchange(top);
		}

		function upHandler(){
			document.removeEventListener("touchmove", moveHandler);
			document.removeEventListener("touchend", upHandler);

			// 初始速度
			var velocity = ((nowTop - lastTop) / (nowTime - lastTime) * 1000 || 0) / fps | 0;
			var scroll;

			// 弹力
			var FSpring = getFSpring();

			// 假如初始速度为0，并且有弹力，则给个弹力方向的微小速度
			if(velocity === 0 && FSpring !== 0){
				//velocity = FSpring > 0 ? 0.0001 : -0.0001;
				velocity = FSpring / CSpring * CBack;
			}

			if(velocity < 0){
				scroll = function(){
					self.scrollHandler = null;

					var FDrag;

					if(velocity < 0 || top < minTop){
						top += velocity;
						if(velocity < 0){
							FSpring = getFSpring();
							// 阻力
							FDrag = Math.max(minF, CAir * velocity * velocity);
							// 增加当前作用力下的加速度
							velocity += (FDrag + FSpring) * CA;
							if(velocity > 0){
								velocity = 0;
							}
						}else{
							// 反弹阶段
							velocity = Math.max(minVBack, (minTop - top) * CBack);
						}
						self.scrollHandler = setTimeout(scroll, interval);
					}

					onchange(top);
				};
			}else{
				scroll = function(){
					self.scrollHandler = null;

					var FDrag;

					if(velocity > 0 || top > maxTop){
						top += velocity;
						if(velocity > 0){
							FSpring = getFSpring();
							// 阻力
							FDrag = -Math.max(minF, CAir * velocity * velocity);
							// 增加当前作用力下的加速度
							velocity += (FDrag + FSpring) * CA;
							if(velocity < 0){
								velocity = 0;
							}
						}else{
							// 反弹阶段
							velocity = Math.min(-minVBack, (maxTop - top) * CBack);
						}
						self.scrollHandler = setTimeout(scroll, interval);
					}

					onchange(top);
				};
			}

			scroll();
		}

		target.addEventListener("touchstart", function(e){
			e.preventDefault();
			self.stop();

			e = e.targetTouches[0];

			interval = 1000 / fps;
			maxOverflow = self.maxOverflow * 2;
			minTop = self.range[0];
			maxTop = self.range[1];

			// 获取当前位置
			var transform = target.style.transform;
			transform = transform.match(/translateY\((\-?\d+(\.\d+)?)px\)/);
			if(transform){
				top = +transform[1];
			}else{
				top = 0;
			}

			lastTime = nowTime = +new Date();
			lastTop = nowTop = top;
			offsetY = e.pageY - top;

			var listeners = self.listeners;
			if(listeners && listeners.length){
				onchange = function(top){
					top = +top.toFixed(2);

					target.style.transform = "translateY(" + top + "px)";

					var e = {
						scrollTop: -top
					};

					listeners.forEach(function(listener){
						listener.call(self, e);
					});
				};
			}else{
				onchange = function(top){
					top = +top.toFixed(2);
					
					target.style.transform = "translateY(" + top + "px)";
				};
			}

			document.addEventListener("touchmove", moveHandler);
			document.addEventListener("touchend", upHandler);
		});
	},
	refreshRange: function(){
		this.range = [-Math.max(0, this.target.offsetHeight - this.container.offsetHeight), 0];
	},
	stop: function(){
		if(this.scrollHandler){
			clearTimeout(this.scrollHandler);
			this.scrollHandler = null;
		}
	},
	onScroll: function(listener){
		if(this.listeners){
			this.listeners.push(listener);
		}else{
			this.listeners = [listener];
		}
	}
};
// 插件列表
Scroll.Plugins = [];
