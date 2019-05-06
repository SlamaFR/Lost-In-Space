"use strict";

const FRAMERATE = 60;
const PLAYER_SIZE = 50;
const ENEMY_SIZE = 50;
const PLAYER_VELOCITY = 300;
const MAX_VELOCITY = 275;

const DEFAULT_X_VELOCITY = 150;
const DEFAULT_Y_VELOCITY = 50;

const PROJECTILE_WIDTH = 2;
const PROJECTILE_HEIGHT = 10;

const MAX_WAVES = 10;
const OBJECTIVE = 300;

let debugging = false;
let killedEnemies = 0;
let waves = 0;

/**
 * Dessine toutes les entités du jeu.
 * @param canvas Canvas du jeu.
 */
function draw(canvas) {
    let context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (entities.player.alive) {
        if (killedEnemies < OBJECTIVE) {
            entities.player.draw();
            entities.enemies.forEach(e => e.draw());
            entities.projectiles.forEach(p => p.draw());
        } else {
            context.fillStyle = 'orange';
            context.textAlign = 'center';
            context.font = 'normal 40px sans-serif';
            context.fillText("Victoire !", canvas.width / 2, canvas.height / 2);
        }
    } else {
        context.fillStyle = 'red';
        context.textAlign = 'center';
        context.font = 'normal 40px sans-serif';
        context.fillText("Game over", canvas.width / 2, canvas.height / 2);
    }

    if (debugging) {
        context.fillStyle = 'green';
        context.font = 'normal 10px sans-serif';
        context.textAlign = 'left';

        context.fillText("FPS: " + Math.round(1 / delta), 10, 20);
        context.fillText("Avg gap: " + delta + "s", 10, 30);
        context.fillText("Kills: " + killedEnemies, 10, 150);
        context.fillText("E: " + (entities.enemies.length + entities.projectiles.length + 1), 10, canvas.height - 10);

        context.fillText('Up: ' + keys.ArrowUp, 10, 50);
        context.fillText('Left: ' + keys.ArrowLeft, 10, 60);
        context.fillText('Down: ' + keys.ArrowDown, 10, 70);
        context.fillText('Right: ' + keys.ArrowRight, 10, 80);
    }
}

/**
 * Met à jour toutes les entités du jeu. (Position, vitesse, état, ...)
 */
function update(delta) {
    entities.player.update(delta);
    entities.enemies.forEach(e => {
        if (e.alive) e.update(delta);
        else {
            killedEnemies++;
            entities.enemies.splice(entities.enemies.indexOf(e), 1);
        }
    });
    entities.projectiles.forEach(p => {
        if (p.alive) p.update(delta);
        else entities.projectiles.splice(entities.projectiles.indexOf(p), 1);
    });
}

/**
 * Boucle principale.
 */
function gameLoop(canvas) {
    let date = new Date();

    delta = (date.getTime() - lastTime) / 1000;
    lastTime = date.getTime();

    if (entities.player.alive && killedEnemies < OBJECTIVE) update(delta);

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
    drawElement(entity.context, 'red', false, 1, () => {
        entity.context.moveTo(entity.x - entity.leftOffset, entity.y - entity.topOffset);
        entity.context.lineTo(entity.x + entity.rightOffset, entity.y - entity.topOffset);
        entity.context.lineTo(entity.x + entity.rightOffset, entity.y + entity.bottomOffset);
        entity.context.lineTo(entity.x - entity.leftOffset, entity.y + entity.bottomOffset);
        entity.context.lineTo(entity.x - entity.leftOffset, entity.y - entity.topOffset);
    });
}

/**
 * Déclenche une vague de 30 vaisseaux ennemis.
 */
function spawnWave(canvas) {
    if (waves === MAX_WAVES) return;
    waves++;

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 10; j++) {
            entities.enemies.push(
                new Enemy(canvas.getContext('2d'), canvas.width * (j + 1) / 11, -canvas.height * (i + 1) / 11, ENEMY_SIZE / 2)
            );
        }
    }
}

class Player {

    context;
    x;
    y;
    radius;
    rotation;

    alive = true;

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

