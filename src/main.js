"use strict";

(function() {
	var cosp = null;
	
	function CanvasObject(_cosp, canvas) {
		this.canvas = canvas;
		this.ctx = this.canvas.getContext("2d");
		
		cosp = _cosp;
	}
	
	CanvasObject.prototype.act = function(frameTime) {
		
	}
	
	CanvasObject.prototype.draw = function() {
		
	}
	
	CanvasObject.prototype.onClick = function(e, worldX, worldY) {
		
	}
	
	CanvasObject.prototype.onMouseMove = function(e, worldX, worldY) {

	}
	
	CanvasObject.prototype.onContextMenu = function(e, worldX, worldY) {

	}
	
	Game.CanvasObject = CanvasObject;
})();

(function() {
	function CanvasObjectSharedProperties() {
		this.cellSize = 0;
		this.cellWidth = 0;
		this.cellHeight = 0;
		
		this.isPlacingObject = false;
		this.objectToPlace = null;
	}
	
	Game.CanvasObjectSharedProperties = CanvasObjectSharedProperties;
})();

(function() {
	var wrapper = document.getElementById("canvas_wrapper");
	var canvas = document.getElementById("canvas_events");
	var ctx = canvas.getContext("2d");
	
	var canvasObjects = [];
	
	var lastMouseX = 0, lastMouseY = 0;
	var x = 0, y = 0;
	var isCamera = false;
	var zoomLevel = 64;
	
	var cosp = null;
	
	function CanvasObjectManager(_cosp) {
		canvas.addEventListener("click", this.onClick.bind(this));
		canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
		canvas.addEventListener("wheel", this.onWheel.bind(this));
		canvas.addEventListener("contextmenu", this.onContextMenu.bind(this));
		
		cosp = _cosp;
	}
	
	CanvasObjectManager.prototype.toggleCamera = function(bool) {
		if(typeof bool === "boolean")
			isCamera = bool;
		else {
			isCamera = !isCamera;
		}
		
		this.onResize();
	}
	
	CanvasObjectManager.prototype.getCameraToggled = function() {
		return isCamera;
	}
	
	CanvasObjectManager.prototype.addCanvasObject = function(canvasObject) {
		if(canvasObject instanceof Game.CanvasObject) {
			canvasObjects.push(canvasObject);
		}
	}
	
	CanvasObjectManager.prototype.act = function(frameTime) {
		for(var i = 0; i < canvasObjects.length; i++)
			canvasObjects[i].act(frameTime);
	}
	
	CanvasObjectManager.prototype.draw = function() {
		if(isCamera) {
			if(Game.KeyInputManager.instance.getButtonDown("left"))
				x -= 16;
			if(Game.KeyInputManager.instance.getButtonDown("right"))
				x += 16;
			if(Game.KeyInputManager.instance.getButtonDown("up"))
				y -= 16;
			if(Game.KeyInputManager.instance.getButtonDown("down"))
				y += 16;
			
			this.onMouseMove({offsetX: lastMouseX, offsetY: lastMouseY});
			
			//throws negatives if reordered
			x = x > (cosp.cellSize * cosp.cellWidth - canvas.width) ? (cosp.cellSize * cosp.cellWidth - canvas.width) : x;
			x = x < 0 ? 0 : x;
			y = y > (cosp.cellSize * cosp.cellHeight - canvas.height) ? (cosp.cellSize * cosp.cellHeight - canvas.height) : y;
			y = y < 0 ? 0 : y;
		

			for(var i = 0; i < canvasObjects.length; i++) {

				canvasObjects[i].ctx.setTransform(1, 0, 0, 1, 0, 0);
				canvasObjects[i].ctx.clearRect(0, 0, canvasObjects[i].canvas.width, canvasObjects[i].canvas.height);
			
				canvasObjects[i].ctx.translate(-x, -y);
				
				canvasObjects[i].draw(x, y);
			}
		}
		else {
			for(var i = 0; i < canvasObjects.length; i++) {
				canvasObjects[i].draw(0, 0);
			}
		}
	}
	
	CanvasObjectManager.prototype.onContextMenu = function(e) {
		e.preventDefault();
		if(typeof e.offsetX == "undefined" || typeof e.offsetY == "undefined") {
			e.offsetX = e.clientX - canvas.getBoundingClientRect().left;
			e.offsetY = e.clientY - canvas.getBoundingClientRect().top;
		}
		
		var worldX = e.offsetX + (isCamera ? x : 0);
		var worldY = e.offsetY + (isCamera ? y : 0);
		
		for(var i = 0; i < canvasObjects.length; i++)
			canvasObjects[i].onContextMenu(e, worldX, worldY);
	
		return false;
	}
	
	CanvasObjectManager.prototype.onClick = function(e) {
		if(typeof e.offsetX == "undefined" || typeof e.offsetY == "undefined") {
			e.offsetX = e.clientX - canvas.getBoundingClientRect().left;
			e.offsetY = e.clientY - canvas.getBoundingClientRect().top;
		}
		
		var worldX = e.offsetX + (isCamera ? x : 0);
		var worldY = e.offsetY + (isCamera ? y : 0);
		
		for(var i = 0; i < canvasObjects.length; i++)
			canvasObjects[i].onClick(e, worldX, worldY);
	}
	
	CanvasObjectManager.prototype.onMouseMove = function(e) {
		if(typeof e.offsetX == "undefined" || typeof e.offsetY == "undefined") {
			e.offsetX = e.clientX - canvas.getBoundingClientRect().left;
			e.offsetY = e.clientY - canvas.getBoundingClientRect().top;
		}
		
		lastMouseX = e.offsetX;
		lastMouseY = e.offsetY;
		
		var worldX = e.offsetX + (isCamera ? x : 0);
		var worldY = e.offsetY + (isCamera ? y : 0);
		
		for(var i = 0; i < canvasObjects.length; i++)
			canvasObjects[i].onMouseMove(e, worldX, worldY);
	}
	
	CanvasObjectManager.prototype.onWheel = function(e) {
		if(isCamera) {
			var zoomOld = zoomLevel;
			
			if(e.deltaY < 0) {
				zoomLevel += Math.ceil(zoomLevel / 8);
			}
			else if(e.deltaY > 0) {
				zoomLevel -= Math.floor(zoomLevel / 8);
			}
			
			//var shiftPxWidth = (zoomLevel - zoomOld) * cosp.cellWidth * (lastMouseX / canvas.width);
			//var shiftPxHeight = (zoomLevel - zoomOld) * cosp.cellHeight * (lastMouseY / canvas.height);
			var shiftPxWidth = (zoomLevel - zoomOld) * ((x + lastMouseX) / cosp.cellSize);
			var shiftPxHeight = (zoomLevel - zoomOld) * ((y + lastMouseY) / cosp.cellSize);
			
			x += Math.round(shiftPxWidth);
			y += Math.round(shiftPxHeight);
			
			//x = Math.round((x * zoomLevel) / zoomOld);
			//y = Math.round((x * zoomLevel) / zoomOld);
			
			var oW = canvas.offsetWidth;
			var oH = canvas.offsetHeight;
			
			var length = Math.min(oW, oH);
			var cellLength = Math.max(cosp.cellWidth, cosp.cellHeight);
			
			var cellSize = Math.floor(length / cellLength);
			
			
			
			if(cellSize >= zoomLevel) {
				zoomLevel = cellSize;
				x = 0;
				y = 0;
			}
			
			cosp.cellSize = zoomLevel;
		}
	}

	CanvasObjectManager.prototype.onResize = function() {
		var i;
		var canvases = [];
		for(i = 0; i < canvasObjects.length; i++)
			canvases[i] = canvasObjects[i];
		canvases[i] = {canvas: canvas, ctx: ctx};
		
		wrapper.style.width = GameUtil.getWindowHeight() + "px";
		
		var oW = wrapper.clientWidth;
		var oH = wrapper.clientHeight;
		
		var length = Math.min(oW, oH);
		var cellLength = Math.max(cosp.cellWidth, cosp.cellHeight);
		
		var cellSize = Math.floor(length / cellLength);
		
		var calcWidth = cellSize * cosp.cellWidth;
		var calcHeight = cellSize * cosp.cellHeight;
		
		if(isCamera) {
			cosp.cellSize = zoomLevel;
			
			if(cellSize >= cosp.cellSize)
				cosp.cellSize = cellSize;
		}
		else
			cosp.cellSize = cellSize;
		
		for(i = 0; i < canvases.length; i++) {
			if(isCamera) {
				canvases[i].canvas.width = oW;
				canvases[i].canvas.height = oH;
				canvases[i].canvas.style.width = oW + "px";
				canvases[i].canvas.style.height = oH + "px";
				canvases[i].canvas.style.left = "0px";
				canvases[i].canvas.style.top = "0px";
			}
			else {
				canvases[i].canvas.width = calcWidth;
				canvases[i].canvas.height = calcHeight;
				canvases[i].canvas.style.width = calcWidth + "px";
				canvases[i].canvas.style.height = calcHeight + "px";
				canvases[i].canvas.style.left = Math.floor((wrapper.clientWidth - calcWidth) / 2) + "px";
				canvases[i].canvas.style.top = Math.floor((wrapper.clientWidth - calcWidth) / 2) + "px";
			}

			canvases[i].ctx.mozImageSmoothingEnabled = false;
			canvases[i].ctx.msImageSmoothingEnabled = false;
			canvases[i].ctx.imageSmoothingEnabled = false;
		}
	}
	
	Game.CanvasObjectManager = CanvasObjectManager;
})();

(function() {
	var particles = [];
	
	var cosp;
	
	function Particles(_cosp) {
		Game.CanvasObject.call(this, _cosp, document.getElementById("canvas_particles")); //TODO
		
		cosp = _cosp;
	}
	Particles.prototype = Object.create(Game.CanvasObject.prototype);
	Particles.prototype.constructor = Particles;
	
	Particles.prototype.act = function(frameTime) {
		Game.CanvasObject.prototype.act.apply(this, [frameTime]);
		
		var i;
		var l = particles.length;
		for(i = 0; i < l; i++) {
			particles[i].act(frameTime);
		}
		
		for(i = 0; i < particles.length; i++) {
			if(particles[i].isMoving == false) {
				particles.splice(particles.indexOf(particles[i]), 1);
				i--;
			}
		}
	}
	
	Particles.prototype.draw = function(worldX, worldY) {
		Game.CanvasObject.prototype.draw.apply(this);
		
		var i;
		
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		
		var l = particles.length;
		for(i = 0; i < l; i++) {
			if(GameUtil.isColliding(particles[i].x * cosp.cellSize, particles[i].y * cosp.cellSize, cosp.cellSize * particles[i].width, cosp.cellSize * particles[i].height,
				worldX, worldY, this.canvas.width + worldX, this.canvas.height + worldY))
				particles[i].draw(this.ctx, cosp.cellSize);
		}
	}
	
	Particles.prototype.createParticle = function(callback, image, width, height, x, y, targetX, targetY, speed, rotation) { //TODO
		particles.push(new Game.Particle(callback, image, width, height, new Vector2(x, y), new Vector2(targetX, targetY), speed, rotation));
	}
	
	Particles.prototype.createFloatingResourceParticle = function(decimal, image, x, y, hexColor) {
		particles.push(new Game.ParticleFloatingResource(null, image, 1, 1, new Vector2(x, y), new Vector2(x, y - 0.5), 0.5, 0, decimal, hexColor));
	}
	
	Game.Particles = Particles;
})();

