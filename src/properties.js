"use strict";

function GameObjectProperty(gameObject) {
	this.gameObject = gameObject;
}
GameObjectProperty.prototype.act = function(frameTime) {
	
}

GameObjectProperty.prototype.initialize = function() {
	this.onReset();
}

GameObjectProperty.prototype.onPlay = function() {
	
}
GameObjectProperty.prototype.onReset = function() {
	
}

GameObjectProperty.instantiate = function(gameObjectProperty) {
	gameObjectProperty.initialize();
	return gameObjectProperty;
}

function POreResources(gameObject) {
	GameObjectProperty.call(this, gameObject);
}
POreResources.prototype = Object.create(GameObjectProperty.prototype);
POreResources.prototype.constructor = POreResources;
POreResources.prototype.initialize = function() { 
	GameObjectProperty.prototype.initialize.apply(this);
}
POreResources.prototype.onReset = function() { 
	this.oreResources = [];
}
POreResources.prototype.addOreResource = function(oreResource) {
	if(oreResource instanceof OreResource) {
		this.oreResources.push(oreResource);
	}
}

function POreMiner(gameObject, level, particles, player) {
	GameObjectProperty.call(this, gameObject);
	this.level = level;
	this.particles = particles;
	this.player = player;
	
	this.pOreBuffer = null;
}
POreMiner.prototype = Object.create(GameObjectProperty.prototype);
POreMiner.prototype.constructor = POreMiner;
POreMiner.prototype.initialize = function() { 
	GameObjectProperty.prototype.initialize.apply(this);
	this.pOreBuffer = this.gameObject.getProperty(POreBuffer);
}
POreMiner.prototype.onReset = function() {
	this.x = -1;
	this.y = -1;
	this.clock = 0;
	this.isMining = false;
}
POreMiner.prototype.act = function(frameTime) {
	this.isMining = true;
	
	this.clock += frameTime;
	if(this.clock < 1000 / this.gameObject.miningSpeed)
		return;
	this.clock -= 1000 / this.gameObject.miningSpeed;
	
	this.isMining = false;
	
	var i, l;
	var ore = this.level.getGameObjectsAt(this.x, this.y);
	
	if(ore === null)
		return;
	
	var oreResources;
	
	for(i = 0; i < ore.length; i++) {
		oreResources = ore[i].getProperty(POreResources);
		if(oreResources) {
			oreResources = oreResources.oreResources;
			ore = ore[i];
			break;
		}
		
		if(i + 1 == ore.length)
			return;
	}
	
	if(typeof oreResources === "undefined") //this can occur if something deleted the ore in the same frame, as its still registered until frame ends
		return;
	
	if(oreResources.length == 0) {
		ore.destroy();
		this.x = -1;
		this.y = -1;
		return;
	}
	
	this.isMining = true;
	
	l = oreResources.length;
	i = 0;
	//for(i = 0; i < l; i++) {
		if(this.pOreBuffer !== null && this.pOreBuffer.isFull) {
			this.isMining = false;
			return;
		}
		
		if(oreResources[i].amtCur.gt(0)) {
			if(this.pOreBuffer !== null) {
				if(typeof this.pOreBuffer.buffer[oreResources[i].resourceName] === "undefined")
					this.pOreBuffer.buffer[oreResources[i].resourceName] = new Decimal(0);
				this.pOreBuffer.buffer[oreResources[i].resourceName] = this.pOreBuffer.buffer[oreResources[i].resourceName].plus(1);
				this.pOreBuffer.bufferCount = this.pOreBuffer.bufferCount.plus(1);
				if(this.pOreBuffer.bufferCount.gte(this.pOreBuffer.bufferMax)) {
					this.pOreBuffer.isFull = true;
				}
			}
			else {
				this.player.addResource(oreResources[i].resourceName, new Decimal(1));
			}
			
			oreResources[i].amtCur = oreResources[i].amtCur.minus(1);
			
			this.particles.createParticle(((function(x, y){
				return function(){
					this.particles.createFloatingResourceParticle(new Decimal(1), null, x, y, null);
				}
			})(this.gameObject.x, this.gameObject.y)).bind(this), 
			Game.Assets["imgParticle_" + oreResources[i].resourceName], 0.5, 0.5, this.x, this.y, this.gameObject.x, this.gameObject.y, 2, 10);
			
			if(Math.random() > 0.8) {
				this.player.addResource("science", new Decimal(1));
				this.particles.createFloatingResourceParticle(new Decimal(1), null, this.gameObject.x, this.gameObject.y, "#1aa5ff");
			}
			
			if(this.pOreBuffer.isFull) {
				this.x = -1;
				this.y = -1;
			}
			
			//break;
		}
	//}
	
	//for(i = 0; i < l; i++) {
		//if(oreResources[i].amtCur > 0)
		//	continue;
		
	if(oreResources[i].amtCur <= 0) {
		oreResources.splice(0, 1);
		//i--;
	}
		
		//if(i + 1 == l) {
		//	ore.destroy();
		//	this.x = -1;
		//	this.y = -1;
		//	this.isMining = false;
		//}
	//}
}

