"use strict";

const FRAMERATE = 60;
const PLAYER_SIZE = 50;
const ENEMY_SIZE = 50;
const PLAYER_VELOCITY = 300;
const MAX_VELOCITY = 275;

const DEFAULT_COLOR = 'white';
const DEFAULT_WIDTH = 1;

/**
 * Dessine toutes les entités du jeu.
 */
function draw(canvas) {
    let context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    entities.player.draw();
    entities.enemies.forEach(e => e.draw());
    entities.projectiles.forEach(p => p.draw());

    context.fillStyle = 'green';
    context.fillText("FPS: " + Math.round(1 / delta), 10, 20);
    context.fillText("Avg latency: " + delta, 10, 30);
    context.fillText("E: " + (entities.enemies.length + entities.projectiles.length + 1), 10, canvas.height - 10);
}

/***
 * Met à jour toutes les entités du jeu. (Position, vitesse, état, ...)
 */
function update(delta) {
    entities.player.update(delta);
    entities.enemies.forEach(e => e.update(delta));
    entities.projectiles.forEach(p => p.update(delta));
}

/**
 * Boucle principale.
 */
function gameLoop(canvas) {
    let date = new Date();

    delta = (date.getTime() - lastTime) / 1000;
    lastTime = date.getTime();

    update(delta);
    draw(canvas);
}

/**
 * Dessine un élément.
 * @param context Contexte.
 * @param style Couleur de l'élément.
 * @param fill Remplissage du polygone.
 * @param width Épaisseur du trait.
 * @param f Fonction contenant les instructions.
 */
function drawElement(context, style, fill, width, f) {
    context.strokeStyle = style;
    context.fillStyle = style;
    context.lineWidth = width;
    context.beginPath();
    f();
    context.closePath();
    if (fill) context.fill();
    context.stroke();
}

function drawPolygone(context, x, y, style, width, sides, radius, rotation = 0) {
    drawElement(context, style, true, width, () => {
        for (let i = 0; i < sides; i++) {
            let angle = i * 2 * Math.PI / sides + Math.PI / 2 + rotation;
            context.lineTo(x - Math.cos(angle) * radius, y - Math.sin(angle) * radius);
        }
    })
}

class Player {

    context;
    x;
    y;
    radius;
    rotation;

    leftOffset = 0;
    bottomOffset = 0;
    rightOffset = 0;
    topOffset = 0;

    sides = 3;

    constructor(context, x, y, radius, rotation = 0) {
        this.context = context;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.rotation = rotation;

        for (let i = 0; i < this.sides; i++) {
            let angle = i * 2 * Math.PI / this.sides + Math.PI / 2 + this.rotation;

            if (this.x - Math.cos(angle) * this.radius < this.x - this.leftOffset)
                this.leftOffset = Math.cos(angle) * this.radius;

            if (this.x - Math.cos(angle) * this.radius > this.x + this.rightOffset)
                this.rightOffset = Math.abs(Math.cos(angle)) * this.radius;

            if (this.y - Math.sin(angle) * this.radius < this.y - this.topOffset)
                this.topOffset = Math.sin(angle) * this.radius;

            if (this.y - Math.sin(angle) * this.radius > this.y + this.bottomOffset)
                this.bottomOffset = Math.abs(Math.sin(angle)) * this.radius;
        }
    }

    draw() {
        drawPolygone(this.context, this.x, this.y, 'white', 2, this.sides, this.radius, this.rotation);
        /*
        Dessin de la hit box.

        drawElement(this.context, 'green', false, 1, () => {
            this.context.moveTo(this.x - this.leftOffset, this.y - this.topOffset);
            this.context.lineTo(this.x + this.rightOffset, this.y - this.topOffset);
            this.context.lineTo(this.x + this.rightOffset, this.y + this.bottomOffset);
            this.context.lineTo(this.x - this.leftOffset, this.y + this.bottomOffset);
            this.context.lineTo(this.x - this.leftOffset, this.y - this.topOffset);
        });
        */
    }