(function() {
	var mouseX = 0;
	var mouseY = 0;
	
	var pxThick = 1;
	var width = 1;
	var height = 1;
	
	var cosp = null;
	
	function Highlight(_cosp) {
		Game.CanvasObject.call(this, _cosp, document.getElementById("canvas_highlight")); //TODO
		
		cosp = _cosp;
	}
	
	Highlight.prototype = Object.create(Game.CanvasObject.prototype);
	Highlight.prototype.constructor = Highlight;
	
	Highlight.prototype.onMouseMove = function(e, worldX, worldY) {
		Game.CanvasObject.prototype.onMouseMove.apply(this, [e]);
		
		mouseX = worldX;
		mouseY = worldY;
	}
	
	Highlight.prototype.draw = function(worldX, worldY) {
		Game.CanvasObject.prototype.draw.apply(this);
		
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		if(mouseX && mouseY) {
			var cell = GameUtil.convertMouseToCoordinates(mouseX, mouseY, cosp.cellSize);
			
			width = 1;
			height = 1;
			
			if(cosp.isPlacingObject && cosp.objectToPlace !== null) {
				cell = GameUtil.getPositionOfGameObjectToPlace(cosp.objectToPlace, cell.x, cell.y);

				width = cosp.objectToPlace.width;
				height = cosp.objectToPlace.height;
				
				cosp.objectToPlace.x = cell.x;
				cosp.objectToPlace.y = cell.y;
				
				this.ctx.save();
				this.ctx.globalAlpha = 0.35;
				this.ctx.drawImage(cosp.objectToPlace.image, cell.x * cosp.cellSize, cell.y * cosp.cellSize, cosp.objectToPlace.width * cosp.cellSize, cosp.objectToPlace.height * cosp.cellSize);
				this.ctx.restore();
			}
			
			
			
			this.ctx.fillStyle = "#FFFF00";
			//left | 
			this.ctx.fillRect(cell.x * cosp.cellSize, cell.y * cosp.cellSize, pxThick, cosp.cellSize * height);
			//right |
			this.ctx.fillRect((cell.x + width - 1) * cosp.cellSize + cosp.cellSize - pxThick, cell.y * cosp.cellSize, pxThick, cosp.cellSize * height);
			//top _
			this.ctx.fillRect(cell.x * cosp.cellSize, cell.y * cosp.cellSize, cosp.cellSize * width, pxThick);
			//bottom _
			this.ctx.fillRect(cell.x * cosp.cellSize, (cell.y + height - 1) * cosp.cellSize + cosp.cellSize - pxThick, cosp.cellSize * width, pxThick);
		}
	}
	
	Game.Highlight = Highlight;
})();