function POreBuffer(gameObject) {
	GameObjectProperty.call(this, gameObject);
}
POreBuffer.prototype = Object.create(GameObjectProperty.prototype);
POreBuffer.prototype.constructor = POreBuffer;
POreBuffer.prototype.initialize = function() { 
	GameObjectProperty.prototype.initialize.apply(this);
}
POreBuffer.prototype.onReset = function() { 
	this.isFull = false;
	
	this.buffer = {};
	this.bufferCount = new Decimal(0);
	this.bufferMax = new Decimal(15);
}

function POreBufferUnloader(gameObject, particles, player) {
	GameObjectProperty.call(this, gameObject);
	this.particles = particles;
	this.player = player;
	
	this.pOreBuffer = null;
	
	this.clock = 0;
	this.interval = 40;
	
	this.isUnloading = false;
	this.x = -1;
	this.y = -1;
}
POreBufferUnloader.prototype = Object.create(GameObjectProperty.prototype);
POreBufferUnloader.prototype.constructor = POreBufferUnloader;
POreBufferUnloader.prototype.initialize = function() {
	GameObjectProperty.prototype.initialize.apply(this);
	this.pOreBuffer = this.gameObject.getProperty(POreBuffer);
}
POreBufferUnloader.prototype.onReset = function() { 
	this.clock = 0;
	this.interval = 40;
	
	this.isUnloading = false;
	this.x = -1;
	this.y = -1;
}
POreBufferUnloader.prototype.act = function(frameTime) {
	this.isUnloading = false;
	if(this.pOreBuffer === null)
		return;
	
	this.isUnloading = true;
	
	this.clock += frameTime;
	if(this.clock < this.interval)
		return;
	this.clock -= this.interval;
	
	for(var ore in this.pOreBuffer.buffer) {
		if(this.pOreBuffer.buffer[ore].gt(0)) {
			this.pOreBuffer.buffer[ore] = this.pOreBuffer.buffer[ore].minus(1);
			this.player.addResource(ore, new Decimal(1));
			this.particles.createParticle(function(){
				this.particles.createFloatingResourceParticle(new Decimal(1), null, this.x, this.y, null);
			}.bind(this),
			Game.Assets["imgParticle_" + ore], 0.5, 0.5, this.gameObject.x, this.gameObject.y, this.x, this.y, 4, 10);
			return;
		}
		else continue;
	}
	
	this.pOreBuffer.buffer = {};
	this.pOreBuffer.bufferCount = new Decimal(0);
	this.pOreBuffer.isFull = false;
	
	this.isUnloading = false;
}

