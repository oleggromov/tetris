function play() {
	var game = new Tetris('tetris');
};

// Global settings
Tetris.settings = {};
Tetris.settings.levels = [
	{ speed: 1000, next: 50, scoreUp: 10, multiLine: 1 },	
	{ speed: 900, next: 200, scoreUp: 20, multiLine: 1.2 }, 
	{ speed: 800, next: 1000, scoreUp: 30, multiLine: 1.5 },
	{ speed: 700, next: 5000, scoreUp: 40, multiLine: 2 },
	{ speed: 600, next: 15000, scoreUp: 50, multiLine: 3 },
	{ speed: 500, next: 35000, scoreUp: 80, multiLine: 4 },
	{ speed: 400, next: 70000, scoreUp: 100, multiLine: 5 }
];

Tetris.settings.colors = ['#ba0099', '#ba001f', '#3d00ba', '#0095ba', '#00ba1f', '#83ba00', '#f1cc00', '#f14a00', '#f10000'];
Tetris.settings.brickSize = 20;
Tetris.settings.background = 'black';
Tetris.settings.foreground = 'white';
Tetris.settings.text = 'white';

// Constants
Tetris.KEY_UP = 38;
Tetris.KEY_DOWN = 40;
Tetris.KEY_LEFT = 37;
Tetris.KEY_RIGHT = 39;
Tetris.KEY_PAUSE = 32;
Tetris.LINE_GONE = 20;

// Tetris class
function Tetris(canvasId) {
	this.canvas = document.getElementById(canvasId);
	this.ctx = null;

	if (this.canvas) {
		this.canvas.width = 600;
		this.canvas.height = 500;
	
		this.ctx = this.canvas.getContext('2d');
		this.ctx.fillStyle = Tetris.settings.background;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
	};
	
	this.well = new Well(15,24);
	this.figure = new Figure(parseInt(this.well.width/2)-1,-3);

	this.level = 0;
	this.score = 0;
	this.paused = false;
	
	this.draw();

	this.drawDump = "";
	
	// shifting colors[0]
	Tetris.settings.colors.unshift('');
	
	// game actions
	window.TetrisTheGame = this;
	
	// Gameplay
	this.gameplay = function() {
		if (!TetrisTheGame.paused) {
			TetrisTheGame.move({y:1});
			TetrisTheGame.draw();
		}
	};
	
	this.input = function(e) {
		if (Tetris.KEY_PAUSE == e.keyCode || Tetris.KEY_PAUSE == e.charCode) {
			TetrisTheGame.paused = !TetrisTheGame.paused;
			//if (TetrisTheGame.paused) TetrisTheGame.dump();
		}
	
		if (!TetrisTheGame.paused) {
			// move
			if (Tetris.KEY_LEFT == e.keyCode) {
				TetrisTheGame.move({x:-1});
			}
			if (Tetris.KEY_RIGHT == e.keyCode) {
				TetrisTheGame.move({x:1});
			}
			if (Tetris.KEY_DOWN == e.keyCode) {
				TetrisTheGame.move({y:1});
			}
			
			// rotate
			if (Tetris.KEY_UP == e.keyCode) {
				TetrisTheGame.move({rotate:true});
			}			
			
			TetrisTheGame.draw();
		}
	};

	// Gameplay
	this.update = setInterval(this.gameplay, Tetris.settings.levels[this.level].speed);
	// Keyboard input
	window.onkeydown = this.input;
};