(function() {
	var selectedObject = null;
	
	var objects = [];
	var objectsGrid = [];
	var collisionGrid = [];
	var pfMatrix = [];
	var pfFinder = new PF.AStarFinder();
	var wallGenerator = new GameUtil.WallGenerator();
	
	var fogOfWarGrid = [];
	
	var objectsByClass = {};
	var objectsByProperty = {};
	
	var particles = null;
	var player = null;
	var cosp = null;
	
	var teamDefinitions = [
		{
			color: "lightgray"
		},
		{
			color: "blue"
		},
		{
			color: "orange"
		}
	];
	
	function Level(_particles, _player, _cosp) {
		Game.CanvasObject.call(this, _cosp, document.getElementById("canvas_level")); //TODO
		
		particles = _particles;
		player = _player;
		cosp = _cosp;
	}
	
	Level.prototype = Object.create(Game.CanvasObject.prototype);
	Level.prototype.constructor = Level;
	
	Level.prototype.getPathWithinConnectingRelays = function(origObj, targetObj, obj1, obj2) {
		if(origObj === null) {
			var _relays = this.getGameObjectsWithProperty(PRelay);
			
			if(_relays.length < 2)
				return;
			
			obj1 = _relays[0];
			obj2 = _relays[1];
			
			var _proxies = this.getGameObjectsWithProperty(PProxyAI);
			
			if(_proxies.length > 0) {
				origObj = _proxies[0];
				targetObj = obj1;
			}
		}
		
		if(origObj === null || targetObj === null || obj1 === null || obj2 === null)
			return [];
		
		var origX = origObj.x + Math.floor(origObj.width / 2);
		var origY = origObj.y + Math.floor(origObj.height / 2);
		var targetX = targetObj.x + Math.floor(targetObj.width / 2);
		var targetY = targetObj.y + Math.floor(targetObj.height / 2);
		
		if(origX < 0 || origY < 0 || targetX < 0 || targetY < 0 ||
		  origX > cosp.cellWidth - 1 || targetX > cosp.cellWidth - 1 ||
		   origY > cosp.cellHeight - 1 || targetY > cosp.cellHeight - 1)
		   return [];
		
		var relay1 = obj1.getProperty(PRelay);
		var relay2 = obj2.getProperty(PRelay);
		
		if(relay1 === null || relay2 === null)
			return [];
		
		var obj1AdjustX, obj1AdjustY, obj2AdjustX, obj2AdjustY;
		
		obj1AdjustX = obj1.x - relay1.range;	//first relay's X of top left corner of first relay including range (as square)
		obj1AdjustY = obj1.y - relay1.range;    //first relay's Y
		obj2AdjustX = obj2.x - relay2.range;	//second relay's X
		obj2AdjustY = obj2.y - relay2.range;	//second relay's Y
		
		//top left corner of range between the two relays
		var rangeAdjXLeft = (obj1AdjustX < obj2AdjustX ? obj1AdjustX : obj2AdjustX);
		var rangeAdjYTop =  (obj1AdjustY < obj2AdjustY ? obj1AdjustY : obj2AdjustY);
		rangeAdjXLeft = rangeAdjXLeft < 0 ? 0 : rangeAdjXLeft;
		rangeAdjYTop = rangeAdjYTop < 0 ? 0 : rangeAdjYTop;
		
		obj1AdjustX = obj1.x + relay1.range + obj1.width - 1;	//bottom right corner (contains adjust for relay's size)
		obj1AdjustY = obj1.y + relay1.range + obj1.height - 1;
		obj2AdjustX = obj2.x + relay2.range + obj2.width - 1;
		obj2AdjustY = obj2.y + relay2.range + obj2.height - 1;
		
		//bottom right corner of range between the two relays
		var rangeAdjXRight =  (obj1AdjustX > obj2AdjustX ? obj1AdjustX : obj2AdjustX);
		var rangeAdjYBottom = (obj1AdjustY > obj2AdjustY ? obj1AdjustY : obj2AdjustY);
		rangeAdjXRight = rangeAdjXRight > cosp.cellWidth - 1 ? cosp.cellWidth - 1 : rangeAdjXRight;
		rangeAdjYBottom = rangeAdjYBottom > cosp.cellHeight - 1 ? cosp.cellHeight - 1 : rangeAdjYBottom;
		
		var newOrigX = origX - rangeAdjXLeft;
		var newOrigY = origY - rangeAdjYTop;
		var newTargetX = targetX - rangeAdjXLeft;
		var newTargetY = targetY - rangeAdjYTop;
		
		if(newOrigX < 0 || newOrigY < 0 || newTargetX < 0 || newTargetY < 0 ||
		   newOrigX > rangeAdjXRight - rangeAdjXLeft || newTargetX > rangeAdjXRight - rangeAdjXLeft ||
		   newOrigY > rangeAdjYBottom - rangeAdjYTop || newTargetY > rangeAdjYBottom - rangeAdjYTop)
		   return [];
		
		var matrix = [];
		
		var x, y;

		for(y = 0; y <= rangeAdjYBottom - rangeAdjYTop; y++) {
			matrix[y] = [];
			for(x = 0; x <= rangeAdjXRight - rangeAdjXLeft; x++) {
				matrix[y][x] = 1;
				//this.ctx.fillStyle = "rgba(30, 30, 30, 0.5)";
				//this.ctx.fillRect(x * cosp.cellSize, y * cosp.cellSize, cosp.cellSize, cosp.cellSize);
			}
		}
		
		function getPathWithinConnectingRelaysIterator(obj) {
			var xx, yy;
			for(yy = obj.y; yy < obj.y + obj.height; yy++)
				for(xx = obj.x; xx < obj.x + obj.width; xx++)
					GameUtil.iterateOverCircle(xx - rangeAdjXLeft, yy - rangeAdjYTop, relay1.range, function(x, y) {
						if(matrix[y] !== undefined && matrix[y][x] !== undefined &&
						   collisionGrid[y + rangeAdjYTop] !== undefined && 
						   collisionGrid[y + rangeAdjYTop][x + rangeAdjXLeft] !== undefined &&
						   collisionGrid[y + rangeAdjYTop][x + rangeAdjXLeft] === 0) {
							//this.ctx.fillStyle = "rgba(200, 30, 30, 0.3)";
							//this.ctx.fillRect((x + rangeAdjXLeft) * cosp.cellSize, (y + rangeAdjYTop) * cosp.cellSize, cosp.cellSize, cosp.cellSize);
							matrix[y][x] = 0;
						}
						
						if(this.getIsGameObjectPlacedAt(targetObj, x + rangeAdjXLeft, y + rangeAdjYTop)) {
							//this.ctx.fillStyle = "rgba(200, 200, 200, 0.7)";
							//this.ctx.fillRect((x + rangeAdjXLeft) * cosp.cellSize, (y + rangeAdjYTop) * cosp.cellSize, cosp.cellSize, cosp.cellSize);
							matrix[y][x] = 0;
						}
					}.bind(this));
		}
		
		getPathWithinConnectingRelaysIterator.bind(this)(obj1);
		getPathWithinConnectingRelaysIterator.bind(this)(obj2);
		
		var grid = new PF.Grid(matrix);
		//grid.setWalkableAt(newTargetX, newTargetY, true);
		
		var path = pfFinder.findPath(newOrigX, newOrigY, newTargetX, newTargetY, grid);
		
		for(x = 0; x < path.length; x++) {
			path[x][0] += rangeAdjXLeft;
			path[x][1] += rangeAdjYTop;
			
			if(this.getIsGameObjectPlacedAt(targetObj, path[x][0], path[x][1])) {
				path.splice(x, path.length);
				break;
			}
		}
	
		for(y = rangeAdjYTop; y <= rangeAdjYBottom; y++) {
			for(x = rangeAdjXLeft; x <= rangeAdjXRight; x++) {
				//this.ctx.fillStyle = "rgba(30, 30, 30, 0.5)";
				//this.ctx.fillRect(x * cosp.cellSize, y * cosp.cellSize, cosp.cellSize, cosp.cellSize);
			}
		}
		/*
		this.ctx.fillStyle = "rgba(200, 200, 30, 0.5)";
		this.ctx.fillRect(newOrigX * cosp.cellSize, newOrigY * cosp.cellSize, cosp.cellSize, cosp.cellSize);
		this.ctx.fillStyle = "rgba(200, 200, 30, 0.5)";
		this.ctx.fillRect(newTargetX * cosp.cellSize, newTargetY * cosp.cellSize, cosp.cellSize, cosp.cellSize);
		
		this.ctx.fillStyle = "rgba(30, 200, 200, 0.8)";
		this.ctx.fillRect(rangeAdjXLeft * cosp.cellSize, rangeAdjYTop * cosp.cellSize, cosp.cellSize, cosp.cellSize);
		this.ctx.fillRect(rangeAdjXRight * cosp.cellSize, rangeAdjYBottom * cosp.cellSize, cosp.cellSize, cosp.cellSize);
		*/
		//this.ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
		//this.ctx.fillRect(obj1.x * cosp.cellSize, obj1.y * cosp.cellSize, cosp.cellSize, cosp.cellSize);
		//this.ctx.fillRect(obj2.x * cosp.cellSize, obj2.y * cosp.cellSize, cosp.cellSize, cosp.cellSize);
		
		return path;
	}
	
	Level.prototype.getPathWithinRelay = function(origX, origY, targetX, targetY, obj) {
		var relay;
		if(obj === null)
			return [];
		if(obj instanceof GameObject) {
			relay = obj.getProperty(PRelay);
			if(relay === null)
				return [];
		}
		
		var matrix = [];
		
		var x, y;
		for(y = 0; y < relay.range * 2 + obj.height; y++) {		//centered on relay (*2 + 1)
			matrix[y] = [];
			for(x = 0; x < relay.range * 2 + obj.width; x++) {
				matrix[y][x] = 1;
			}	
		}
		
		var diffOrigX = obj.x - origX;
		var diffOrigY = obj.y - origY;
		var diffTargetX = obj.x - targetX;
		var diffTargetY = obj.y - targetY;
		
		var startAtX = origX - relay.range;
		var startAtY = origY - relay.range;
		
		GameUtil.iterateOverCircle(relay.range, relay.range, relay.range, function(x, y) {
			if(collisionGrid[y + startAtY + diffOrigY] !== undefined && 
			   collisionGrid[y + startAtY + diffOrigY][x + startAtX + diffOrigX] !== undefined &&
			   collisionGrid[y + startAtY + diffOrigY][x + startAtX + diffOrigX] === 0) {
				matrix[y][x] = 0;
			}
		});
		
		var grid = new PF.Grid(matrix);
		
		var _x = relay.range - diffOrigX;
		var _y = relay.range - diffOrigY;
		var _x2 = relay.range - diffTargetX;
		var _y2 = relay.range - diffTargetY;
		
		if(_x < 0 || _x > relay.range * 2 ||
		   _y < 0 || _y > relay.range * 2 ||
		   _x2 < 0 || _x2 > relay.range * 2 ||
		   _y2 < 0 || _y2 > relay.range * 2)
		   return [];
		   
		grid.setWalkableAt(_x2, _y2, true);
		var path = pfFinder.findPath(_x, _y, _x2, _y2, grid);
		
		path.forEach(function(coordinates) {
			coordinates[0] += startAtX + diffOrigX;
			coordinates[1] += startAtY + diffOrigY;
		});
		
		return path;
	}
	
	Level.prototype.getPath = function(origX, origY, targetX, targetY) {
		var path;
		
		pfGrid.setWalkableAt(targetX, targetY, true);
		path = pfFinder.findPath(origX, origY, targetX, targetY, pfGrid.clone());
		pfGrid.setWalkableAt(targetX, targetY, false);
		
		return path;
	}
	Level.prototype.uncoverFogOfWar = function(x, y, radius) { //TODO this is a mess
		var i, j;
		for(i = -radius; i <= radius; i++)
			for(j = -radius; j <= radius; j++) {
				if(j*j+i*i <= radius*radius) {
					if(j*j+i*i >= radius * (radius/2)) {
						if(typeof fogOfWarGrid[y + i] !== "undefined" && typeof fogOfWarGrid[y + i][x + j] !== "undefined" && fogOfWarGrid[y + i][x + j] === 2)
							fogOfWarGrid[y + i][x + j] = 1;
					}
					else {
						if(typeof fogOfWarGrid[y + i] !== "undefined" && typeof fogOfWarGrid[y + i][x + j] !== "undefined")
							fogOfWarGrid[y + i][x + j] = 0;
					}
				}
			}
	}
	
	Level.prototype.resetFogOfWar = function(state) {
		fogOfWarGrid.splice(0, fogOfWarGrid.length);
		
		var x, y;
		for(y = 0; y < cosp.cellHeight; y++) {
			fogOfWarGrid[y] = [];
			for(x = 0; x < cosp.cellWidth; x++) {
				fogOfWarGrid[y][x] = state;
			}
		}
	}
	
	Level.prototype.addGameObject = function(gameObject) {
		if(gameObject instanceof GameObject) {
			var z, xx, yy;

			gameObject.isMarkedForDelete = false;
			objects.push(gameObject);
			
			var arr = objectsByClass[gameObject.constructor];
			if(arr === undefined) {
				objectsByClass[gameObject.constructor] = [];
				arr = objectsByClass[gameObject.constructor];
			}
			arr.push(gameObject);
			
			
			var props = gameObject.getProperties();
			var name;
			for(name in props) {
				arr = objectsByProperty[props[name].constructor];
				if(arr === undefined) {
					objectsByProperty[props[name].constructor] = [];
					arr = objectsByProperty[props[name].constructor];
				}
				arr.push(gameObject);
			}
			
			if(!(gameObject.x % 1) && !(gameObject.y % 1)) {
				for(yy = 0; yy < gameObject.height; yy++) {
					for(xx = 0; xx < gameObject.width; xx++) {
						if(objectsGrid[gameObject.y + yy] === undefined || objectsGrid[gameObject.y + yy][gameObject.x + xx] === undefined ||
						   collisionGrid[gameObject.y + yy] === undefined || collisionGrid[gameObject.y + yy][gameObject.x + xx] === undefined) {
							return false;
						}
					}
				}
				
				for(yy = 0; yy < gameObject.height; yy++) {
					for(xx = 0; xx < gameObject.width; xx++) {
						for(z = 0; z < objectsGrid[gameObject.y + yy][gameObject.x + xx].length; z++) { //TODO fix if length runs out
							if(objectsGrid[gameObject.y + yy][gameObject.x + xx][z] === null) {
								objectsGrid[gameObject.y + yy][gameObject.x + xx][z] = gameObject;
								
								if(gameObject.isCollider)
									collisionGrid[gameObject.y + yy][gameObject.x + xx] = 1;

								break;
							}
						}
					}
				}
			}
			
			gameObject.onPlay();
			
			var pPlayerUnit = gameObject.getProperty(PPlayerUnit);
			
			if(pPlayerUnit) {
				for(yy = 0; yy < gameObject.height; yy++)
					for(xx = 0; xx < gameObject.width; xx++) {
						this.uncoverFogOfWar(gameObject.x + xx, gameObject.y + yy, pPlayerUnit.fogOfWarRadius);
					}
			}
			return true;
		}
		else
			return false;
	}
	
	Level.prototype.getIsGameObjectPlacedAt = function(obj, x, y) {
		if(objectsGrid[y] !== undefined && objectsGrid[y][x] !== undefined) {
			var z;
			for(z = 0; z < objectsGrid[y][x].length; z++) {
				if(objectsGrid[y][x][z] === obj)
					return true;
			}
		}
		return false;
	}
	
	Level.prototype.getGameObjectsAt = function(x, y) {
		if(objectsGrid[y] !== undefined && objectsGrid[y][x] !== undefined) {
			var z, arr = [], i = 0;
			for(z = 0; z < objectsGrid[y][x].length; z++) {
				if(objectsGrid[y][x][z] !== null) {
					arr[i] = objectsGrid[y][x][z];
					i++;
				}
			}
			return arr.length === 0 ? null : arr;
		}
		
		return null;
	}
	
	Level.prototype.getSingleGameObjectOfClassAt = function(x, y, func) {
		if(objectsGrid[y] !== undefined && objectsGrid[y][x] !== undefined) {
			var z;
			for(z = 0; z < objectsGrid[y][x].length; z++) {
				if(objectsGrid[y][x][z] !== null && objectsGrid[y][x][z] instanceof func) {
					return objectsGrid[y][x][z];
				}
			}
		}
		
		return null;
	}
	
	Level.prototype.getSingleGameObjectWithPropertyAt = function(x, y, prop) {
		if(objectsGrid[y] !== undefined && objectsGrid[y][x] !== undefined) {
			var z;
			for(z = 0; z < objectsGrid[y][x].length; z++) {
				if(objectsGrid[y][x][z] !== null && objectsGrid[y][x][z].getProperty(prop) !== null) {
					return objectsGrid[y][x][z];
				}
			}
		}
		
		return null;
	}
	
	Level.prototype.getGameObjectsGrid = function() {
		return objectsGrid;
	}
	
	Level.prototype.buildGameObjectsGrid = function(width, height) {
		var i;
		var x, y, z;
		
		objectsGrid = [];
		collisionGrid = [];
		
		for(y = 0; y < height; y++) {
			objectsGrid[y] = [];
			collisionGrid[y] = [];
			
			for(x = 0; x < width; x++) {
				objectsGrid[y][x] = [];
				collisionGrid[y][x] = 0;
				objectsGrid[y][x][0] = null;
				objectsGrid[y][x][1] = null;
				objectsGrid[y][x][2] = null;
				objectsGrid[y][x][3] = null;
				objectsGrid[y][x][4] = null;
			}
		}
	}
	
	Level.prototype.getGameObjectsOfClass = function(c) {
		var i;
		var arr = [];
		var classObjects = objectsByClass[c];
		if(classObjects === undefined)
			return arr;
		
		var l = classObjects.length;
		for(i = 0; i < l; i++) {
			arr[i] = classObjects[i];
		}
		return arr;
	}
	
	Level.prototype.getGameObjectsWithProperty = function(c) {
		var i;
		var arr = [];
		var propertyObjects = objectsByProperty[c];
		if(propertyObjects === undefined)
			return arr;
		
		var l = propertyObjects.length;
		for(i = 0; i < l; i++) {
			arr[i] = propertyObjects[i];
		}
		
		return arr;
	}
	
	Level.prototype.getGameObjectsWithPropertyReturnProperty = function(c) {
		var i;
		var arr = [];
		var propertyObjects = objectsByProperty[c];
		if(propertyObjects === undefined)
			return arr;
		
		var l = propertyObjects.length;
		for(i = 0; i < l; i++) {
			arr[i] = propertyObjects[i].getProperty(c);
		}
		
		return arr;
	}
	
	Level.prototype.generateNew = function(width, height, isNoFog) {
		Game.actions.onInventoryChanged();
		selectedObject = null;
		
		var i;
		
		cosp.cellWidth = width;
		cosp.cellHeight = height;
		
		if(isNoFog)
			this.resetFogOfWar(0);
		else
			this.resetFogOfWar(2);
		
		for(var i = 0; i < objects.length; i++) {
			objects[i].destroy();
		}
		objects.splice(0, objects.length);
		objectsByClass = {};
		objectsByProperty = {};
		
		this.buildGameObjectsGrid(width, height);
		
		do {
			noise.seed(Math.random());
			
			var x, y, weight, weightArray = [], ore, oreProperty, peakArray = [], lowestPointsArray = [], random, distance;
			for(y = 0; y < height; y++) {
				weightArray[y] = [];
				for(x = 0; x < width; x++) {
					weight = 10 + Math.floor(noise.simplex2(x / 18, y / 18) * 10); //0-19
					weightArray[y][x] = weight;

					if(weight >= 19) {
						peakArray.push([x, y, Math.random() > 0.5 ? "c" : "t"]);
					}
				}
			}
			
			for(i = 0; i < 20; i++) {
				for(y = 0; y < height; y++) {
					for(x = 0; x < width; x++) {
						if(weightArray[y][x] == i)
							lowestPointsArray.push([x, y]);
					}
				}
				if(lowestPointsArray.length >= 2)
					break;
			}
		}
		while(peakArray.length <= 1);
		
		for(y = 0; y < height; y++) {
			for(x = 0; x < width; x++) {
				random = Math.random() <= weightArray[y][x] / 19;
				if(random) {
					var lowestDistance = null;
					var closestPeak = null;
					
					for(i = 0; i < peakArray.length; i++) {
						distance = Vector2.distance(new Vector2(peakArray[i][0], peakArray[i][1]), new Vector2(x, y));
						if(lowestDistance === null || lowestDistance > distance) {
							lowestDistance = distance;
							closestPeak = peakArray[i];
						}
					}

					if(lowestDistance <= width / 3) {
						if(closestPeak[2] == "c") {
							ore = GameObject.instantiate(new Ore(null, "Copper", x, y, 1, 1, cosp));
							oreProperty = ore.getProperty(POreResources);
							oreProperty.addOreResource(new OreResource("copper", "Copper", new Decimal(1), new Decimal(1)));
							oreProperty.addOreResource(new OreResource("stone", "Stone", new Decimal(1), new Decimal(1)));
						}
						else {
							ore = GameObject.instantiate(new Ore(null, "Tin", x, y, 1, 1, cosp));
							oreProperty = ore.getProperty(POreResources);
							oreProperty.addOreResource(new OreResource("tin", "Tin", new Decimal(1), new Decimal(1)));
							oreProperty.addOreResource(new OreResource("stone", "Stone", new Decimal(1), new Decimal(1)));
						}
						
						if(weightArray[y][x] >= 16) {
							oreProperty.oreResources[0].amtCur = new Decimal(96);
							oreProperty.oreResources[0].amtMax = new Decimal(96);
							oreProperty.oreResources[1].amtCur = new Decimal(96);
							oreProperty.oreResources[1].amtMax = new Decimal(96);
						}
						else if(weightArray[y][x] >= 12) {
							oreProperty.oreResources[0].amtCur = new Decimal(63);
							oreProperty.oreResources[0].amtMax = new Decimal(63);
							oreProperty.oreResources[1].amtCur = new Decimal(63);
							oreProperty.oreResources[1].amtMax = new Decimal(63);
						}
						else if(weightArray[y][x] >= 8) {
							oreProperty.oreResources[0].amtCur = new Decimal(31);
							oreProperty.oreResources[0].amtMax = new Decimal(31);
							oreProperty.oreResources[1].amtCur = new Decimal(31);
							oreProperty.oreResources[1].amtMax = new Decimal(31);
						}
						else {
							oreProperty.oreResources[0].amtCur = new Decimal(11);
							oreProperty.oreResources[0].amtMax = new Decimal(11);
							oreProperty.oreResources[1].amtCur = new Decimal(11);
							oreProperty.oreResources[1].amtMax = new Decimal(11);
						}
					}
					else {
						ore = GameObject.instantiate(new Ore(null, "Stone", x, y, 1, 1, cosp));
						oreProperty = ore.getProperty(POreResources);
						oreProperty.addOreResource(new OreResource("stone", "Stone", new Decimal(1), new Decimal(1)));
						if(weightArray[y][x] >= 16) {
							oreProperty.oreResources[0].amtCur = new Decimal(96);
							oreProperty.oreResources[0].amtMax = new Decimal(96);
						}
						else if(weightArray[y][x] >= 12) {
							oreProperty.oreResources[0].amtCur = new Decimal(63);
							oreProperty.oreResources[0].amtMax = new Decimal(63);
						}
						else if(weightArray[y][x] >= 8) {
							oreProperty.oreResources[0].amtCur = new Decimal(31);
							oreProperty.oreResources[0].amtMax = new Decimal(31);
						}
						else {
							oreProperty.oreResources[0].amtCur = new Decimal(11);
							oreProperty.oreResources[0].amtMax = new Decimal(11);
						}
					}
					
					this.addGameObject(ore);
				}
			}
		}
		
		/*for(i = 0; i < 2; i++) {
			var randomX = Math.ceil(Math.random() * (width-1));
			var randomY = Math.ceil(Math.random() * (height-1));
			switch(Math.ceil(Math.random() * 3)) {
				case 0:
					x = randomX;
					y = 0;
					break;
				case 1:
					x = randomX;
					y = height - 1;
					break;
				case 2:
					x = 0;
					y = randomY;
					break;
				default:
					x = width - 1;
					y = randomY;
					break;
			}
			var obj = this.getGameObjectAt(x, y);
			if(obj)
				obj.destroy();
			this.addGameObject(new Stash("stash", x, y, 1, 1));
		}*/
		
		var rand = [];
		rand[0] = Math.ceil(Math.random() * lowestPointsArray.length) - 1;
		rand[1] = Math.ceil(Math.random() * lowestPointsArray.length) - 1;
		
		var objs;
		var j, k, m;
		for(i = 0; i < 1; i++) {
			for(j = 0; j < 2; j++) {
				for(k = 0; k < 2; k++) {
					objs = this.getGameObjectsAt(lowestPointsArray[rand[i]][0] + j, lowestPointsArray[rand[i]][1] + k);
					
					if(objs !== null)
						for(m = 0; m < objs.length; m++)
							if(objs[m])
								objs[m].destroy();
				}
			}
			this.uncoverFogOfWar(lowestPointsArray[rand[i]][0], lowestPointsArray[rand[i]][1], 4);
		}
		
		var arrWalls = wallGenerator.getLevel(width, height, Math.random());
		var arrWalls2 = wallGenerator.getLevel(width, height, Math.random());
		var arrWalls3 = wallGenerator.getLevel(width, height, Math.random());
		for(y = 0; y < height; y++) {
			for(x = 0; x < width; x++) {
				if(arrWalls[y][x] === 1 || arrWalls2[y][x] === 1 || arrWalls3[y][x] === 1) {
					objs = this.getGameObjectsAt(x, y);
					if(objs !== null) {
						for(m = 0; m < objs.length; m++)
							if(objs[m])
								objs[m].destroy();
					}
					
					this.addGameObject(GameObject.instantiate(new Wall(Game.Assets.imgWall, "Wall", x, y, 1, 1)));
				}
			}
		}
	}
	
	Level.prototype.reportGameObjectMovementThisFrame = function(gameObject, origX, origY, targetX, targetY) {
		var objs = this.getGameObjectsAt(origX, origY);
		if(objs === null)
			return;
		var i, z, z2;
		
		for(i = 0; i < objs.length; i++) {
			if(gameObject === objs[i]) {
				var count = 0;
				
				for(z = 0; z < objectsGrid[origY][origX].length; z++) {
					if(objectsGrid[origY][origX][z] !== null && objectsGrid[origY][origX][z].isCollider)
						count++;
					
					if(objectsGrid[origY][origX][z] === gameObject) {
						objectsGrid[origY][origX][z] = null;
						count--;
						for(z2 = 0; z2 < objectsGrid[targetY][targetX].length; z2++) {
							if(objectsGrid[targetY][targetX][z2] === null) {
								objectsGrid[targetY][targetX][z2] = gameObject;
								break;
							}
						}
					}
						
				}
				
				if(!count)
					collisionGrid[origY][origX] = 0;
				
				if(gameObject.isCollider)
					collisionGrid[targetY][targetX] = 1;
				
				return true;
			}
		}
		
		return false;
	}
	
	Level.prototype.act = function(frameTime) {
		Game.CanvasObject.prototype.act.apply(this, [frameTime]);
		
		if(Game.KeyInputManager.instance.getButtonDown("delete") && selectedObject !== null) {
			selectedObject.destroy();
		}
		
		var i, x, y, obj, l;
		l = objects.length;
		for(i = 0; i < l; i++) {
			obj = objects[i];
			
			if(!obj.isMarkedForDelete)
				obj.act(frameTime);
			
			if(obj.isMarkedForDelete) {
				if(obj === selectedObject)
					selectedObject = null;
				
				if(!(obj.x % 1) && !(obj.y % 1)) {
					var z, count;
					
					for(y = obj.y; y < obj.y + obj.height; y++) {
						for(x = obj.x; x < obj.x + obj.width; x++) {
							if(objectsGrid[y] === undefined || objectsGrid[y][x] === undefined)
								continue;
							
							count = 0;
							
							l = objectsGrid[y][x].length;
							for(z = 0; z < l; z++) {
								if(objectsGrid[y][x][z] !== null && objectsGrid[y][x][z].isCollider)
									count++;
								
								if(objectsGrid[y][x][z] === obj) {
									objectsGrid[y][x][z] = null;
									count--;
								}
							}
							
							if(!count)
								collisionGrid[y][x] = 0;
						}
					}
				}
				else {
					console.warn("Level.act: Tried to remove an object that wasn't snapped."); //TODO iterate over all try to find it if this happens
				}
				
				if(selectedObject === obj)
					selectedObject = null;
				
				obj.isMarkedForDelete = false;
				objects.splice(i, 1);
				
				//////////
				var arr = objectsByClass[obj.constructor];
				if(arr !== undefined) {
					l = arr.length;
					for(i = 0; i < l; i++) {
						if(arr[i] === obj) {
							arr.splice(i, 1);
							break;
						}
						if(i === l - 1) {
							console.warn("Could not find deleted GameObject in objectsByClass - None found. Possibly critical.");
						}
					}
				}
				else {
					console.warn("Could not find deleted GameObject in objectsByClass - undefined. Possibly critical.");
				}
				
				var props = obj.getProperties();
				var name;
				for(name in props) {
					arr = objectsByProperty[props[name].constructor];
					if(arr !== undefined) {
						l = arr.length;
						for(i = 0; i < l; i++) {
							if(arr[i] === obj) {
								arr.splice(i, 1);
								break;
							}
							if(i === l - 1) {
								console.warn("Could not find deleted GameObject in objectsByProperty - None found. Possibly critical.");
							}
						}
					}
					else {
						console.warn("Could not find deleted GameObject in objectsByProperty - undefined. Possibly critical.");
					}
				}
				//////////
				Game.actions.onInventoryObjectRemoved();

				i--;
			}
		}
		
		(function() {
			var relays = this.getGameObjectsWithPropertyReturnProperty(PRelay);
			var teams = [];
			var i, j, k, l;
			l = relays.length;
			for(i = 0; i < l; i++) {
				relays[i].connections = [];
			}
			for(i = 0; i < l; i++) {
				j = relays[i].gameObject.getProperty(PPlayerUnit).team;
				if(j !== null) {
					if(teams[j] === undefined)
						teams[j] = [];
					
					teams[j].push(relays[i]);
				}
			}
			
			var oRelay, oRelayObj, tRelay, tRelayObj;
			var distance, temp;
			var x1, y1, x2, y2;
			
			var l2 = teams.length;
			var team;
			for(i = 0; i < l2; i++) {
				team = teams[i];
				if(team === undefined)
					continue;
				
				l = team.length;
				for(j = 0; j < l; j++) {
					oRelay = team[j];
					oRelayObj = oRelay.gameObject;
					
					for(k = 0; k < l; k++) {
						tRelay = team[k];
						tRelayObj = tRelay.gameObject;
						
						if(oRelay === tRelay)
							continue;
						
						distance = Number.MAX_VALUE;
						
						for(y1 = tRelayObj.y; y1 < tRelayObj.y + tRelayObj.height; y1++)
							for(x1 = tRelayObj.x; x1 < tRelayObj.x + tRelayObj.width; x1++)
								for(y2 = oRelayObj.y; y2 < oRelayObj.y + oRelayObj.height; y2++)
									for(x2 = oRelayObj.x; x2 < oRelayObj.x + oRelayObj.width; x2++) {
										temp = Vector2.distance(new Vector2(x1, y1), new Vector2(x2, y2));
										if(temp < distance)
											distance = temp;
									}
									
						if(distance > oRelay.connectRange && distance > tRelay.connectRange)
							continue;
						
						if(this.isRaycastBlocked(oRelayObj, tRelayObj))
							continue;
						
						oRelay.addConnection(tRelayObj);
						tRelay.addConnection(oRelayObj);
					}
				}
			}
			
		}).bind(this)();
	}
	
	Level.prototype.draw = function(worldX, worldY) {
		Game.CanvasObject.prototype.draw.apply(this);
		
		this.ctx.fillStyle = "#8e6b38";
		this.ctx.fillRect(0, 0, cosp.cellWidth * cosp.cellSize, cosp.cellHeight * cosp.cellSize);
		var i, x, y, z, pGridMovement;
		
		var minY = Math.floor(worldY / cosp.cellSize);
		var minX = Math.floor(worldX / cosp.cellSize);
		var maxY = Math.ceil((worldY + this.canvas.height) / cosp.cellSize);
		var maxX = Math.ceil((worldX + this.canvas.width) / cosp.cellSize);
		for(y = minY; y < maxY; y++) {
			for(x = minX; x < maxX; x++) {
				if(objectsGrid[y] !== undefined && objectsGrid[y][x] !== undefined && 
					fogOfWarGrid[y] !== undefined && fogOfWarGrid[y][x] !== undefined && 
					fogOfWarGrid[y][x] !== 2) {
					
					for(z = 0; z < objectsGrid[y][x].length; z++) {
						if(objectsGrid[y][x][z] instanceof GameObject)
							objectsGrid[y][x][z].draw(this.ctx, cosp.cellSize);
					}
				}
			}
		}
		
		for(y = minY; y < maxY; y++) {
			for(x = minX; x < maxX; x++) {
				if(fogOfWarGrid[y] !== undefined && fogOfWarGrid[y][x] !== undefined) {
					if(fogOfWarGrid[y][x] === 2) {
						this.ctx.fillStyle = "#000000";
						this.ctx.fillRect(x * cosp.cellSize, y * cosp.cellSize, cosp.cellSize, cosp.cellSize);
						
					}
					else if(fogOfWarGrid[y][x] === 1) {
						this.ctx.fillStyle = "rgba(0,0,0,0.5)";
						this.ctx.fillRect(x * cosp.cellSize, y * cosp.cellSize, cosp.cellSize, cosp.cellSize);
					}
					/*else if(cosp.isPlacingObject && this.getGameObjectsAt(x, y) === null) {
						if(cosp.objectToPlace.getProperty(PProxyAI)) { //TODO revisit if more units which need to be placed next to HQ are added
							
						} 
						else {
							this.ctx.fillStyle = "rgba(40,200,40,0.5)";
							this.ctx.fillRect(x * cosp.cellSize, y * cosp.cellSize, cosp.cellSize, cosp.cellSize);
						}
					}*/
				}
			}
		}

		/*if(cosp.isPlacingObject && cosp.objectToPlace.getProperty(PProxyAI) !== null) { //TODO revisit if more units which need to be placed next to HQ are added
			(function() {
				var hq = this.getGameObjectsWithProperty(PHeadquarters);
				
				if(hq.length > 0) {
					var i, playerUnit;
					for(i = 0; i < hq.length; i++) {
						playerUnit = hq[i].getProperty(PPlayerUnit);
						if(playerUnit !== null && playerUnit.team === cosp.objectToPlace.getProperty(PPlayerUnit).team) {
							
							var x, y;
					
							this.ctx.fillStyle = "rgba(40,200,40,0.5)";
							
							for(y = -1; y < hq[i].height + 1; y++) {
								for(x = -1; x < hq[i].width + 1; x++) {
									if(this.getGameObjectsAt(hq[i].x + x, hq[i].y + y) === null)
										this.ctx.fillRect((hq[i].x + x) * cosp.cellSize, (hq[i].y + y) * cosp.cellSize, cosp.cellSize, cosp.cellSize);
								}
							}
							
							break;
						}
					}
					
					
					
				}
			}).bind(this)();
		}*/
		
		if(cosp.isPlacingObject && cosp.objectToPlace !== null) {
			(function() {
				function isHeadquartersAdjacent(obj, team) {
					var obj = obj === null ? null : obj.getProperty(PPlayerUnit);
					obj = obj === null ? null : obj.team;
					obj = obj === null ? null : (obj !== team ? null : true);
					
					return obj === true ? true : false; //i wonder if this will look funny after i look at it in a year
				}
				
				var x, y;
				if(cosp.objectToPlace.getProperty(PProxyAI) === null) { //TODO if this grows beyond 2, add a definition list
					for(y = cosp.objectToPlace.y - 2; y < cosp.objectToPlace.y + cosp.objectToPlace.height + 2; y++) {
						for(x = cosp.objectToPlace.x - 2; x < cosp.objectToPlace.x + cosp.objectToPlace.width + 2; x++) {
							if(fogOfWarGrid[y] === undefined || fogOfWarGrid[y][x] === undefined || fogOfWarGrid[y][x] !== 0 || this.getGameObjectsAt(x, y) !== null) {
								this.ctx.fillStyle = "rgba(200,40,40,0.6)";
							}
							else {
								this.ctx.fillStyle = "rgba(40,200,40,0.6)";
							}
							
							this.ctx.fillRect(x * cosp.cellSize, y * cosp.cellSize, cosp.cellSize, cosp.cellSize);
						}
					}
				}
				else {
					var playerUnit = cosp.objectToPlace.getProperty(PPlayerUnit);
					if(playerUnit === null)
						return;
					
					for(y = cosp.objectToPlace.y - 2; y < cosp.objectToPlace.y + cosp.objectToPlace.height + 2; y++) {
						for(x = cosp.objectToPlace.x - 2; x < cosp.objectToPlace.x + cosp.objectToPlace.width + 2; x++) {
							var arr = [];
							arr[0] = isHeadquartersAdjacent(this.getSingleGameObjectWithPropertyAt(x - 1, y, PHeadquarters), playerUnit.team);
							arr[1] = isHeadquartersAdjacent(this.getSingleGameObjectWithPropertyAt(x + 1, y, PHeadquarters), playerUnit.team);
							arr[2] = isHeadquartersAdjacent(this.getSingleGameObjectWithPropertyAt(x, y - 1, PHeadquarters), playerUnit.team);
							arr[3] = isHeadquartersAdjacent(this.getSingleGameObjectWithPropertyAt(x, y + 1, PHeadquarters), playerUnit.team);
							arr[4] = isHeadquartersAdjacent(this.getSingleGameObjectWithPropertyAt(x - 1, y - 1, PHeadquarters), playerUnit.team);
							arr[5] = isHeadquartersAdjacent(this.getSingleGameObjectWithPropertyAt(x - 1, y + 1, PHeadquarters), playerUnit.team);
							arr[6] = isHeadquartersAdjacent(this.getSingleGameObjectWithPropertyAt(x + 1, y - 1, PHeadquarters), playerUnit.team);
							arr[7] = isHeadquartersAdjacent(this.getSingleGameObjectWithPropertyAt(x + 1, y + 1, PHeadquarters), playerUnit.team);
							
							
							if(this.getGameObjectsAt(x, y) === null && arr.includes(true)) {
								this.ctx.fillStyle = "rgba(40,200,40,0.6)";
							}
							else {
								this.ctx.fillStyle = "rgba(200,40,40,0.6)";
							}
							
							this.ctx.fillRect(x * cosp.cellSize, y * cosp.cellSize, cosp.cellSize, cosp.cellSize);
						}
					}
				}
				
				
			}).bind(this)();
		}
		
		
		(function() {
			var minX2 = minX - 10; //TODO adjust to range somehow
			var minY2 = minY - 10;
			var maxX2 = maxX + 10;
			var maxY2 = maxY + 10;
			minX2 = minX2 < 0 ? 0 : minX2;
			minY2 = minY2 < 0 ? 0 : minY2;
			maxX2 = maxX2 >= cosp.cellWidth ? cosp.cellWidth : maxX2;
			maxY2 = maxY2 >= cosp.cellHeight ? cosp.cellHeight : maxY2;
			
			var relays = this.getGameObjectsWithProperty(PRelay);
			var _obj
			var playerObj;
			var teams = {};
			
			for(_obj in relays) {
				playerObj = relays[_obj].getProperty(PPlayerUnit);
				if(playerObj === null)
					continue;
				
				if(teams[playerObj.team] === undefined)
					teams[playerObj.team] = [];
			}
			
			//var arr = [];
			
			for(y = minY2; y < maxY2; y++) {
				for(_obj in teams)
					teams[_obj][y] = [];
				for(x = minX2; x < maxX2; x++) {
					for(_obj in teams)
						teams[_obj][y][x] = 0;
				}
			}
			
			for(y = minY2; y < maxY2; y++) {
				for(x = minX2; x < maxX2; x++) {
					if(objectsGrid[y] !== undefined && objectsGrid[y][x] !== undefined) {
						var z;
						for(z = 0; z < objectsGrid[y][x].length; z++) {
							if(objectsGrid[y][x][z] !== null) {
								var prop = objectsGrid[y][x][z].getProperty(PRelay);
								playerObj = objectsGrid[y][x][z].getProperty(PPlayerUnit)
								
								if(playerObj === null)
									continue;
								
								if(prop !== null)
									GameUtil.iterateOverCircle(x, y, prop.range, function(x, y) {
										if(teams[playerObj.team][y] !== undefined && teams[playerObj.team][y][x] !== undefined)
											teams[playerObj.team][y][x]++;
									}.bind(this));
							}
						}
					}
				}
			}
			
			//var highlightTeam = -1;
			
			//if(isPlacingObject && objectToPlace.getProperty(PProxyAI) !== null) {
			//	var playerUnit = objectToPlace.getProperty(PPlayerUnit);
			//	if(playerUnit !== null) {
			//		highlightTeam = playerUnit.team;
			//	}
			//}
			
			for(_obj in teams) {
				//this.ctx.fillStyle = teamDefinitions[Number(_obj)].color;
				for(y = minY2; y < maxY2; y++) {
					for(x = minX2; x < maxX2; x++) {
						if(teams[_obj][y][x]) {
							//this.ctx.fillStyle = "rgba(40,200,40,0.5)";
							//if(highlightTeam !== -1 && highlightTeam == _obj && this.getGameObjectsAt(x, y) === null && fogOfWarGrid[y] !== undefined && fogOfWarGrid[y][x] !== undefined && //fogOfWarGrid[y][x] === 0) { //TODO dangerous comparison & decide to check isCollider on place && probably add a teamCoverageGrid && probably drink some tea
							//	this.ctx.fillRect(x * cosp.cellSize, y * cosp.cellSize, cosp.cellSize, cosp.cellSize);
							//}
							
							this.ctx.fillStyle = teamDefinitions[Number(_obj)].color;
							if(teams[_obj][y - 1] === undefined || teams[_obj][y - 1][x] === 0) {
								this.ctx.fillRect(x * cosp.cellSize, y * cosp.cellSize, cosp.cellSize, 2);
							}
							if(teams[_obj][y + 1] === undefined || teams[_obj][y + 1][x] === 0) {
								this.ctx.fillRect(x * cosp.cellSize, y * cosp.cellSize + cosp.cellSize - 2, cosp.cellSize, 2);
							}
							if(teams[_obj][y][x - 1] === undefined || teams[_obj][y][x - 1] === 0) {
								this.ctx.fillRect(x * cosp.cellSize, y * cosp.cellSize, 2, cosp.cellSize);
							}
							if(teams[_obj][y][x + 1] === undefined || teams[_obj][y][x + 1] === 0) {
								this.ctx.fillRect(x * cosp.cellSize + cosp.cellSize - 2, y * cosp.cellSize, 2, cosp.cellSize);
							}
						}
					}
				}
			}
		}).bind(this)();
		
		(function() {
			var obj;
			var relay;
			var connection, temp;
			var playerUnit;
			
			for(y = minY; y < maxY; y++) { //TODO create a god damn iterator you dingus
				for(x = minX; x < maxX; x++) {
					if(objectsGrid[y] !== undefined && objectsGrid[y][x] !== undefined) {
						var z;
						for(z = 0; z < objectsGrid[y][x].length; z++) {
							obj = objectsGrid[y][x][z];
							
							if(obj === null)
								continue;
							
							relay = obj.getProperty(PRelay);
							playerUnit = obj.getProperty(PPlayerUnit);
							
							if(relay === null)
								continue;
							
							for(connection in relay.connections) {
								temp = relay.connections[connection];
								
								this.ctx.strokeStyle="black";
								this.ctx.lineWidth = cosp.cellSize / 12;
								
								this.ctx.beginPath();
								this.ctx.moveTo(obj.x * cosp.cellSize + (obj.width * cosp.cellSize / 2), obj.y * cosp.cellSize + (obj.height * cosp.cellSize / 2));
								this.ctx.lineTo(temp.x * cosp.cellSize + (temp.width * cosp.cellSize / 2), temp.y * cosp.cellSize + (temp.height * cosp.cellSize / 2));
								this.ctx.stroke();
								
								this.ctx.strokeStyle= playerUnit === null ? "white" : teamDefinitions[playerUnit.team].color;
								this.ctx.lineWidth = cosp.cellSize / 18;
								
								this.ctx.beginPath();
								this.ctx.moveTo(obj.x * cosp.cellSize + (obj.width * cosp.cellSize / 2), obj.y * cosp.cellSize + (obj.height * cosp.cellSize / 2));
								this.ctx.lineTo(temp.x * cosp.cellSize + (temp.width * cosp.cellSize / 2), temp.y * cosp.cellSize + (temp.height * cosp.cellSize / 2));
								this.ctx.stroke();
							}
						}
					}
				}
			}

			
		}).bind(this)();
		
		(function() {
			if(selectedObject !== null) {
				this.ctx.fillStyle = "yellow";
				pGridMovement = selectedObject.getProperty(PGridMovement);
				x = pGridMovement ? pGridMovement.calculatedX : selectedObject.x;
				y = pGridMovement ? pGridMovement.calculatedY : selectedObject.y;
				
				this.ctx.fillRect(x * cosp.cellSize, y * cosp.cellSize, selectedObject.width * cosp.cellSize, 1);
				this.ctx.fillRect(x * cosp.cellSize, y * cosp.cellSize, 1, selectedObject.height * cosp.cellSize);
				this.ctx.fillRect(x * cosp.cellSize, y * cosp.cellSize + cosp.cellSize * selectedObject.height - 1, selectedObject.width * cosp.cellSize, 1);
				this.ctx.fillRect(x * cosp.cellSize + cosp.cellSize * selectedObject.width - 1, y * cosp.cellSize, 1, selectedObject.height * cosp.cellSize);
				
				var prop = selectedObject.getProperty(PProxyAI);
				if(prop !== null) {
					var relay = prop.focusedRelay;
					if(relay !== null) {
						this.ctx.fillStyle = "rgba(159, 0, 228, 0.4)";
						this.ctx.fillRect(relay.x * cosp.cellSize, relay.y * cosp.cellSize, relay.width * cosp.cellSize, relay.height * cosp.cellSize);
						
						prop = selectedObject.getProperty(PGridMovement);
						if(prop !== null) {
							this.ctx.strokeStyle="rgba(159, 0, 228, 0.4)";
							this.ctx.lineWidth = cosp.cellSize / 24;
							
							this.ctx.beginPath();
							this.ctx.moveTo(prop.calculatedX * cosp.cellSize + (selectedObject.width * cosp.cellSize / 2), prop.calculatedY * cosp.cellSize + (selectedObject.height * cosp.cellSize / 2));
							this.ctx.lineTo(relay.x * cosp.cellSize + (relay.width * cosp.cellSize / 2), relay.y * cosp.cellSize + (relay.height * cosp.cellSize / 2));
							this.ctx.stroke();
						}
					}
				}
			}
		}).bind(this)();
	
		//this.getPathWithinConnectingRelays(null, null, null, null, null, null);
	}
	
	//http://playtechs.blogspot.com/2007/03/raytracing-on-grid.html
	Level.prototype.isRaycastBlocked = function(obj1, obj2) {
		var dx = Math.abs(obj2.x - obj1.x);
		var dy = Math.abs(obj2.y - obj1.y);
		var x = obj1.x;
		var y = obj1.y;
		var n = 1 + dx + dy;
		var xInc = (obj2.x > obj1.x) ? 1 : -1;
		var yInc = (obj2.y > obj1.y) ? 1 : -1;
		var error = dx - dy;
		
		dx *= 2;
		dy *= 2;
		
		var obj;
		var z;
		
		var xx1, xx2, yy1, yy2, isIgnore = false;
		
		for(; n > 0; n--) {
			isIgnore = false;
			
			loop:
			for(yy1 = obj1.y; yy1 < obj1.y + obj1.height; yy1++) {
				for(xx1 = obj1.x; xx1 < obj1.x + obj1.width; xx1++) {
					for(yy2 = obj2.y; yy2 < obj2.y + obj2.height; yy2++) {
						for(xx2 = obj2.x; xx2 < obj2.x + obj2.width; xx2++) {
							if((x === xx1 && y === yy1) || (x === xx2 && y === yy2)) { //if not the origin or target object(s)
								isIgnore = true;
								break loop;
							}
						}
					}
				}
			}
			
			
			//if(!((x === obj2.x && y === obj2.y) || (x === obj1.x && y === obj1.y))) { 
			if(!isIgnore) {
				obj = this.getGameObjectsAt(x, y);
				if(obj !== null) {
					for(z = 0; z < obj.length; z++) {
						if(!(obj[z] instanceof Proxy)) //TODO less manual picking units in future maybe? (i dont know right now)
							return true;
					}
				}
			}
			
			if(error > 0) {
				x += xInc;
				error -= dy;
			}
			else {
				y += yInc;
				error += dx;
			}
		}
		
		return false;
	}
	
	Level.prototype.placeSelectedGameObject = function(x, y) {
		if(cosp.isPlacingObject === false || fogOfWarGrid[y] === undefined || fogOfWarGrid[y][x] === undefined || fogOfWarGrid[y][x] !== 0)
			return false;
		
		var i, j;
		
		var pos = GameUtil.getPositionOfGameObjectToPlace(cosp.objectToPlace, x, y);
		
		cosp.objectToPlace.x = pos.x;
		cosp.objectToPlace.y = pos.y;
		
		if(cosp.objectToPlace.getProperty(PProxyAI) !== null) { //TODO revisit if more units which need to be placed next to HQ are added
			var hq = this.getGameObjectsWithProperty(PHeadquarters);
				
			if(hq.length > 0) {
				var m, playerUnit;
				var isOK = false;
				
				for(m = 0; m < hq.length; m++) {
					playerUnit = hq[m].getProperty(PPlayerUnit);
					if(playerUnit !== null && playerUnit.team === cosp.objectToPlace.getProperty(PPlayerUnit).team) {
						
						for(i = -1; i < hq[m].height + 1; i++) {
							for(j = -1; j < hq[m].width + 1; j++) {
								if(cosp.objectToPlace.x === hq[m].x + j && cosp.objectToPlace.y === hq[m].y + i && this.getGameObjectsAt(hq[m].x + j, hq[m].y + i) === null)
									isOK = true;
							}
						}
						
						break;
					}
				}

				
				if(!isOK)
					return false;
			}
			else
				return false;
		}
		
		for(i = cosp.objectToPlace.y; i < cosp.objectToPlace.y + cosp.objectToPlace.height; i++)
			for(j = cosp.objectToPlace.x; j < cosp.objectToPlace.x + cosp.objectToPlace.width; j++) {
				if(this.getGameObjectsAt(j, i) !== null)
					return false;
			}
		
		if(this.addGameObject(cosp.objectToPlace)){
			cosp.isPlacingObject = false;
			//objectToPlace = null;
			
			Game.actions.onInventoryObjectPlaced(cosp.objectToPlace);
			return true;
		}
		
		
		return false;
	}
	
	Level.prototype.onClick = function(e, worldX, worldY) {
		Game.CanvasObject.prototype.onClick.apply(this, [e]);
		
		var pos = GameUtil.convertMouseToCoordinates(worldX, worldY, cosp.cellSize);
		
		if(fogOfWarGrid[pos.y] !== undefined && fogOfWarGrid[pos.y][pos.x] !== undefined && fogOfWarGrid[pos.y][pos.x] === 2) { //click on darkest fog no select
			this.setSelectedObject(null);
			return;
		}
		
		if(cosp.isPlacingObject) {
			this.placeSelectedGameObject(pos.x, pos.y);
		}
		else {
			var objs = this.getGameObjectsAt(pos.x, pos.y);
			
			if(objs !== null)
				this.setSelectedObject(objs[0]);
			else
				this.setSelectedObject(null);
		}
	}
	
	Level.prototype.onContextMenu = function(e, worldX, worldY) {
		cosp.isPlacingObject = false;
		cosp.objectToPlace = null;
		
		Game.actions.onNoLongerPlacingObject();
	}
	
	Level.prototype.isGameObjectPlaced = function(gameObject) {
		if(gameObject instanceof GameObject) {
			var i;
			for(i = 0; i < objects.length; i++) {
				if(objects[i] === gameObject)
					return true;
			}
		}
		return false;
	}
	
	Level.prototype.getSelectedObject = function() {
		return selectedObject;
	}
	
	Level.prototype.setSelectedObject = function(gameObject) {
		if(gameObject instanceof GameObject) {
			if(this.isGameObjectPlaced(gameObject)) {
				selectedObject = gameObject;
				Game.actions.onSelectedGameObjectChanged();
				return true;
			}
		}
		else if(gameObject === null) {
			selectedObject = null;
			Game.actions.onSelectedGameObjectChanged();
			return true;
		}
		
		return false;
	}
	
	Level.prototype.togglePlaceObject = function(gameObject) {
		if(gameObject instanceof GameObject) {
			if(!cosp.isPlacingObject || (cosp.isPlacingObject && gameObject !== cosp.objectToPlace)) {
				cosp.isPlacingObject = true;
				cosp.objectToPlace = gameObject;
				return true;
			}
			else {
				cosp.isPlacingObject = false;
				cosp.objectToPlace = null;
				return false;
			}
		}
		
		return false;
	}
	
	Game.Level = Level;
})();