function PGridMovement(gameObject, level) {
	GameObjectProperty.call(this, gameObject);
	
	this.level = level;
	
	this.pPlayerUnit = null;
}
PGridMovement.prototype = Object.create(GameObjectProperty.prototype);
PGridMovement.prototype.constructor = PGridMovement;
PGridMovement.prototype.initialize = function() { 
	GameObjectProperty.prototype.initialize.apply(this);
	this.pPlayerUnit = this.gameObject.getProperty(PPlayerUnit);
}
PGridMovement.prototype.onReset = function() { 
	this.isMoving = false;
	this.vDirection = new Vector2(0, 0);
	this.rotation = 0;
	
	this.collisionThreshold = 10;
	
	this.origX = this.gameObject.x;
	this.origY = this.gameObject.y;
	this.calculatedX = this.gameObject.x;
	this.calculatedY = this.gameObject.y;
}
PGridMovement.prototype.act = function(frameTime) {
	if(!this.isMoving) {
		this.calculatedX = this.gameObject.x;
		this.calculatedY = this.gameObject.y;
		return;
	}
	
	this.calculatedX += this.vDirection.x * this.gameObject.speed / 1000 * frameTime;
	this.calculatedY += this.vDirection.y * this.gameObject.speed / 1000 * frameTime;
	
	if((function(a){if(a.vDirection.x > 0){return a.calculatedX >= a.origX + a.vDirection.x}else{return a.calculatedX <= a.origX + a.vDirection.x}})(this) && 
	   (function(a){if(a.vDirection.y > 0){return a.calculatedY >= a.origY + a.vDirection.y}else{return a.calculatedY <= a.origY + a.vDirection.y}})(this)) {
		this.calculatedX = this.origX + this.vDirection.x;
		this.calculatedY = this.origY + this.vDirection.y;
		this.isMoving = false;
	}
}

PGridMovement.prototype.moveBy = function(vOffset) {
	if(this.isMoving)
		return;
	
	this.vDirection = vOffset;

	this.rotateTowardsDirection(vOffset.x, vOffset.y);
	
	this.origX = this.gameObject.x;
	this.origY = this.gameObject.y;
	this.calculatedX = this.gameObject.x;
	this.calculatedY = this.gameObject.y;
	
	this.gameObject.x += vOffset.x;
	this.gameObject.y += vOffset.y;
	
	if(this.pPlayerUnit) {
		this.level.uncoverFogOfWar(this.gameObject.x, this.gameObject.y, this.pPlayerUnit.fogOfWarRadius);
	}
	
	this.isMoving = true;
	
	this.level.reportGameObjectMovementThisFrame(this.gameObject, this.origX, this.origY, this.gameObject.x, this.gameObject.y);
}

PGridMovement.prototype.rotateTowardsDirection = function(x, y) {
	if(x > 0)
		this.rotation = 90;
	else if(x < 0)
		this.rotation = -90;
	else if(y > 0)
		this.rotation = 180;
	else if(y < 0)
		this.rotation = 0;
}