    update(delta) {
        let width = this.context.canvas.width;
        let height = this.context.canvas.height;

        if (keys.ArrowUp && (this.y - this.topOffset) > 0) this.y -= delta * PLAYER_VELOCITY;
        if (keys.ArrowDown && (this.y + this.bottomOffset) < height) this.y += delta * PLAYER_VELOCITY;
        if (keys.ArrowLeft && (this.x - this.leftOffset) > 0) this.x -= delta * PLAYER_VELOCITY;
        if (keys.ArrowRight && (this.x + this.rightOffset) < width) this.x += delta * PLAYER_VELOCITY;
    }

}

class Enemy {

    context;
    x;
    y;
    radius;
    rotation;

    xVelocity;
    yVelocity;

    leftOffset = 0;
    bottomOffset = 0;
    rightOffset = 0;
    topOffset = 0;

    sides = 5;

    constructor(context, x, y, radius, rotation = 0) {
        this.context = context;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.rotation = rotation;

        this.xVelocity = this.x < this.context.canvas.width / 2 ? -100 : 100;
        this.yVelocity = 50;

        for (let i = 0; i < this.sides; i++) {
            let angle = i * 2 * Math.PI / this.sides + Math.PI / 2 + this.rotation;

            if (this.x - Math.cos(angle) * this.radius < this.x - this.leftOffset)
                this.leftOffset = Math.cos(angle) * this.radius;

            if (this.x - Math.cos(angle) * this.radius > this.x + this.rightOffset)
                this.rightOffset = Math.abs(Math.cos(angle)) * this.radius;

            if (this.y - Math.sin(angle) * this.radius < this.y - this.topOffset)
                this.topOffset = Math.sin(angle) * this.radius;

            if (this.y - Math.sin(angle) * this.radius > this.y + this.bottomOffset)
                this.bottomOffset = Math.abs(Math.sin(angle)) * this.radius;
        }
    }

    draw() {
        drawPolygone(this.context, this.x, this.y, 'white', 2, this.sides, ENEMY_SIZE / 2, this.rotation);
        /*
        Dessin de la hit box.

        drawElement(this.context, 'green', false, 1, () => {
            this.context.moveTo(this.x - this.leftOffset, this.y - this.topOffset);
            this.context.lineTo(this.x + this.rightOffset, this.y - this.topOffset);
            this.context.lineTo(this.x + this.rightOffset, this.y + this.bottomOffset);
            this.context.lineTo(this.x - this.leftOffset, this.y + this.bottomOffset);
            this.context.lineTo(this.x - this.leftOffset, this.y - this.topOffset);
        });
        */
    }

    update(delta) {
        if (this.xVelocity < 0) {
            if (this.x - this.leftOffset < 0)
                this.xVelocity *= Math.abs(this.xVelocity) < MAX_VELOCITY ? -1.1 : -1;
        } else {
            if (this.x + this.rightOffset > this.context.canvas.width)
                this.xVelocity *= Math.abs(this.xVelocity) < MAX_VELOCITY ? -1.1 : -1;
        }
        if (this.yVelocity < 0) {
            if (this.y - this.topOffset < 0)
                this.yVelocity *= Math.abs(this.yVelocity) < MAX_VELOCITY ? -1.1 : -1;
        } else {
            if (this.y + this.bottomOffset > this.context.canvas.height)
                this.yVelocity *= Math.abs(this.yVelocity) < MAX_VELOCITY ? -1.1 : -1;
        }
        this.x += delta * this.xVelocity;
        this.y += delta * this.yVelocity;
    }

}

let entities = {
    "enemies": [],
    "projectiles": []
};
let keys = {
    "ArrowUp": false,
    "ArrowDown": false,
    "ArrowLeft": false,
    "ArrowRight": false
};

let lastTime = new Date().getTime();
let delta = 0;

window.onload = function () {

    const CANVAS = document.getElementById('game_area');

    window.setInterval(() => gameLoop(CANVAS), 1000 / FRAMERATE);
    window.onkeydown = function (e) {
        if (e.key in keys) keys[e.key] = true;
    };
    window.onkeyup = function (e) {
        if (e.key in keys) keys[e.key] = false;
    };

    entities.player = new Player(CANVAS.getContext('2d'), CANVAS.width / 2, CANVAS.height * 5 / 6, PLAYER_SIZE / 2);

    entities.enemies.push(new Enemy(CANVAS.getContext('2d'), CANVAS.width / 2, CANVAS.height * 5 / 6, ENEMY_SIZE / 2));

};