(function() {
	var resources = {
		science : new Decimal(0),
		stone : new Decimal(0),
		copper : new Decimal(0),
		tin : new Decimal(0),
		iron : new Decimal(0)
	}
	
	var inventory = [];
	
	function Player() {
	
	}
	
	Player.prototype.addResource = function(resourceName, val) {
		if(typeof resources[resourceName] !== "undefined") {
			resources[resourceName] = resources[resourceName].plus(val);
			return true;
		}
		return false;
	}
	
	Player.prototype.addGameObjectToInventory = function(gameObject) {
		if(gameObject instanceof GameObject) {
			var p = gameObject.getProperty(PPlayerUnit);
			
			if(p) {
				var i;
				for(i = 0; i < inventory.length; i++) {
					if(gameObject === inventory[i])
						return false;
				}
				p.id = inventory.length;
				inventory.push(gameObject);
				
				Game.actions.onInventoryChanged();
				return true;
			}
		}
		
		return false;
	}
	
	Player.prototype.getResources = function() {
		return {
			science : resources.science.toNumber(),
			stone : resources.stone.toNumber(),
			copper : resources.copper.toNumber(),
			tin : resources.tin.toNumber(),
			iron : resources.iron.toNumber()
		}
	}
	
	Player.prototype.getInventory = function() {
		return inventory;
	}
	
	Game.Player = Player;
})();