function PProxyAI(gameObject, level) {
	GameObjectProperty.call(this, gameObject);
	
	this.level = level;
	
	this.pGridMovement = null;
	this.pOreBuffer = null;
	this.pOreMiner = null;
	this.pOreBufferUnloader = null;
	this.pPlayerUnit = null;
}
PProxyAI.prototype = Object.create(GameObjectProperty.prototype);
PProxyAI.prototype.constructor = PProxyAI;
PProxyAI.prototype.initialize = function() {
	GameObjectProperty.prototype.initialize.apply(this);
	
	this.pGridMovement = this.gameObject.getProperty(PGridMovement);
	this.pOreBuffer = this.gameObject.getProperty(POreBuffer);
	this.pOreMiner = this.gameObject.getProperty(POreMiner);
	this.pOreBufferUnloader = this.gameObject.getProperty(POreBufferUnloader);
	this.pPlayerUnit = this.gameObject.getProperty(PPlayerUnit);
}
PProxyAI.prototype.onReset = function() {
	this.targetPath = [];
	this.pathIndex = 1;
	this.targetType = "";
	
	this.state = "Halted";
	
	this.haltedInterval = 1000;
	this.haltedClock = 0;
	
	this.attemptInterval = 2;
	this.attemptCount = 0;
	
	this.previousRelay = null;
	this.focusedRelay = null;
	this.isRelayChanged = false;
}
PProxyAI.prototype.onPlay = function() {
	var hq = this.level.getGameObjectsWithProperty(PHeadquarters);
	if(hq.length > 0) {
		var i, playerUnit;
		for(i = 0; i < hq.length; i++) {
			playerUnit = hq[i].getProperty(PPlayerUnit);
			if(playerUnit !== null && playerUnit.team === this.gameObject.getProperty(PPlayerUnit).team) {
				this.focusedRelay = hq[i];
				break;
			}
		}
	}
	
	this.isRelayChanged = false;
}
PProxyAI.prototype.act = function(frameTime) {
	var mov = this.pGridMovement;
	var buf = this.pOreBuffer;
	var miner = this.pOreMiner;
	var unl = this.pOreBufferUnloader;
	
	if(this.state !== "Idle") {
		mov.act(frameTime);
	}
	
	if(!this.level.isGameObjectPlaced(this.focusedRelay)) {
		this.focusedRelay = null;
	}
	
	if(this.focusedRelay === null) {
		this.state = "Permanently Inactive (Need relay in range when placing)";
		return;
	}

	switch(this.state) {
		case "Halted":
			this.haltedClock += frameTime;
			if(this.haltedClock >= this.haltedInterval) {
				this.haltedClock = 0;
				this.haltedInterval = 500 + GameUtil.getRandomInt(0, 1001);
				this.state = "Idle";
			}
			break;
		case "Idle":
			if(this.isRelayChanged) {
				var pos = this.getTargetPositionInProximityOfObjectWithProperty(PRelay);
				if(pos === null) {
					if(this.moveStepTowardsTarget()) {
						this.state = "Moving";
					}
					else {
						this.state = "Halted";
						this.resetTarget();
						if(!this.pathToRelay(this.focusedRelay, this.previousRelay))
							console.log("Proxy: Failed to path to relay");
					}
				}
				else {
					this.isRelayChanged = false;
					this.state = "Idle";
				}
			}
			else if(!buf.isFull) {
				if(this.targetType == "Ore") {
					var pos = this.getTargetPositionInProximityOfObjectWithProperty(POreResources);
					if(pos !== null) {
						mov.rotateTowardsDirection(pos.x - this.gameObject.x, pos.y - this.gameObject.y);
						miner.x = pos.x;
						miner.y = pos.y;
						
						this.resetTarget();
						
						this.state = "Mining";
					}
					else {
						if(this.moveStepTowardsTarget()) {
							this.state = "Moving";
						}
						else {
							this.resetTarget();
						}
					}
				}
				else {
					this.targetPath = this.getTargetOrePosition();
					if(this.targetPath.length === 0) {
						this.state = "Idle";
						this.resetTarget();
						this.findNewRelay();
					}
					else {
						this.targetType = "Ore";
						this.pathIndex = 1;
					}
				}
			}
			else {
				if(this.targetType == "Stash") {
					var pos = this.getTargetPositionInProximityOfObjectWithProperty(PStash);
					if(pos !== null) {
						mov.rotateTowardsDirection(pos.x - this.gameObject.x, pos.y - this.gameObject.y);
						unl.x = pos.x;
						unl.y = pos.y;
						
						this.resetTarget();
						
						this.state = "Unloading";
					}
					else {
						if(this.moveStepTowardsTarget()) {
							this.state = "Moving";
						}
						else {
							this.resetTarget();
						}
					}
				}
				else {
					this.targetPath = this.getTargetStashPosition();
					if(this.targetPath.length === 0) {
						this.state = "Idle";
						this.resetTarget();
						this.findNewRelay();
					}
					else {
						this.targetType = "Stash";
						this.pathIndex = 1;
					}
				}
			}
			break;
		case "Mining":
			miner.act(frameTime);
			if(!miner.isMining) {
				this.state = "Idle";
			}
			break;
		case "Unloading":
			unl.act(frameTime);
			if(!unl.isUnloading)
				this.state = "Idle";
			break;
		case "Moving":
			if(!mov.isMoving) {
				this.state = "Idle";
			}
			break;
	}
}
PProxyAI.prototype.resetTarget = function() {
	this.targetPath = [];
	this.targetType = "";
	this.pathIndex = 1;
}

