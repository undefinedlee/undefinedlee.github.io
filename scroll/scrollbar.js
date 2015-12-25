Scroll.Plugins.push({
	name: "scrollbar",
	default: true,
	factory: function(scroll, config){
		var container = scroll.container;
		var target = scroll.target;

		var bar = document.createElement("div");
		bar.style.cssText = "position:absolute;top:0;right:0;width:4px;min-height:4px;border-radius:2px;background-color:#333;opacity:0;transition:opacity .5s;z-index:1;";
		container.appendChild(bar);

		var scale = 1;

		function refreshHeight(){
			var containerHeight = container.offsetHeight;

			scale = containerHeight / target.offsetHeight;

			bar.style.height = containerHeight * scale + "px";
		}

		function refreshPosition(e){
			bar.style.top = e.scrollTop * scale + "px";
		}

		scroll.on("scrolling", refreshPosition);
		scroll.on("scroll-start", function(){
			refreshHeight();
			if(scale < 1){
				bar.style.opacity = 0.6;
			}
		});
		scroll.on("scroll-end", function(){
			bar.style.opacity = 0;
		});
	}
});