(function() {
	function Binding() {
		this.key = null;
		this.keyAlt = null;
	}
	
	var keybinds = {}; //Binding{}
	var keysDown = []; //[]
	
	function onKeyDown(e) {
		if(!keysDown.includes(e.keyCode))
			keysDown.push(e.keyCode)
	}
	
	function onKeyUp(e) {
		var index = keysDown.indexOf(e.keyCode);
		if(index > -1)
			keysDown.splice(index, 1);
	}
	
	function KeyInputManager() {
		if(!Game.KeyInputManager.instance) {
			
		}
		else return null;
		
		this.Key = {
			Shift: 16,
			A: 65,
			B: 66,
			C: 67,
			D: 68,
			E: 69,
			F: 70,
			G: 71,
			H: 72,
			I: 73,
			J: 74,
			K: 75,
			L: 76,
			M: 77,
			N: 78,
			O: 79,
			P: 80,
			Q: 81,
			R: 82,
			S: 83,
			T: 84,
			U: 85,
			V: 86,
			W: 87,
			X: 88,
			Y: 89,
			Z: 90
		}
		Object.freeze(this.Key);
		
		document.addEventListener("keydown", onKeyDown.bind(this));
		document.addEventListener("keyup", onKeyUp.bind(this));
		
		Game.KeyInputManager.instance = this;
	}
	
	KeyInputManager.prototype.changeKeybind = function(name, key, isAlt) {
		if(keybinds[name] === undefined) {
			keybinds[name] = new Binding();
		}
		
		if(isAlt)
			keybinds[name].keyAlt = key;
		else
			keybinds[name].key = key;
	}
	
	KeyInputManager.prototype.getKeybind = function(name, isAlt) {
		if(keybinds[name] === undefined) {
			return null;
		}
		
		if(isAlt)
			return keybinds[name].keyAlt;
		else
			return keybinds[name].key;
	}
	
	KeyInputManager.prototype.getButtonDown = function(name) {
		if(keybinds[name] === undefined) {
			return false;
		}
		
		return keysDown.includes(keybinds[name].key) || keysDown.includes(keybinds[name].keyAlt);
	}
	
	Game.KeyInputManager = KeyInputManager;
	Game.KeyInputManager.instance = new Game.KeyInputManager();
})();