PProxyAI.prototype.moveStepTowardsTarget = function() {
	if(this.pathIndex >= this.targetPath.length)
		return false;
	
	

	/*if(this.targetPath.x == this.x && this.targetPath.y == this.y) //if ore is destroyed by another item we don't know about it, so if we'd moved onto it return failed action
		return false;*/
	
	var vDirection = Vector2.normalize(this.targetPath[this.pathIndex][0] - this.gameObject.x, this.targetPath[this.pathIndex][1] - this.gameObject.y);
	
	var vDirectionAbs = new Vector2(Math.abs(vDirection.x), Math.abs(vDirection.y));
	if(vDirectionAbs.x > vDirectionAbs.y) {
		var x = Math.round(vDirection.x);
		vDirection = new Vector2(x, 0);
	}
	else {
		var y = Math.round(vDirection.y);
		vDirection = new Vector2(0, y);
	}
	
	/*var collidingObjects = this.level.getGameObjectsAt(this.gameObject.x + vDirection.x, this.gameObject.y + vDirection.y);

	this.pathIndex++;
	
	this.pGridMovement.rotateTowardsDirection(vDirection.x, vDirection.y);
	
	if(collidingObjects === null)
		this.pGridMovement.moveBy(vDirection);
	else
		return false;
	return true;*/
	
	var collidingObjects = this.level.getGameObjectsAt(this.gameObject.x + vDirection.x, this.gameObject.y + vDirection.y);
	var i;
	if(collidingObjects !== null)
		for(i = 0; i < collidingObjects.length; i++) {
			if(collidingObjects[i].isCollider)
				return false;
		}
	
	this.pGridMovement.rotateTowardsDirection(vDirection.x, vDirection.y);
	this.pGridMovement.moveBy(vDirection);
	
	this.pathIndex++;

	return true;
}

PProxyAI.prototype.getTargetOrePosition = function() {
	//http://stackoverflow.com/questions/3706219/algorithm-for-iterating-over-an-outward-spiral-on-a-discrete-2d-grid-from-the-or
	var x = 0,
        y = 0,
        delta = [0, -1],
        width = 40,
        height = 40,
		i,
		maxAttempts = 20,
		attemptCount = 0,
		path = [],
		calcX = 0,
		calcY = 0,
		obj = null;

    for (i = Math.pow(Math.max(width, height), 2); i>0; i--) {
        if ((-width/2 < x && x <= width/2) 
                && (-height/2 < y && y <= height/2)) {
					
			calcX = x + this.focusedRelay.x + Math.floor(this.focusedRelay.width / 2);
			calcY = y + this.focusedRelay.y + Math.floor(this.focusedRelay.height / 2);
			
			obj = this.level.getSingleGameObjectWithPropertyAt(calcX, calcY, POreResources);
			
			if(obj !== null) {
				path = this.level.getPathWithinConnectingRelays(this.gameObject, obj, this.focusedRelay, this.focusedRelay);
				
				if(path.length > 0) {
					break;
				}
				else {
					attemptCount++;
					if(attemptCount >= maxAttempts) {
						console.log("Proxy: Max attempts (" + attemptCount + ")");
						break;
					}
				}
			}
			//
        }

        if (x === y 
                || (x < 0 && x === -y) 
                || (x > 0 && x === 1-y)){
            // change direction
            delta = [-delta[1], delta[0]]            
        }

        x += delta[0];
        y += delta[1];        
    }
	
	return path;
}

PProxyAI.prototype.getTargetStashPosition = function() {
	var arr2 = this.level.getGameObjectsWithProperty(PStash);
	var arr = [];
	
	var targetsArr = [];
	var i, x, y;
	
	for(i = 0; i < arr2.length; i++) {
		if(arr2[i].getProperty(PPlayerUnit).team === this.pPlayerUnit.team)
			arr.push(arr2[i]);
	}
	
	if(arr.length === 0)
		return [];
	
	for(i = 0; i < arr.length; i++) {
		for(y = 0; y < arr[i].height; y++) {
			for(x = 0; x < arr[i].width; x++) {
				targetsArr.push([arr[i].x + x, arr[i].y + y, arr[i]]);
			}
		}
	}

	var targetIndex = 0;
	var targetDistance = Vector2.distance(new Vector2(this.gameObject.x, this.gameObject.y), new Vector2(targetsArr[0][0], targetsArr[0][1]));
	
	for(i = 1; i < targetsArr.length; i++) {
		var distance = Vector2.distance(new Vector2(this.gameObject.x, this.gameObject.y), new Vector2(targetsArr[i][0], targetsArr[i][1]));
		if(distance == 0)
			continue;
		if(distance < targetDistance) {
			targetIndex = i;
			targetDistance = distance;
		}
	}

	return this.level.getPathWithinConnectingRelays(this.gameObject, targetsArr[targetIndex][2], this.focusedRelay, this.focusedRelay);
}