Tetris.prototype.move = function(delta) {
	// requested movements
	delta.x = delta.x || 0;
	delta.y = delta.y || 0;
	delta.rotate = delta.rotate || false;

	// initializing
	var tempFigure = new Figure(this.figure.x, this.figure.y, this.figure.state, this.figure.type, this.figure.color);
	
	// and transofrimg temp figure
	tempFigure.x += delta.x;
	tempFigure.y += delta.y;
	if (delta.rotate) tempFigure.rotate();

	// saving its state 
	var state = tempFigure.states[tempFigure.state];
	// absolute brick coords
	var aX, aY;
	
	for (var y = 0; y < tempFigure.height; y++) {
		for (var x = 0; x < tempFigure.width; x++) {
			if (state[y][x]) {
				aX = tempFigure.x + x;
				aY = tempFigure.y + y;
				
				if (delta.x || delta.rotate) {
					// wall or brick collisions
					if ((aX < 0 || aX > this.well.width-1) || (this.well.lines[aY] && this.well.lines[aY][aX])) {
						delta.x = 0;
						delta.rotate = false;
					}
				}
				
				if (delta.y) {
					// floor or brick collision
					if (aY > this.well.height-1 || (this.well.lines[aY] && this.well.lines[aY][aX])) {
						delta.y = 0;
						
						if (aY <= 1) {
							this.paused = true;
							alert('Game over');
						} else {
							this.well.add(this.figure);
							
							var lines = this.well.line();
							var scoreUp = lines * Tetris.settings.levels[this.level].scoreUp
							if (lines > 1) {
								scoreUp *= Tetris.settings.levels[this.level].multiLine;
							}
							this.score += parseInt(scoreUp);
							
							if (this.level+1 < Tetris.settings.levels.length) {
								if (this.score >= Tetris.settings.levels[this.level].next) {
									// enlarging level
									this.level += 1;
									// and timer
									this.update = setInterval(this.gameplay, Tetris.settings.levels[this.level].speed);
								}
							}
							
							this.figure = new Figure(parseInt(this.well.width/2)-1,-3);
						}
				
						return;
					}
				}
			}
		}
	}
	
	this.figure.x += delta.x;
	this.figure.y += delta.y;
	if (delta.rotate) this.figure.rotate();
};

Tetris.prototype.draw = function() {
	var brickSize = Tetris.settings.brickSize;

	// resetting dump
	this.drawDump = "";
		
	// Drawing game background
	this.ctx.fillStyle = Tetris.settings.background;
	this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

	// Well offset (centered)
	var wellOffsetX = (this.canvas.width - this.well.width * brickSize) / 2;
	var wellOffsetY = (this.canvas.height - this.well.height * brickSize) / 2;

	// counters
	var x, y;

	// Drawing well background
	this.ctx.fillStyle = Tetris.settings.foreground;
	this.ctx.fillRect(wellOffsetX, wellOffsetY, this.well.width * brickSize, this.well.height * brickSize);

	// Drawing well bricks
	var wellBricks = this.well.bricks();
	var bX, bY;
	for (y = 0; y < this.well.height; y++) {
		for (x = 0; x < this.well.width; x++) {
			if (wellBricks[y][x]) {
				bX = x * brickSize;
				bY = y * brickSize;

				this.ctx.fillStyle = Tetris.settings.colors[wellBricks[y][x]];
				this.ctx.fillRect(wellOffsetX + bX, wellOffsetY + bY, brickSize, brickSize);
				
				this.drawDump += this.ctx.fillStyle + ' ';
			} else {
				this.drawDump += '.';
			}
		}
		this.drawDump += '\n';
	}
	
	// Drawing current figure
	this.ctx.fillStyle = Tetris.settings.colors[this.figure.color];
	var figureBricks = this.figure.bricks();
	
	var figureOffsetX = this.figure.x * brickSize;
	var figureOffsetY = this.figure.y * brickSize;
	
	for (y = 0; y < this.figure.height; y++) {
		for (x = 0; x < this.figure.width; x++) {
			if (figureBricks[y][x]) {
				bX = x * brickSize;
				bY = y * brickSize;
				
				this.ctx.fillRect(wellOffsetX + figureOffsetX + bX, wellOffsetY + figureOffsetY + bY, brickSize, brickSize);
			}
		}
	}

	this.ctx.fillStyle = Tetris.settings.text;
	this.ctx.font = 'normal 18px sans-serif';
	this.ctx.textAlign = 'right';
	this.ctx.textBaseline = 'top';
	
	this.ctx.fillText(this.score, this.canvas.width - 20, 20);
	this.ctx.fillText(this.level, this.canvas.width - 20, 60);
};

Tetris.prototype.dump = function() {
	if (console) {
		console.log('Draw:\n' + this.drawDump);
		console.log('Well:\n' + this.well.dump());
	}
};

// Well class
function Well(width, height) {
	// size and height
	this.width = width || 10;
	this.height = height || 20;
	
	// game "map"
	this.lines = new Array(this.height);
	for (var i = 0; i < this.height; i++) {
		this.lines[i] = new Array(this.width);
	}
};