(function() {
	var textOwnedScience = document.getElementById("text_owned_science");
	var textOwnedStone = document.getElementById("text_owned_stone");
	var textOwnedCopper = document.getElementById("text_owned_copper");
	var textOwnedTin = document.getElementById("text_owned_tin");
	
	var buttonUseFog = document.getElementById("button_use_fog"); 
	
	var buttonNewLevel16 = document.getElementById("button_new_level_16");
	var buttonNewLevel32 = document.getElementById("button_new_level_32");
	var buttonNewLevel64 = document.getElementById("button_new_level_64");
	var buttonNewLevel128 = document.getElementById("button_new_level_128");
	var buttonNewLevel256 = document.getElementById("button_new_level_256");
	var buttonNewLevel512 = document.getElementById("button_new_level_512");
	var buttonNewLevel1024 = document.getElementById("button_new_level_1024");
	
	var buttonDrawDebug = document.getElementById("button_draw_debug");
	var buttonToggleCamera = document.getElementById("button_toggle_camera");
	
	var containerSelectionDescription = document.getElementById("container_selection_description");
	var containerInventory = document.getElementById("container_inventory");
	var containerSelectionUpgrades = document.getElementById("container_selection_upgrades");
	
	var arrInventory = [];
	
	var settings = null;
	var level = null;
	var player = null;
	
	function UI(_settings, _level, _player) {
		settings = _settings;
		level = _level;
		player = _player;
	}
	
	UI.prototype.update = function() {
		var i, str = "";
		
		var resources = player.getResources();
		textOwnedScience.innerHTML = resources.science;
		textOwnedStone.innerHTML = resources.stone;
		textOwnedCopper.innerHTML = resources.copper;
		textOwnedTin.innerHTML = resources.tin;
		
		var obj = level.getSelectedObject();
		if(obj) {
			if(obj instanceof GameObject) {
				str += obj.name + " (" + obj.x + "," + obj.y + ") w:" + obj.width + " h:" + obj.height + "<br><br>";
				
				var p, i;
				p = obj.getProperty(PPlayerUnit);
				if(p) {
					str += "Clear fog radius: " + p.fogOfWarRadius + "<br><br>";
				}
				
				if(obj instanceof Ore) {
					p = obj.getProperty(POreResources);
					str += "Contains:<br>";
					for(i = 0; i < p.oreResources.length; i++) {
						str += p.oreResources[i].labelName + ": " + p.oreResources[i].amtCur.toNumber() + "/" + p.oreResources[i].amtMax.toNumber() + "<br>";
						
					}
				}
				else if(obj instanceof Proxy) {
					var ore;
					
					str += "Speed: " + (Math.round(obj.speed * 100) / 100) + " cells/s<br>"; //TODO prettify
					str += "Mining speed: " + (Math.round(obj.miningSpeed * 100) / 100) + "/s<br>"; //TODO prettify
					str += "State: " + obj.getProperty(PProxyAI).state + "<br><br>";
					p = obj.getProperty(POreBuffer);
					str += "Stored ore: " + p.bufferCount.toNumber() + "/" + p.bufferMax.toNumber() + "<br>";
					for(ore in p.buffer) {
						str += ore + ": " + p.buffer[ore].toNumber() + "<br>";
					}
				}
			}
		}
		
		containerSelectionDescription.innerHTML = str;
	}
	
	UI.prototype.resetInventoryButtonColors = function() {
		var inventory = player.getInventory();
		var i;
		var l = inventory.length;
		for(i = 0; i < l; i++) {
			if(level.isGameObjectPlaced(inventory[i]))
				GameUtil.swapClass("btn-col-", "btn-col-disabled", arrInventory[i]);
			else
				GameUtil.swapClass("btn-col-", "btn-col-default", arrInventory[i]);
		}
	}
	
	UI.prototype.onInventoryObjectPlaced = function(object) {
		if(!(object instanceof GameObject))
			return;
		
		this.resetInventoryButtonColors();
		
		level.setSelectedObject(object); //TODO decide if this should be kept
		
		if(Game.KeyInputManager.instance.getButtonDown("placeMultiple")) {
			var inventory = player.getInventory();
			var i;
			var l = inventory.length;
			for(i = 0; i < l; i++) {
				if(object.constructor.name === inventory[i].constructor.name &&
				   object.getProperty(PPlayerUnit) && inventory[i].getProperty(PPlayerUnit) &&
				   object.getProperty(PPlayerUnit).team === inventory[i].getProperty(PPlayerUnit).team) {
					if(!level.isGameObjectPlaced(inventory[i])) {
						GameUtil.swapClass("btn-col-", "btn-col-selected", arrInventory[i]);
						level.togglePlaceObject(inventory[i]);
						break;
					}
				}
			}
		}
	}
	
	UI.prototype.onInventoryChanged = function() {
		var inventory = player.getInventory();
		var i, j;
		
		arrInventory.splice(0, arrInventory.length);

		for(i = containerInventory.children.length - 1; i >= 0; i--) {
			containerInventory.children[i].onmousedown = null;
			containerInventory.removeChild(containerInventory.children[i]);
		}
		
		for(i = 0; i < inventory.length; i++) {
			var object = inventory[i];
			var elem = document.createElement("div");
			elem.className = "btn btn-inventory btn-col-default btn-border-default";
			arrInventory[i] = elem;
			
			if(object.image) {
				var img = document.createElement("img");
				img.src = object.image.src;
				elem.appendChild(img);
			}
			elem.onmousedown = (function(o){
				var that = this;
				return function setObject() {
					if(!level.setSelectedObject(o)) {
						that.resetInventoryButtonColors();
						
						if(level.togglePlaceObject(o)) {
							GameUtil.swapClass("btn-col-", "btn-col-selected", this);
						}
						else {
							GameUtil.swapClass("btn-col-", "btn-col-default", this);
						}
					}
				};
			}).bind(this)(object);
			containerInventory.appendChild(elem);
		}
	}
	
	UI.prototype.onSelectedGameObjectChanged = function() {
		var i, l;
		var inventory = player.getInventory();
		for(i = containerSelectionUpgrades.children.length - 1; i >= 0; i--) {
			containerSelectionUpgrades.children[i].onmousedown = null;
			containerSelectionUpgrades.removeChild(containerSelectionUpgrades.children[i]);
		}
		
		l = arrInventory.length;
		for(i = 0; i < l; i++) {
			GameUtil.swapClass("btn-border-", "btn-border-default", arrInventory[i]);
		}
		
		var obj = level.getSelectedObject();
		if(obj === null)
			return;
		
		if(inventory.indexOf(obj) > -1)
			GameUtil.swapClass("btn-border-", "btn-border-selected", arrInventory[inventory.indexOf(obj)]);
		
		var p = obj.getProperty(PUpgradesProxy);
		var upgrade;
		if(p) {
			for(upgrade in p.upgradesInfo) {
				if(typeof p.upgradesPurchased[upgrade] !== "undefined" && typeof obj[upgrade] !== "undefined") {
					var node = document.createElement("div");
					node.className = "btn btn-col-default";
					node.innerHTML = "Upgrade " + p.upgradesInfo[upgrade].name;
					node.onmousedown = (function(upgrade){
						return function(){
							p.upgrade(upgrade);
						}
					})(upgrade);
					containerSelectionUpgrades.appendChild(node);
					containerSelectionUpgrades.appendChild(document.createElement("br"));
				}
			}
		}
		
		//////
		var node = document.createElement("div"); //TEMPORARY DELETE UNIT
		node.className = "btn btn-col-default";
		node.innerHTML = "Delete (press X)";
		node.onmousedown = (function(obj){
			return function(){
				obj.destroy();
			}
		})(obj);
		containerSelectionUpgrades.appendChild(node);
		containerSelectionUpgrades.appendChild(document.createElement("br"));
		//////
	}
	
	buttonNewLevel16.addEventListener("click", function(){
		level.generateNew(16, 16, !settings.isUseFog);
		onResize();
	});
	buttonNewLevel32.addEventListener("click", function(){
		level.generateNew(32, 32, !settings.isUseFog);
		onResize();
	});
	buttonNewLevel64.addEventListener("click", function(){
		level.generateNew(64, 64, !settings.isUseFog);
		onResize();
	});
	buttonNewLevel128.addEventListener("click", function(){
		level.generateNew(128, 128, !settings.isUseFog);
		onResize();
	});
	buttonNewLevel256.addEventListener("click", function(){
		level.generateNew(256, 256, !settings.isUseFog);
		onResize();
	});
	buttonNewLevel512.addEventListener("click", function(){
		level.generateNew(512, 512, !settings.isUseFog);
		onResize();
	});
	buttonNewLevel1024.addEventListener("click", function(){
		level.generateNew(1024, 1024, !settings.isUseFog);
		onResize();
	});
	buttonUseFog.addEventListener("click", function() {
		settings.isUseFog = !settings.isUseFog;
		
		if(settings.isUseFog)
			GameUtil.swapClass("btn-col-", "btn-col-selected", this);
		else
			GameUtil.swapClass("btn-col-", "btn-col-default", this);
	});
	buttonToggleCamera.addEventListener("click", function() {
		settings.isUseCamera = !settings.isUseCamera;
		if(settings.isUseCamera)
			GameUtil.swapClass("btn-col-", "btn-col-selected", this);
		else
			GameUtil.swapClass("btn-col-", "btn-col-default", this);
	});
	buttonDrawDebug.addEventListener("click", function() {
		settings.isDrawDebug = !settings.isDrawDebug;
		if(settings.isDrawDebug)
			GameUtil.swapClass("btn-col-", "btn-col-selected", this);
		else
			GameUtil.swapClass("btn-col-", "btn-col-default", this);
	});
	
	Game.UI = UI;
})();