PProxyAI.prototype.getTargetPositionInProximityOfObjectWithProperty = function(p) {
	var x = this.gameObject.x;
	var y = this.gameObject.y;
	var i, j;
	var sides = [], objs;
	
	sides[0] = new Vector2(x - 1, y);
	sides[1] = new Vector2(x, y - 1);
	sides[2] = new Vector2(x, y + 1);
	sides[3] = new Vector2(x + 1, y);
	
	for(i = 0; i < sides.length; i++) {
		objs = this.level.getGameObjectsAt(sides[i].x, sides[i].y);
		if(objs !== null) {
			for(j = 0; j < objs.length; j++) {
				if(objs[j].getProperty(p) !== null) {
					var property = objs[j].getProperty(PPlayerUnit);
					if(property) {
						if(property.team !== this.pPlayerUnit.team)
							continue;
					}
					if(objs[j] === this.previousRelay)
						continue;
					
					return sides[i];
				}
			}
		}
	}
	
	return null;
}

PProxyAI.prototype.pathToRelay = function(toRelay, aroundRelay) {
	var path = this.level.getPathWithinConnectingRelays(this.gameObject, toRelay, aroundRelay, toRelay);
	
	if(path.length > 0) {
		this.resetTarget();
		this.targetType = "Relay";
		this.targetPath = path;
		
		return true;
	}
	return false;
}

PProxyAI.prototype.findNewRelay = function() {
	/*if(this.focusedRelay === null) { //if no relays
		var relays = this.level.getGameObjectsWithProperty(PRelay);
		var _obj;
		for(_obj in relays) {
			if(relays[_obj].getProperty(PPlayerUnit) === null)
				delete relays[_obj];
		}
		
		var closestRelay = null;
		var distance = Number.MAX_VALUE;
		
		var tempDistance = 0;
		
		for(_obj in relays) {
			tempDistance = Vector2.distance(new Vector2(this.gameObject.x, this.gameObject.y), new Vector2(relays[_obj].x, relays[_obj].y))
			if(tempDistance < distance) {
				distance = tempDistance;
				closestRelay = relays[_obj];
			}
		}
		
		if(closestRelay === null)
			return false;
		else {
			this.focusedRelay = closestRelay;
			this.isRelayChanged = true;
			return true;
		}
	}*/
	

	var i, j, prop = this.focusedRelay.getProperty(PRelay);

	var currentSetOfRelays = [];

	for(i = 0; i < prop.connections.length; i++) {
		//if the connection is not current relay or previous relay if more than 1 connection exists
		if(prop.connections[i] !== this.focusedRelay) {
			if(prop.connections[i] === this.previousRelay && prop.connections.length > 1)
				continue;
			
			currentSetOfRelays.push(prop.connections[i]);
		}
	}
	
	if(currentSetOfRelays.length === 0)
		return false;
	
	var chosenRelay = currentSetOfRelays[Math.floor(Math.random() * currentSetOfRelays.length)];
	
	this.previousRelay = this.focusedRelay;
	this.focusedRelay = chosenRelay;
	this.isRelayChanged = true;
	
	return this.pathToRelay(this.focusedRelay, this.previousRelay);
		
		
		/*for(j = 0; j < 1000; j++) {
			for(i = 0; i < currentSetOfRelays.length; i++) {
				
			}
		}*/
		
		//console.warn("PProxyAI findNewRelay() reached threshold of 1000.");
	
}

function PPlayerUnit(gameObject, team, fogOfWarRadius) {
	GameObjectProperty.call(this, gameObject);
	
	this.team = team;
	this.fogOfWarRadius = fogOfWarRadius;
}
PPlayerUnit.prototype = Object.create(GameObjectProperty.prototype);
PPlayerUnit.prototype.constructor = PPlayerUnit;

