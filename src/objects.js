"use strict";

function GameObject(image, name, x, y, width, height) {
	this.properties = {};
	this.tag = "";
	this.image = image;
	
	this.name = name;
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	
	this.isMarkedForDelete = false;
	this.isCollider = true;
}

GameObject.instantiate = function(gameObject) {
	var property;
	for(property in gameObject.properties) {
		GameObjectProperty.instantiate(gameObject.properties[property]);
	}
	return gameObject;
}
GameObject.prototype.onPlay = function() {
	var property;
	for(property in this.properties) {
		this.properties[property].onPlay();
	}
}
GameObject.prototype.destroy = function() {
	this.isMarkedForDelete = true;
	
	var property;
	for(property in this.properties) {
		this.properties[property].onReset();
	}
}

GameObject.prototype.act = function(frameTime) {

}

GameObject.prototype.draw = function(ctx, cellSize) {
	
}

GameObject.prototype.getProperty = function(functionName) {
	var property = this.properties[functionName];
	
	return property === undefined ? null : property;
}

GameObject.prototype.getProperties = function() {
	return this.properties;
}

function Stash(image, name, x, y, width, height, team) {
	GameObject.call(this, image, name, x, y, width, height);
	
	this.properties[PPlayerUnit] = new PPlayerUnit(this, team, 4);
	this.properties[PStash] = new PStash(this);
}
Stash.prototype = Object.create(GameObject.prototype);
Stash.prototype.constructor = Stash;
Stash.prototype.act = function(frameTime) {
	
}
Stash.prototype.draw = function(ctx, cellSize) {
	ctx.drawImage(this.image, this.x * cellSize, this.y * cellSize, this.width * cellSize, this.height * cellSize);
}

function Wall(image, name, x, y, width, height) {
	GameObject.call(this, image, name, x, y, width, height);
}
Wall.prototype = Object.create(GameObject.prototype);
Wall.prototype.constructor = Wall;
Wall.prototype.act = function(frameTime) {
	
}
Wall.prototype.draw = function(ctx, cellSize) {
	ctx.drawImage(this.image, this.x * cellSize, this.y * cellSize, this.width * cellSize, this.height * cellSize);
}

function Ore(image, name, x, y, width, height, cosp) {
	GameObject.call(this, image, name, x, y, width, height);
	
	this.properties[POreResources] = new POreResources(this);
	
	this.cosp = cosp;
}
Ore.prototype = Object.create(GameObject.prototype);
Ore.prototype.constructor = Ore;
Ore.prototype.act = function(frameTime) {
	
}
Ore.prototype.draw = function(ctx, cellSize) {
	var prop = this.getProperty(POreResources);
	var res = prop.oreResources[0];
	var res2 = prop.oreResources[1];
	
	if(res) { //TODO i'm almost positive there is a more efficient way to do this
		if(res.amtCur >= 64) {
			ctx.drawImage(Game.Assets["imgOre_" + res.resourceName + "_large"], this.x * cellSize, this.y * cellSize, this.width * cellSize, this.height * cellSize);
		}
		else if(res.amtCur >= 32) {
			if(res2)
				if(res2.amtCur >= 64)
					ctx.drawImage(Game.Assets["imgOre_" + res2.resourceName + "_large"], this.x * cellSize, this.y * cellSize, this.width * cellSize, this.height * cellSize);
			ctx.drawImage(Game.Assets["imgOre_" + res.resourceName + "_medium"], this.x * cellSize, this.y * cellSize, this.width * cellSize, this.height * cellSize);
		}
		else if(res.amtCur >= 12) {
			if(res2)
				if(res2.amtCur >= 64)
					ctx.drawImage(Game.Assets["imgOre_" + res2.resourceName + "_large"], this.x * cellSize, this.y * cellSize, this.width * cellSize, this.height * cellSize);
				else if(res2.amtCur >= 32)
					ctx.drawImage(Game.Assets["imgOre_" + res2.resourceName + "_medium"], this.x * cellSize, this.y * cellSize, this.width * cellSize, this.height * cellSize);
			ctx.drawImage(Game.Assets["imgOre_" + res.resourceName + "_small"], this.x * cellSize, this.y * cellSize, this.width * cellSize, this.height * cellSize);
		}
		else {
			if(res2)
				if(res2.amtCur >= 64)
					ctx.drawImage(Game.Assets["imgOre_" + res2.resourceName + "_large"], this.x * cellSize, this.y * cellSize, this.width * cellSize, this.height * cellSize);
				else if(res2.amtCur >= 32)
					ctx.drawImage(Game.Assets["imgOre_" + res2.resourceName + "_medium"], this.x * cellSize, this.y * cellSize, this.width * cellSize, this.height * cellSize);
				else if(res2.amtCur >= 12)
					ctx.drawImage(Game.Assets["imgOre_" + res2.resourceName + "_small"], this.x * cellSize, this.y * cellSize, this.width * cellSize, this.height * cellSize);
			ctx.drawImage(Game.Assets["imgOre_" + res.resourceName + "_tiny"], this.x * cellSize, this.y * cellSize, this.width * cellSize, this.height * cellSize);
		}
	}
}