(function() {
	var isLoaded = false;
	
	function Assets() {
		
	}
	
	Assets.load = function(callback) {
		if(isLoaded)
			return false;
		
		isLoaded = true;
		
		var loader = new PxLoader();
		
		Assets.imgOre_stone_large = loader.addImage("images/ore-stone-large.png");
		Assets.imgOre_stone_medium = loader.addImage("images/ore-stone-medium.png");
		Assets.imgOre_stone_small = loader.addImage("images/ore-stone-small.png");
		Assets.imgOre_stone_tiny = loader.addImage("images/ore-stone-tiny.png");
		
		Assets.imgOre_copper_large = loader.addImage("images/ore-copper-large.png");
		Assets.imgOre_copper_medium = loader.addImage("images/ore-copper-medium.png");
		Assets.imgOre_copper_small = loader.addImage("images/ore-copper-small.png");
		Assets.imgOre_copper_tiny = loader.addImage("images/ore-copper-tiny.png");
		
		Assets.imgOre_tin_large = loader.addImage("images/ore-tin-large.png");
		Assets.imgOre_tin_medium = loader.addImage("images/ore-tin-medium.png");
		Assets.imgOre_tin_small = loader.addImage("images/ore-tin-small.png");
		Assets.imgOre_tin_tiny = loader.addImage("images/ore-tin-tiny.png");
		
		Assets.imgOre_copper = loader.addImage("images/ore-copper.png");
		Assets.imgOre_tin = loader.addImage("images/ore-tin.png");
		
		Assets.imgParticle_stone = loader.addImage("images/particle-stone.png");
		Assets.imgParticle_copper = loader.addImage("images/particle-copper.png");
		Assets.imgParticle_tin = loader.addImage("images/particle-tin.png");
		
		Assets.imgProxy = loader.addImage("images/proxy-top.png");
		Assets.imgProxyEnemy = loader.addImage("images/proxy-enemy-top.png");
		Assets.imgProxyEnemy2 = loader.addImage("images/proxy-enemy2-top.png");
		Assets.imgParticleCopper = loader.addImage("images/particle-copper.png");
		Assets.imgStash = loader.addImage("images/stash.png");
		Assets.imgStashEnemy = loader.addImage("images/stash-enemy.png");
		Assets.imgStashEnemy2 = loader.addImage("images/stash-enemy2.png");
		Assets.imgWall = loader.addImage("images/wall.png");
		Assets.imgRelay = loader.addImage("images/relay.png");
		Assets.imgRelayEnemy = loader.addImage("images/relay-enemy.png");
		Assets.imgRelayEnemy2 = loader.addImage("images/relay-enemy2.png");
		
		Assets.imgHQ = loader.addImage("images/hq.png");
		Assets.imgHQEnemy = loader.addImage("images/hq-enemy.png");
		Assets.imgHQEnemy2 = loader.addImage("images/hq-enemy2.png");
		
		loader.addProgressListener(function(e) {
			//console.log(e.completedCount + ' / ' + e.totalCount);
		});
		loader.addCompletionListener(function() {
			callback();
		});
		
		loader.start();
	}
	
	Game.Assets = Assets;
})();