        this.setOffsets();
    }

    draw() {
        drawPolygon(this.context, this.x, this.y, 'white', 2, this.sides, this.radius, this.rotation);
        if (debugging) drawHitBox(this);
    }

    update(delta) {

        entities.projectiles.forEach(p => {
            if (this.x - this.leftOffset <= p.x + p.rightOffset && p.x + p.rightOffset <= this.x + this.rightOffset &&
                this.y - this.topOffset <= p.y - p.topOffset && p.y - p.topOffset <= this.y + this.bottomOffset) {
                this.alive = false;
                p.alive = false;
            }

            if (this.x - this.leftOffset <= p.x - p.leftOffset && p.x - p.leftOffset <= this.x + this.rightOffset &&
                this.y - this.topOffset <= p.y - p.topOffset && p.y - p.topOffset <= this.y + this.bottomOffset) {
                this.alive = false;
                p.alive = false;
            }

            if (this.x - this.leftOffset <= p.x + p.rightOffset && p.x + p.rightOffset <= this.x + this.rightOffset &&
                this.y - this.topOffset <= p.y + p.bottomOffset && p.y + p.bottomOffset <= this.y + this.bottomOffset) {
                this.alive = false;
                p.alive = false;
            }

            if (this.x - this.leftOffset <= p.x - p.leftOffset && p.x - p.leftOffset <= this.x + this.rightOffset &&
                this.y - this.topOffset <= p.y + p.bottomOffset && p.y + p.bottomOffset <= this.y + this.bottomOffset) {
                this.alive = false;
                p.alive = false;
            }
        });

        entities.enemies.forEach(e => {
            if (this.x - this.leftOffset <= e.x + e.rightOffset && e.x + e.rightOffset <= this.x + this.rightOffset &&
                this.y - this.topOffset <= e.y - e.topOffset && e.y - e.topOffset <= this.y + this.bottomOffset)
                this.alive = false;

            if (this.x - this.leftOffset <= e.x - e.leftOffset && e.x - e.leftOffset <= this.x + this.rightOffset &&
                this.y - this.topOffset <= e.y - e.topOffset && e.y - e.topOffset <= this.y + this.bottomOffset)
                this.alive = false;

            if (this.x - this.leftOffset <= e.x + e.rightOffset && e.x + e.rightOffset <= this.x + this.rightOffset &&
                this.y - this.topOffset <= e.y + e.bottomOffset && e.y + e.bottomOffset <= this.y + this.bottomOffset)
                this.alive = false;

            if (this.x - this.leftOffset <= e.x - e.leftOffset && e.x - e.leftOffset <= this.x + this.rightOffset &&
                this.y - this.topOffset <= e.y + e.bottomOffset && e.y + e.bottomOffset <= this.y + this.bottomOffset)
                this.alive = false;
        });

        let width = this.context.canvas.width;
        let height = this.context.canvas.height;

        if (keys.ArrowUp && !keys.ArrowDown && (this.y - this.topOffset) > 0) this.y -= delta * PLAYER_VELOCITY;
        if (keys.ArrowDown && !keys.ArrowUp && (this.y + this.bottomOffset) < height) this.y += delta * PLAYER_VELOCITY;
        if (keys.ArrowLeft && !keys.ArrowRight && (this.x - this.leftOffset) > 0) this.x -= delta * PLAYER_VELOCITY;
        if (keys.ArrowRight && !keys.ArrowLeft && (this.x + this.rightOffset) < width) this.x += delta * PLAYER_VELOCITY;
    }

    setOffsets() {
        this.topOffset = 0;
        this.bottomOffset = 0;
        this.rightOffset = 0;
        this.leftOffset = 0;

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

    shoot() {
        entities.projectiles.push(
            new Projectile(this.context, this.x, this.y - this.topOffset - PROJECTILE_HEIGHT, PLAYER_VELOCITY)
        );
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
    alive = true;

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

        this.xVelocity = this.x < this.context.canvas.width / 2 ? DEFAULT_X_VELOCITY : -DEFAULT_X_VELOCITY;
        this.yVelocity = DEFAULT_Y_VELOCITY;
    }

    draw() {
        drawPolygon(this.context, this.x, this.y, 'green', 2, this.sides, ENEMY_SIZE / 2, this.rotation);
        if (debugging) drawHitBox(this);
    }

    update(delta) {
        if (this.previousRotation !== null && this.previousRotation !== this.rotation) {
            this.setOffsets();
            this.previousRotation = this.rotation;
        }

        entities.projectiles.forEach(p => {
            if (this.x - this.leftOffset <= p.x + p.rightOffset && p.x + p.rightOffset <= this.x + this.rightOffset &&
                this.y - this.topOffset <= p.y - p.topOffset && p.y - p.topOffset <= this.y + this.bottomOffset) {
                this.alive = false;
                p.alive = false;
            }

            if (this.x - this.leftOffset <= p.x - p.leftOffset && p.x - p.leftOffset <= this.x + this.rightOffset &&
                this.y - this.topOffset <= p.y - p.topOffset && p.y - p.topOffset <= this.y + this.bottomOffset) {
                this.alive = false;
                p.alive = false;
            }

            if (this.x - this.leftOffset <= p.x + p.rightOffset && p.x + p.rightOffset <= this.x + this.rightOffset &&
                this.y - this.topOffset <= p.y + p.bottomOffset && p.y + p.bottomOffset <= this.y + this.bottomOffset) {
                this.alive = false;
                p.alive = false;
            }

            if (this.x - this.leftOffset <= p.x - p.leftOffset && p.x - p.leftOffset <= this.x + this.rightOffset &&
                this.y - this.topOffset <= p.y + p.bottomOffset && p.y + p.bottomOffset <= this.y + this.bottomOffset) {
                this.alive = false;
                p.alive = false;
            }
        });

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

        this.rotation = Math.atan(this.yVelocity / this.xVelocity) + Math.PI / 2;
        if (this.xVelocity < 0) this.rotation += Math.PI;
    }

    setOffsets() {
        this.topOffset = 0;
        this.bottomOffset = 0;
        this.rightOffset = 0;
        this.leftOffset = 0;

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

}

class Projectile {

    context;
    x;
    y;
    velocity;

    traveledDistance = 0;
    alive = true;

    leftOffset = PROJECTILE_WIDTH / 2;
    rightOffset = PROJECTILE_WIDTH / 2;
    bottomOffset = PROJECTILE_HEIGHT / 2;
    topOffset = PROJECTILE_HEIGHT / 2;

    constructor(context, x, y, velocity) {
        this.context = context;
        this.x = x;
        this.y = y;
        this.velocity = velocity;
    }

    draw() {
        if (!this.alive) return;
        drawElement(this.context, 'white', true, 1, () => {
            this.context.moveTo(this.x - this.leftOffset, this.y - this.topOffset);
            this.context.lineTo(this.x + this.leftOffset, this.y - this.topOffset);
            this.context.lineTo(this.x + this.rightOffset, this.y + this.bottomOffset);
            this.context.lineTo(this.x - this.leftOffset, this.y + this.bottomOffset);
            this.context.lineTo(this.x - this.leftOffset, this.y - this.topOffset);
        });
        if (debugging) drawHitBox(this);
    }

    update(delta) {
        if (!this.alive || this.y + this.bottomOffset <= 0 || this.traveledDistance >= this.context.canvas.height / 2) {
            this.alive = false;
        }

        this.velocity *= .99;
        this.y -= delta * this.velocity;
        this.traveledDistance += delta * this.velocity;
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

    spawnWave(CANVAS);

    window.setInterval(() => gameLoop(CANVAS), 1000 / FRAMERATE);
    window.setInterval(() => spawnWave(CANVAS), 5 * 1000);
    window.onkeydown = function (e) {
        if (e.key in keys) keys[e.key] = true;
        else switch (e.key.toLowerCase()) {
            case 'i':
                debugging = !debugging;
                break;
            case ' ':
                entities.player.shoot();
                break;
        }
    };
    window.onkeyup = function (e) {
        if (e.key in keys) keys[e.key] = false;
    };

    entities.player = new Player(CANVAS.getContext('2d'), CANVAS.width / 2, CANVAS.height * 5 / 6, PLAYER_SIZE / 2);


};