function Proxy(image, name, x, y, width, height, team, level, particles, player) {
	GameObject.call(this, image, name, x, y, width, height);

	this.speed = 0;
	this.miningSpeed = 0;
	
	this.level = level;
	this.particles = particles;
	this.player = player;
	
	this.properties[PPlayerUnit] = new PPlayerUnit(this, team, 3);
	this.properties[POreMiner] = new POreMiner(this, level, particles, player);
	this.properties[POreBuffer] = new POreBuffer(this);
	this.properties[POreBufferUnloader] = new POreBufferUnloader(this, particles, player);
	this.properties[PGridMovement] = new PGridMovement(this, level);
	this.properties[PUpgradesProxy] = new PUpgradesProxy(this);
	this.properties[PProxyAI] = new PProxyAI(this, level);
}
Proxy.prototype = Object.create(GameObject.prototype);
Proxy.prototype.constructor = Proxy;

Proxy.prototype.act = function(frameTime) {
	this.getProperty(PProxyAI).act(frameTime);
}

Proxy.prototype.draw = function(ctx, cellSize) {
	var mov = this.getProperty(PGridMovement);
	if(this.rotation !== 0) {
		ctx.save();
		ctx.translate(mov.calculatedX * cellSize + cellSize / 2, mov.calculatedY * cellSize + cellSize / 2);
		ctx.rotate(mov.rotation * Math.PI / 180);
		ctx.drawImage(this.image, -(this.width * cellSize / 2), -(this.height * cellSize / 2), this.width * cellSize, this.height * cellSize);
		ctx.restore();
	}
	else {
		ctx.drawImage(this.image, mov.calculatedX * cellSize, mov.calculatedY * cellSize, this.width * cellSize, this.height * cellSize);
	}
}

function Relay(image, name, x, y, width, height, team, range, connectRange, level) {
	GameObject.call(this, image, name, x, y, width, height);
	
	this.properties[PPlayerUnit] = new PPlayerUnit(this, team, 3);
	this.properties[PRelay] = new PRelay(this, range, connectRange, level);
}
Relay.prototype = Object.create(GameObject.prototype);
Relay.prototype.constructor = Relay;
Relay.prototype.act = function(frameTime) {
	this.getProperty(PRelay).act(frameTime);
}

Relay.prototype.draw = function(ctx, cellSize) {
	ctx.drawImage(this.image, this.x * cellSize, this.y * cellSize, this.width * cellSize, this.height * cellSize);
}

function Headquarters(image, name, x, y, width, height, team, range, connectRange, level) {
	GameObject.call(this, image, name, x, y, width, height);
	
	this.level = level;
	
	//this.carriedStash = GameObject.instantiate(new Stash(Game.Assets.imgStash, "Headquarters Stash", 0, 0, 1, 1, team)); //TODO move to property
	
	this.properties[PPlayerUnit] = new PPlayerUnit(this, team, 6);
	this.properties[PRelay] = new PRelay(this, range, connectRange, level);
	this.properties[PHeadquarters] = new PHeadquarters(this);
	this.properties[PStash] = new PStash(this);
}
Headquarters.prototype = Object.create(GameObject.prototype);
Headquarters.prototype.constructor = Headquarters;
Headquarters.prototype.destroy = function() {
	GameObject.prototype.destroy.apply(this);
	//this.carriedStash.destroy();
}
Headquarters.prototype.onPlay = function() {
	GameObject.prototype.onPlay.apply(this);
	//this.carriedStash.x = this.x + 1; //TODO ^^^^
	//this.carriedStash.y = this.y + 1;
	
	//this.level.addGameObject(this.carriedStash);
}
Headquarters.prototype.act = function(frameTime) {
	this.getProperty(PRelay).act(frameTime);
}

Headquarters.prototype.draw = function(ctx, cellSize) {
	ctx.drawImage(this.image, this.x * cellSize, this.y * cellSize, this.width * cellSize, this.height * cellSize);
}