(function() {
	var width = 20;
	var height = 20;
	var i;
	
	var startTime = null;
	var sessionClock = 0;
	
	var fixedUpdateClock = 0;
	var fixedUpdateInterval = 1000 / 60;
	
	var fps = 0;
	
	var isPaused = false;
	
	Game.KeyInputManager.instance.changeKeybind("placeMultiple", 	Game.KeyInputManager.instance.Key.Shift, 	false);
	Game.KeyInputManager.instance.changeKeybind("delete", 			Game.KeyInputManager.instance.Key.X, 		false);
	
	Game.KeyInputManager.instance.changeKeybind("left", 			Game.KeyInputManager.instance.Key.A, 		false);
	Game.KeyInputManager.instance.changeKeybind("right", 			Game.KeyInputManager.instance.Key.D, 		false);
	Game.KeyInputManager.instance.changeKeybind("up", 				Game.KeyInputManager.instance.Key.W, 		false);
	Game.KeyInputManager.instance.changeKeybind("down", 			Game.KeyInputManager.instance.Key.S, 		false);
	
	var cosp = new Game.CanvasObjectSharedProperties();
	var canvasObjectManager = new Game.CanvasObjectManager(cosp, settings);
	
	var player = new Game.Player();
	var enemy = new Game.Player();
	
	var particles = new Game.Particles(cosp);
	var highlight = new Game.Highlight(cosp);
	var level = new Game.Level(particles, player, cosp);
	
	canvasObjectManager.addCanvasObject(level);
	canvasObjectManager.addCanvasObject(particles);
	canvasObjectManager.addCanvasObject(highlight);
	
	var settings = {
		isDrawDebug : false,
		isUseFog : true,
		get isUseCamera() {
			return canvasObjectManager.getCameraToggled();
		},
		set isUseCamera(bool) {
			return canvasObjectManager.toggleCamera(bool);
		}
	}
	
	var ui = new Game.UI(settings, level, player);
	
	Game.actions = {};
	
	Game.actions.onInventoryObjectPlaced = function(object) {
		ui.onInventoryObjectPlaced(object);
	}
	
	Game.actions.onInventoryChanged = function() {
		ui.onInventoryChanged();
	}
	
	Game.actions.onSelectedGameObjectChanged = function() {
		ui.onSelectedGameObjectChanged();
	}
	
	Game.actions.onNoLongerPlacingObject = function() {
		ui.resetInventoryButtonColors();
	}
	
	Game.actions.onInventoryObjectRemoved = function() {
		ui.resetInventoryButtonColors();
		ui.onSelectedGameObjectChanged();
	}
	
	Game.actions.onResize = function() {
		canvasObjectManager.onResize();
	}
	
	Game.actions.pause = function() {
		isPaused = !isPaused;
	}
	
	Game.debug = {};
	Game.debug.settings = settings;
	Game.debug.level = level;
	Game.debug.particles = particles;
	Game.debug.cosp = cosp;
	Game.debug.player = player;
	
	//////////////////////////////////////////
	
	var fpsElem = document.getElementById("debug_frametime");
	var clockElem = document.getElementById("debug_clock");
	
	console.log("Loading assets");
	Game.Assets.load(onLoaded);
	
	function onLoaded() {
		console.log("Assets loaded");
		
		level.generateNew(16, 16, false);
		onResize();
		
		player.addGameObjectToInventory(GameObject.instantiate(new Headquarters(Game.Assets.imgHQ, "Main Headquarters", 0, 0, 5, 5, 0, 8, 8, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxy, "Proxy", 0, 0, 1, 1, 0, level, particles, player)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxy, "Proxy", 0, 0, 1, 1, 0, level, particles, player)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxy, "Proxy", 0, 0, 1, 1, 0, level, particles, player)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxy, "Proxy", 0, 0, 1, 1, 0, level, particles, player)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxy, "Proxy", 0, 0, 1, 1, 0, level, particles, player)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxy, "Proxy", 0, 0, 1, 1, 0, level, particles, player)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelay, "Relay", 0, 0, 1, 1, 0, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelay, "Relay", 0, 0, 1, 1, 0, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelay, "Relay", 0, 0, 1, 1, 0, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelay, "Relay", 0, 0, 1, 1, 0, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelay, "Relay", 0, 0, 1, 1, 0, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelay, "Relay", 0, 0, 1, 1, 0, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Stash(Game.Assets.imgStash, "Stash", 0, 0, 1, 1, 0)));
		player.addGameObjectToInventory(GameObject.instantiate(new Stash(Game.Assets.imgStash, "Stash", 0, 0, 1, 1, 0)));
		
		player.addGameObjectToInventory(GameObject.instantiate(new Headquarters(Game.Assets.imgHQEnemy, "Main Headquarters", 0, 0, 3, 3, 1, 8, 8, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxyEnemy, "Proxy", 0, 0, 1, 1, 1, level, particles, enemy)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxyEnemy, "Proxy", 0, 0, 1, 1, 1, level, particles, enemy)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxyEnemy, "Proxy", 0, 0, 1, 1, 1, level, particles, enemy)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxyEnemy, "Proxy", 0, 0, 1, 1, 1, level, particles, enemy)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxyEnemy, "Proxy", 0, 0, 1, 1, 1, level, particles, enemy)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxyEnemy, "Proxy", 0, 0, 1, 1, 1, level, particles, enemy)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelayEnemy, "Relay", 0, 0, 1, 1, 1, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelayEnemy, "Relay", 0, 0, 1, 1, 1, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelayEnemy, "Relay", 0, 0, 1, 1, 1, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelayEnemy, "Relay", 0, 0, 1, 1, 1, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelayEnemy, "Relay", 0, 0, 1, 1, 1, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelayEnemy, "Relay", 0, 0, 1, 1, 1, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Stash(Game.Assets.imgStashEnemy, "Stash", 0, 0, 1, 1, 1)));
		player.addGameObjectToInventory(GameObject.instantiate(new Stash(Game.Assets.imgStashEnemy, "Stash", 0, 0, 1, 1, 1)));
		
		player.addGameObjectToInventory(GameObject.instantiate(new Headquarters(Game.Assets.imgHQEnemy2, "Main Headquarters", 0, 0, 2, 2, 2, 8, 8, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxyEnemy2, "Proxy", 0, 0, 1, 1, 2, level, particles, enemy)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxyEnemy2, "Proxy", 0, 0, 1, 1, 2, level, particles, enemy)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxyEnemy2, "Proxy", 0, 0, 1, 1, 2, level, particles, enemy)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxyEnemy2, "Proxy", 0, 0, 1, 1, 2, level, particles, enemy)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxyEnemy2, "Proxy", 0, 0, 1, 1, 2, level, particles, enemy)));
		player.addGameObjectToInventory(GameObject.instantiate(new Proxy(Game.Assets.imgProxyEnemy2, "Proxy", 0, 0, 1, 1, 2, level, particles, enemy)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelayEnemy2, "Relay", 0, 0, 1, 1, 2, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelayEnemy2, "Relay", 0, 0, 1, 1, 2, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelayEnemy2, "Relay", 0, 0, 1, 1, 2, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelayEnemy2, "Relay", 0, 0, 1, 1, 2, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelayEnemy2, "Relay", 0, 0, 1, 1, 2, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Relay(Game.Assets.imgRelayEnemy2, "Relay", 0, 0, 1, 1, 2, 5, 5, level)));
		player.addGameObjectToInventory(GameObject.instantiate(new Stash(Game.Assets.imgStashEnemy2, "Stash", 0, 0, 1, 1, 2)));
		player.addGameObjectToInventory(GameObject.instantiate(new Stash(Game.Assets.imgStashEnemy2, "Stash", 0, 0, 1, 1, 2)));
		
		setTimeout(begin, 0);
	}
	
	function begin() {
		window.requestAnimationFrame(gameLoop);
	}
	
	function gameLoop(timestamp) {
		window.requestAnimationFrame(gameLoop);
		
		if(!startTime) startTime = timestamp - (1000 / 60);
		var dif = (timestamp - startTime) - sessionClock;
		fixedUpdateClock += dif;
		
		/*while(fixedUpdateClock >= fixedUpdateInterval) {
			act(fixedUpdateInterval);
			fixedUpdateClock -= fixedUpdateInterval;
		}*/
		act(dif > 1000 ? 1000 : dif);
		
		draw();
		
		sessionClock += dif;
		fps = (fps * 0.9) + ((1000 / dif) * (1.0 - 0.9));

		fpsElem.innerHTML = Math.round(fps);
		clockElem.innerHTML = GameUtil.getMsAsFormattedString(sessionClock);
		
		ui.update();
	}
	
	function act(frameTime) {
		canvasObjectManager.act(frameTime);
	}
	
	function draw() {
		canvasObjectManager.draw();
		
		if(settings.isDrawDebug) {
			var objects = level.getGameObjectsOfClass(Proxy);
			for(i = 0; i < objects.length; i++) {
				var mov = objects[i].properties.pGridMovement;
				var cellSize = cosp.cellSize;
				if(objects[i].properties.pOreMiner.isMining) {
					level.ctx.fillStyle = "rgba(40, 40, 200, 0.5)";
					level.ctx.fillRect(mov.calculatedX * cellSize, mov.calculatedY * cellSize, objects[i].width * cellSize, objects[i].height * cellSize);
				}
				else if(objects[i].properties.pOreBufferUnloader.isUnloading) {
					level.ctx.fillStyle = "rgba(40, 200, 40, 0.5)";
					level.ctx.fillRect(mov.calculatedX * cellSize, mov.calculatedY * cellSize, objects[i].width * cellSize, objects[i].height * cellSize);
				}
				else if(objects[i].properties.pOreBuffer.isFull) {
					level.ctx.fillStyle = "rgba(200, 40, 40, 0.5)";
					level.ctx.fillRect(mov.calculatedX * cellSize, mov.calculatedY * cellSize, objects[i].width * cellSize, objects[i].height * cellSize);
				}
			}
		}
	}
})();


function onResize() {
	if(Game !== undefined && Game !== null) {
		Game.actions.onResize();
	}
}