function PRelay(gameObject, range, connectRange, level) {
	GameObjectProperty.call(this, gameObject);
	
	this.range = range;
	this.connectRange = connectRange;
	
	this.connections = [];
	
	this.level = level;
}
PRelay.prototype = Object.create(GameObjectProperty.prototype);
PRelay.prototype.constructor = PRelay;
PRelay.prototype.onPlay = function() {
	
	
}
PRelay.prototype.addConnection = function(gameObject) {
	if(!(gameObject instanceof GameObject))
		return false;
	
	if(gameObject.getProperty(PRelay) === null)
		return false;
	
	var relay;
	for(relay in this.connections) {
		if(this.connections[relay] === gameObject)
			return true;
	}
	
	this.connections.push(gameObject);
	return true;
}
PRelay.prototype.act = function(frameTime) {/*
	this.connections = [];
	
	var relays = this.level.getGameObjectsWithPropertyReturnProperty(PRelay);
	var name, relay;
	var x1, y1, x2, y2;
	
	var temp, distance, prop, relayObj;
	
	for(name in relays) {
		relay = relays[name];
		relayObj = relay.gameObject;
		
		if(relayObj === this.gameObject)
			continue;
		
		distance = Number.MAX_VALUE;
		
		for(y1 = relayObj.y; y1 < relayObj.y + relayObj.height; y1++)
			for(x1 = relayObj.x; x1 < relayObj.x + relayObj.width; x1++)
				for(y2 = this.gameObject.y; y2 < this.gameObject.y + this.gameObject.height; y2++)
					for(x2 = this.gameObject.x; x2 < this.gameObject.x + this.gameObject.width; x2++) {
						temp = Vector2.distance(new Vector2(x1, y1), new Vector2(x2, y2));
						if(temp < distance)
							distance = temp;
					}
		
		if(distance > this.connectRange && distance > relay.connectRange)
			continue;
		
		if(this.level.isRaycastBlocked(this.gameObject, relayObj))
			continue;
		
		this.addConnection(relayObj);
		relay.addConnection(this.gameObject);
	}*/
}


function PUpgrades(gameObject) {
	GameObjectProperty.call(this, gameObject);
}
PUpgrades.prototype = Object.create(GameObjectProperty.prototype);
PUpgrades.prototype.constructor = PUpgrades;

function PUpgradesProxy(gameObject) {
	PUpgrades.call(this, gameObject);
	
	this.upgradesInfo = {
		speed : {
			name: "Movement speed",
			base : 1.4,
			baseIncrease : 0.2,
			cost : {
				science : 5,
			},
			costIncrease : {
				science : 5
			}
		},
		miningSpeed : {
			name: "Mining speed",
			base : 1,
			baseIncrease : 0.2,
			cost : {
				science : 5,
			},
			costIncrease : {
				science : 5
			}
		}
	}
	
	this.upgradesPurchased = {
		speed : {
			amount : 0,
			calculatedBase : this.upgradesInfo.speed.base,
			calculatedCost : this.upgradesInfo.speed.cost
		},
		miningSpeed : {
			amount : 0,
			calculatedBase : this.upgradesInfo.miningSpeed.base,
			calculatedCost : this.upgradesInfo.miningSpeed.cost
		}
	}
	
	this.gameObject.speed = this.upgradesInfo.speed.base;
	this.gameObject.miningSpeed = this.upgradesInfo.miningSpeed.base;
}
PUpgradesProxy.prototype = Object.create(PUpgrades.prototype);
PUpgradesProxy.prototype.constructor = PUpgradesProxy;
PUpgradesProxy.prototype.upgrade = function(what) {
	if(typeof this.upgradesInfo[what] !== "undefined" && typeof this.upgradesPurchased[what] !== "undefined" && typeof this.gameObject[what] !== "undefined") {
		this.upgradesPurchased[what].amount++;
		this.upgradesPurchased[what].calculatedBase = this.upgradesInfo[what].base + (this.upgradesInfo[what].baseIncrease * this.upgradesPurchased[what].amount);
		this.gameObject[what] = this.upgradesPurchased[what].calculatedBase;
		
		return true;
	}
	return false;
}

function PStash(gameObject) {
	GameObjectProperty.call(this, gameObject);
}
PStash.prototype = Object.create(GameObjectProperty.prototype);
PStash.prototype.constructor = PStash;


function PHeadquarters(gameObject) {
	GameObjectProperty.call(this, gameObject);
}
PHeadquarters.prototype = Object.create(GameObjectProperty.prototype);
PHeadquarters.prototype.constructor = PHeadquarters;






