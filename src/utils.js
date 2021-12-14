"use strict";

function GameUtil() {
	if (this.constructor === GameUtil) {
		throw new Error("GameUtil: Can't instantiate abstract class");
    }
}
GameUtil.hasMethods = function(obj /*, method list as strings */){
    var i = 1, methodName;
    while((methodName = arguments[i++])){
        if(typeof obj[methodName] != 'function') {
            return false;
        }
    }
    return true;
}
GameUtil.getMsAsFormattedString = function(time) {
	var x = time / 1000;
	
	var seconds = Math.floor(x % 60);
	var seconds = (seconds < 10 ? "0"+seconds : seconds);
	x /= 60;
	var minutes = Math.floor(x % 60);
	var minutes = (minutes < 10 ? "0"+minutes : minutes);
	x /= 60;
	var hours = Math.floor(x % 24);
	var hours = (hours < 10 ? "0"+hours : hours);
	x /= 24;
	var days = Math.floor(x);

	return days + ":" + hours + ":" + minutes + ":" + seconds;
}
//thanks Trimps
GameUtil.swapClass = function(prefix, newClass, elem) {
	if (elem === null) {
		console.log("swapClass, No element found");
		return;
	}
	var className = elem.className;
	if(typeof className.split('newClass')[1] !== 'undefined') return;
	className = className.split(prefix);
	if(typeof className[1] === 'undefined') {
		console.log("swapClass function error: Tried to replace a class that doesn't exist at [" + elem.className + "] using " + prefix + " as prefix and " + newClass + " as target class.");
		elem.className += " " + newClass;
		return;
	} 
	var classEnd = className[1].indexOf(' ');
	if (classEnd >= 0)
		className = className[0] + newClass + className[1].slice(classEnd, className[1].length);
	else
		className = className[0] + newClass;
	elem.className = className;
}

GameUtil.isColliding = function(x1, y1, width1, height1, x2, y2, width2, height2) {
	return (x1 < x2 + width2 &&
			x1 + width1 > x2 &&
			y1 < y2 + height2 &&
			height1 + y1 > y2);
}

GameUtil.convertMouseToCoordinates = function(mouseX, mouseY, cellSize) {
	return new Vector2(Math.floor(mouseX / cellSize), Math.floor(mouseY / cellSize));
}

GameUtil.getPositionOfGameObjectToPlace = function(obj, cellX, cellY) {
	cellX = cellX - Math.floor((obj.width - 1) / 2);
	cellY = cellY - Math.floor((obj.height - 1) / 2);
	
	return new Vector2(cellX, cellY);
}

GameUtil.convertArrayCoordinatesToSmallerArray = function(coordinate, originalSize, targetSize) {
	var newC = 0;
	var offset = 0;
	
	if(coordinate + 32 < 64 - 1) { //0-63=64
		newC = coordinate;
	}
	else if(coordinate > originalSize - 64 - 1) {//256-64-1  +64=255
		newC = coordinate - originalSize + 64;
		offset = originalSize - 64 - 1;
	}
	else {
		newC = 32;
		offset = coordinate - 32;
	}
	
	return {
		coordinate: newC,
		startAt : offset
	};
}

GameUtil.getRandomInt = function(minIncl, maxExcl) {
	return Math.floor(Math.random() * (maxExcl - minIncl + 1)) + minIncl;
}
GameUtil.getWindowWidth = function() {
	return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
}

GameUtil.getWindowHeight = function() {
	return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
}

GameUtil.iterateOverCircle = function(originX, originY, radius, callback) { //callback(x, y)
	var i, j;
	for(i = -radius; i <= radius; i++) {
		for(j = -radius; j <= radius; j++) {
			if(j*j+i*i <= radius*radius) {
				callback(j + originX, i + originY);
			}
		}
	}
}

GameUtil.clamp = function(value, min, max){
	if(value < min) return min;
	else if(value > max) return max;
	return value;
}

GameUtil.WallGenerator = function() {
	this.getLevel = function(width, height, seed) {
		var arr = [];
		var arr2 = [];
		
		noise.seed(seed);
		
		var weight;
		for(var y = 0; y < height; y++) {
			arr[y] = [];
			for(var x = 0; x < width; x++) {
				weight = 10 + Math.floor(noise.simplex2(x / 26, y / 26) * 10); //0-19
				arr[y][x] = weight > 9 ? 1 : 0;
			}
		}
		
		var adjacent;
		for(var y = 0; y < height; y++) {
			arr2[y] = [];
			for(var x = 0; x < width; x++) {
				if(arr[y][x] === 1) {
					adjacent = 0;
					if(arr[y - 1] === undefined) adjacent++;
					else if(arr[y - 1] !== undefined && arr[y - 1][x] === 1) adjacent++;
					if(arr[y + 1] === undefined) adjacent++;
					else if(arr[y + 1] !== undefined && arr[y + 1][x] === 1) adjacent++;
					if(arr[x - 1] === undefined) adjacent++;
					else if(arr[x - 1] !== undefined && arr[y][x - 1] === 1) adjacent++;
					if(arr[x + 1] === undefined) adjacent++;
					else if(arr[x + 1] !== undefined && arr[y][x + 1] === 1) adjacent++;
					
					arr2[y][x] = adjacent === 4 ? 0 : 1;
				}
			}
		}
		
		var xx, yy;
		for(var y = 0; y < height; y++) {
			for(var x = 0; x < width; x++) {
				if(arr2[y][x] === 1 && Math.random() > 0.8) { //TODO random
					for(yy = y - 1; yy < y + 2; yy++) {
						for(xx = x - 1; xx < x + 2; xx++) {
							if(arr2[yy] !== undefined && arr2[yy][xx] !== undefined) {
								arr2[yy][xx] = 0;
							}
						}
					}
				}
			}
		}
		
		return arr2;
	}
}


function Vector2(x, y) {
	this.x = x || 0;
	this.y = y || 0;
}

Vector2.distance = function(v1, v2) {
	return Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));
}

Vector2.normalize = function(x, y) {
	var distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
	
	return new Vector2(x/distance, y/distance);
}

function OreResource(resourceName, labelName, amtCur, amtMax) {
	this.resourceName = resourceName;
	this.labelName = labelName;
	this.amtCur = amtCur;
	this.amtMax = amtMax;
}