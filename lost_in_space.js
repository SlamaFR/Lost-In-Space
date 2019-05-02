"use strict";

const FRAMERATE = 60;
const PLAYER_SIZE = 50;
const ENEMY_SIZE = 50;
const PLAYER_VELOCITY = 300;
const MAX_VELOCITY = 275;

let debugging = false;

/**
 * Dessine toutes les entités du jeu.
 * @param canvas Canvas du jeu.
 */
function draw(canvas) {
    let context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    entities.player.draw();
    entities.enemies.forEach(e => e.draw());
    entities.projectiles.forEach(p => p.draw());

    if (debugging) {
        context.fillStyle = 'green';
        context.fillText("FPS: " + Math.round(1 / delta), 10, 20);
        context.fillText("Avg gap: " + delta + "s", 10, 30);
        context.fillText("E: " + (entities.enemies.length + entities.projectiles.length + 1), 10, canvas.height - 10);

        context.fillText('Up: ' + keys.ArrowUp, 10, 50);
        context.fillText('Left: ' + keys.ArrowLeft, 10, 60);
        context.fillText('Down: ' + keys.ArrowDown, 10, 70);
        context.fillText('Right: ' + keys.ArrowRight, 10, 80);
    }
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

/**
 * Dessine un polygone régulier.
 * @param context Contexte.
 * @param x Abscisse du centre.
 * @param y Ordonnée du centre.
 * @param style Couleur du polygone.
 * @param width Épaisseur du trait.
 * @param sides Nombre de côtés.
 * @param radius Rayon du polygone.
 * @param rotation Rotation du polygone en radians.
 */
function drawPolygon(context, x, y, style, width, sides, radius, rotation = 0) {
    drawElement(context, style, true, width, () => {
        for (let i = 0; i < sides; i++) {
            let angle = i * 2 * Math.PI / sides + Math.PI / 2 + rotation;
            context.lineTo(x - Math.cos(angle) * radius, y - Math.sin(angle) * radius);
        }
    })
}

/**
 * Dessine la hit box d'une entité.
 * @param entity Entité.
 */
function drawHitBox(entity) {
    drawElement(entity.context, 'green', false, 1, () => {
        entity.context.moveTo(entity.x - entity.leftOffset, entity.y - entity.topOffset);
        entity.context.lineTo(entity.x + entity.rightOffset, entity.y - entity.topOffset);
        entity.context.lineTo(entity.x + entity.rightOffset, entity.y + entity.bottomOffset);
        entity.context.lineTo(entity.x - entity.leftOffset, entity.y + entity.bottomOffset);
        entity.context.lineTo(entity.x - entity.leftOffset, entity.y - entity.topOffset);
    });
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
        drawPolygon(this.context, this.x, this.y, 'white', 2, this.sides, this.radius, this.rotation);
        if (debugging) drawHitBox(this);
    }

    update(delta) {
        let width = this.context.canvas.width;
        let height = this.context.canvas.height;

        if (keys.ArrowUp && !keys.ArrowDown && (this.y - this.topOffset) > 0) this.y -= delta * PLAYER_VELOCITY;
        if (keys.ArrowDown && !keys.ArrowUp && (this.y + this.bottomOffset) < height) this.y += delta * PLAYER_VELOCITY;
        if (keys.ArrowLeft && !keys.ArrowRight && (this.x - this.leftOffset) > 0) this.x -= delta * PLAYER_VELOCITY;
        if (keys.ArrowRight && !keys.ArrowLeft && (this.x + this.rightOffset) < width) this.x += delta * PLAYER_VELOCITY;
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
        drawPolygon(this.context, this.x, this.y, 'white', 2, this.sides, ENEMY_SIZE / 2, this.rotation);
        if (debugging) drawHitBox(this);
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
        else if (e.key.toLowerCase() === 'i') debugging = !debugging;
    };
    window.onkeyup = function (e) {
        if (e.key in keys) keys[e.key] = false;
    };

    entities.player = new Player(CANVAS.getContext('2d'), CANVAS.width / 2, CANVAS.height * 5 / 6, PLAYER_SIZE / 2);

    entities.enemies.push(new Enemy(CANVAS.getContext('2d'), CANVAS.width / 2, CANVAS.height * 5 / 6, ENEMY_SIZE / 2));

};
