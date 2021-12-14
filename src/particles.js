(function() {
	function Particle(callback, image, width, height, vOrigin, vTarget, speed, rotation) {
		this.callback = callback;
		this.image = image;
		this.vOrigin = vOrigin;
		this.vTarget = vTarget;
		
		this.x = vOrigin.x;
		this.y = vOrigin.y;
		this.width = width;
		this.height = height;
		
		this.vPosition = new Vector2(vOrigin.x, vOrigin.y);
		this.speed = speed;
		this.rotation = rotation;
		this.isMoving = true;
		
		this.distance = Vector2.distance(vOrigin, vTarget);
		this.vDirection = Vector2.normalize(vTarget.x - vOrigin.x, vTarget.y - vOrigin.y);
	}
	
	Particle.prototype.act = function(frameTime) {
		if(this.isMoving) {
			this.vPosition.x += this.vDirection.x * this.speed * frameTime / 1000;
			this.vPosition.y += this.vDirection.y * this.speed * frameTime / 1000;
			
			if(Vector2.distance(this.vOrigin, this.vPosition) >= this.distance) {
				this.vPosition.x = this.vTarget.x;
				this.vPosition.y = this.vTarget.y;
				this.isMoving = false;
				if(this.callback)
					this.callback();
			}
			
			this.x = this.vPosition.x;
			this.y = this.vPosition.y;
		}
	}

	Particle.prototype.draw = function(ctx, cellSize) {
		if(this.image) {
			var calcX = (this.x * cellSize + cellSize / 2) - (cellSize * this.width / 2);
			var calcY = (this.y * cellSize + cellSize / 2) - (cellSize * this.height / 2);
			ctx.drawImage(this.image, calcX, calcY, cellSize * this.width, cellSize * this.height);
		}
	}
	
	Game.Particle = Particle;
})();

(function() {
	function ParticleFloatingResource(callback, image, width, height, vOrigin, vTarget, speed, rotation, decimal, hexColor) {
		Game.Particle.call(this, callback, image, width, height, vOrigin, vTarget, speed, rotation);
		
		this.decimal = decimal;
		this.hexColor = hexColor;
	}
	ParticleFloatingResource.prototype = Object.create(Game.Particle.prototype);
	ParticleFloatingResource.constructor = ParticleFloatingResource;
	
	ParticleFloatingResource.prototype.draw = function(ctx, cellSize) {
		ctx.font="20px Georgia";
		if(this.hexColor)
			ctx.fillStyle = this.hexColor;
		else 
			ctx.fillStyle = "#000000";
		
		var calcX = (this.x * cellSize) + (cellSize * 0.25);
		var calcY = (this.y * cellSize) + (cellSize / 2);
			
		if(this.image) {
			ctx.drawImage(this.image, calcX, calcY, cellSize / 4, cellSize / 4);
			ctx.fillText("+" + this.decimal.toNumber(), calcX + cellSize / 4, calcY, cellSize / 4);
		}
		else {
			ctx.fillText("+" + this.decimal.toNumber(), calcX, calcY);
		}
	}
	
	Game.ParticleFloatingResource = ParticleFloatingResource;
})();