Well.prototype.line = function() {
	var lineCount = 0;
	// testing each line
	var temp;
	
	for (var i = 0; i < this.lines.length; i++) {
		temp = 0;
		for (var x = 0; x < this.lines[i].length; x++) {
			if (this.lines[i][x]) {
				temp += 1;
			}
		}
		if (temp == this.lines[i].length) {
			// shifting down the upper lines
			for (ii = i; ii >= 0; ii--) {
				var newIndex = ii-1;
				if (newIndex < 0) {
					this.lines[ii] = new Array(this.width);
				} else {
					this.lines[ii] = this.lines[ii-1];
				}
			}
			
			lineCount += 1;
		}
	}
	
	return lineCount;
}

Well.prototype.add = function(figure) {
	var figureBricks = figure.bricks();
	var color = figure.color;

	// adding figure bricks to the well map
	for (var y = 0; y < figure.height; y++) {
		for (var x = 0; x < figure.width; x++) {
			if (figureBricks[y][x]) {
				this.lines[figure.y + y][figure.x + x] = color;
			} 
		}
	}
}

Well.prototype.bricks = function() {
	return this.lines;
};

Well.prototype.dump = function() {
	var d = "";
	for (y = 0; y < this.height; y++) {
		for (x = 0; x < this.width; x++) {
			d += this.lines[y][x] || 0;
		}
		d += '\n';
	}
	return d;
};

// Figure class
function Figure(posX, posY, initState, type, color) {
	this.x = posX || 0;
	this.y = posY || 0;
	this.state = initState || 0;
	
	this.width = 3;
	this.height = 3;
	this.color = 0;
	
	if (typeof type === "undefined") {
		this.type = parseInt(Math.random()*7);
	} else {
		this.type = type;
	}
	
	if (typeof color === "undefined") {
		while (!this.color) {
			this.color = parseInt(Math.random() * Tetris.settings.colors.length);
		}
	} else {
		this.color = color;
	}
	
	this.states = Array(4);
	if (0 == this.type) {
		this.states[0] = [[0,0,0], [0,1,0], [1,1,1]];
		this.states[1] = [[1,0,0], [1,1,0], [1,0,0]];
		this.states[2] = [[1,1,1], [0,1,0], [0,0,0]];
		this.states[3] = [[0,0,1], [0,1,1], [0,0,1]];
	} 
	
	if (1 == this.type) {
		this.states[0] = [[0,0,0], [0,1,1], [1,1,0]];
		this.states[1] = [[1,0,0], [1,1,0], [0,1,0]];
		this.states[2] = [[0,1,1], [1,1,0], [0,0,0]];
		this.states[3] = [[0,1,0], [0,1,1], [0,0,1]];
	}
	
	if (2 == this.type) {
		this.states[0] = [[0,0,0], [1,0,0], [1,1,1]];
		this.states[1] = [[1,1,0], [1,0,0], [1,0,0]];
		this.states[2] = [[1,1,1], [0,0,1], [0,0,0]];
		this.states[3] = [[0,0,1], [0,0,1], [0,1,1]];
	}
	
	if (3 == this.type) {
		this.states[0] = [[0,0,0], [0,0,1], [1,1,1]];
		this.states[1] = [[1,0,0], [1,0,0], [1,1,0]];
		this.states[2] = [[1,1,1], [1,0,0], [0,0,0]];
		this.states[3] = [[0,1,1], [0,0,1], [0,0,1]];
	}
	
	if (4 == this.type) {
		this.states[0] = [[0,0,0], [1,1,0], [0,1,1]];
		this.states[1] = [[0,1,0], [1,1,0], [1,0,0]];
		this.states[2] = [[1,1,0], [0,1,1], [0,0,0]];
		this.states[3] = [[0,0,1], [0,1,1], [0,1,0]];
	}
	if (5 == this.type) {
		this.width = this.height = 4;
		
		this.states[0] = [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]];
		this.states[1] = [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]];
		this.states[2] = [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]];
		this.states[3] = [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]];
	}
	if (6 == this.type) {
		this.width = this.height = 2;
		this.states[0] = [[1,1], [1,1]];
	}
};

Figure.prototype.rotate = function() {
	this.state = ((this.state + 1) < this.states.length) ? this.state + 1 : 0;
	return true;
};

Figure.prototype.bricks = function() {
	return this.states[this.state];
};
