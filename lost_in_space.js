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

const OBJECTIVE = 300;

let debugging = false;
let killedEnemies = 0;

let entities = {
    "enemies": [],
    "projectiles": [],
    "meteorites": [],
    "powerUps": []
};
let keys = {
    "ArrowUp": false,
    "ArrowDown": false,
    "ArrowLeft": false,
    "ArrowRight": false
};

let lastTime = new Date().getTime();
let delta = 0;

/*
INFORMATIONS SUR LE PROGRAMME

Le joueur se déplace via les flèches directionnelles.
Le joueur peut tirer avec la barre espace.

Le but est tuer les 10 vagues de 30 ennemis sans mourir.

Des météorites apparaissent pendant les vagues et dévastent tout
sur leur passage. Il est impossible de les détruire.

Heurter un missile est mortel.
Heurter un ennemi est mortel.
Heurter une météorite est mortel.

L'appui sur la touche I active/désactive l'affichage du debug.
 */

/**
 * Dessine toutes les entités du jeu.
 * @param canvas Canvas du jeu.
 */
function draw(canvas) {
    let context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (entities.player.alive) {
        if (killedEnemies < OBJECTIVE) {
            entities.player.draw();
            entities.enemies.forEach((e) => e.draw());
            entities.projectiles.forEach((p) => p.draw());
            entities.meteorites.forEach((m) => m.draw());
            entities.powerUps.forEach((p) => p.draw())
        } else {
            context.fillStyle = "orange";
            context.textAlign = "center";
            context.font = "normal 40px sans-serif";
            context.fillText("Victoire !", canvas.width / 2, canvas.height / 2);
        }
    } else {
        context.fillStyle = "red";
        context.textAlign = "center";
        context.font = "normal 40px sans-serif";
        context.fillText("Game over", canvas.width / 2, canvas.height / 2);
    }

    if (debugging) {
        context.fillStyle = "green";
        context.font = "normal 10px sans-serif";
        context.textAlign = "left";

        context.fillText("FPS: " + Math.round(1 / delta), 10, 20);
        context.fillText("Avg gap: " + delta + "s", 10, 30);
        context.fillText("Kills: " + killedEnemies, 10, 150);
        context.fillText("E: " + (entities.enemies.length + entities.projectiles.length + entities.meteorites.length + 1), 10, canvas.height - 10);

        context.fillText("Up: " + keys.ArrowUp, 10, 50);
        context.fillText("Left: " + keys.ArrowLeft, 10, 60);
        context.fillText("Down: " + keys.ArrowDown, 10, 70);
        context.fillText("Right: " + keys.ArrowRight, 10, 80);
    }
}

/**
 * Met à jour toutes les entités du jeu. (Position, vitesse, état, ...)
 */
function update(delta) {
    entities.player.update(delta);
    entities.enemies.forEach((e) => {
        if (e.alive) e.update(delta);
        else {
            killedEnemies++;
            entities.enemies.splice(entities.enemies.indexOf(e), 1);
        }
    });
    entities.projectiles.forEach((p) => {
        if (p.alive) p.update(delta);
        else entities.projectiles.splice(entities.projectiles.indexOf(p), 1);
    });
    entities.meteorites.forEach((m) => {
        if (m.alive) m.update(delta);
        else entities.meteorites.splice(entities.meteorites.indexOf(m), 1);
    });
    entities.powerUps.forEach((p) => {
        if (!p.alive) entities.powerUps.splice(entities.powerUps.indexOf(p), 1);
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
 * @param style Couleur de l"élément.
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
    });
}

/**
 * Dessine la hit box d"une entité.
 * @param entity Entité.
 */
function drawHitBox(entity) {
    drawElement(entity.context, "red", false, 1, () => {
        entity.context.moveTo(entity.x - entity.leftOffset, entity.y - entity.topOffset);
        entity.context.lineTo(entity.x + entity.rightOffset, entity.y - entity.topOffset);
        entity.context.lineTo(entity.x + entity.rightOffset, entity.y + entity.bottomOffset);
        entity.context.lineTo(entity.x - entity.leftOffset, entity.y + entity.bottomOffset);
        entity.context.lineTo(entity.x - entity.leftOffset, entity.y - entity.topOffset);
    });
}

/**
 * Calcule les marges gauche, droite, haut et bas afin d'affiner la hit box.
 * @param entity Entité.
 */
function setOffsets(entity) {
    entity.topOffset = 0;
    entity.bottomOffset = 0;
    entity.rightOffset = 0;
    entity.leftOffset = 0;

    for (let i = 0; i < entity.sides; i++) {
        let angle = i * 2 * Math.PI / entity.sides + Math.PI / 2 + entity.rotation;

        if (entity.x - Math.cos(angle) * entity.radius < entity.x - entity.leftOffset)
            entity.leftOffset = Math.cos(angle) * entity.radius;

        if (entity.x - Math.cos(angle) * entity.radius > entity.x + entity.rightOffset)
            entity.rightOffset = Math.abs(Math.cos(angle)) * entity.radius;

        if (entity.y - Math.sin(angle) * entity.radius < entity.y - entity.topOffset)
            entity.topOffset = Math.sin(angle) * entity.radius;

        if (entity.y - Math.sin(angle) * entity.radius > entity.y + entity.bottomOffset)
            entity.bottomOffset = Math.abs(Math.sin(angle)) * entity.radius;
    }
}

/**
 * Détecte la collision entre deux entités.
 * @param entity1 Première entité.
 * @param entity2 Deuxième entité.
 */
function detectCollision(entity1, entity2) {

    let upperRight = entity1.x - entity1.leftOffset <= entity2.x + entity2.rightOffset &&
        entity2.x + entity2.rightOffset <= entity1.x + entity1.rightOffset &&
        entity1.y - entity1.topOffset <= entity2.y - entity2.topOffset &&
        entity2.y - entity2.topOffset <= entity1.y + entity1.bottomOffset;

    let upperLeft = entity1.x - entity1.leftOffset <= entity2.x - entity2.leftOffset &&
        entity2.x - entity2.leftOffset <= entity1.x + entity1.rightOffset &&
        entity1.y - entity1.topOffset <= entity2.y - entity2.topOffset &&
        entity2.y - entity2.topOffset <= entity1.y + entity1.bottomOffset;

    let lowerRight = entity1.x - entity1.leftOffset <= entity2.x + entity2.rightOffset &&
        entity2.x + entity2.rightOffset <= entity1.x + entity1.rightOffset &&
        entity1.y - entity1.topOffset <= entity2.y + entity2.bottomOffset &&
        entity2.y + entity2.bottomOffset <= entity1.y + entity1.bottomOffset;

    let lowerLeft = entity1.x - entity1.leftOffset <= entity2.x - entity2.leftOffset &&
        entity2.x - entity2.leftOffset <= entity1.x + entity1.rightOffset &&
        entity1.y - entity1.topOffset <= entity2.y + entity2.bottomOffset &&
        entity2.y + entity2.bottomOffset <= entity1.y + entity1.bottomOffset;

    return upperLeft || upperRight || lowerLeft || lowerRight;
}

class SpeedPowerUp {

    constructor() {
        this.multiplier = 1;
        this.timeout = 0;
    }

    activate(timeout) {
        this.multiplier = 2;
        this.timeout += timeout;
    }

    deactivate() {
        this.multiplier = 1;
        this.timeout = 0;
    }

    apply(speed) {
        return speed * this.multiplier;
    }

    draw(context, x, y) {
        drawElement(context, "orange", false, 3, () => {
            context.arc(x, y, 14, 0, 2 * Math.PI)
        });
        drawPolygon(context, x - 4, y, "yellow", 1, 3, 5, Math.PI / 2);
        drawPolygon(context, x + 3, y, "yellow", 1, 3, 5, Math.PI / 2);
    }

    setHitBox(entity) {
        entity.topOffset = (14 + 3);
        entity.bottomOffset = (14 + 3);
        entity.leftOffset = (14 + 3);
        entity.rightOffset = (14 + 3);
    }

    update(delta) {
        this.timeout -= delta;
        if (this.timeout <= 0) this.deactivate();
    }

}

class MultiShootPowerUp {

    constructor(context) {
        this.timeout = 0;
        this.context = context;
    }

    activate(timeout) {
        this.timeout += timeout;
    }

    deactivate() {
        this.timeout = 0;
    }

    apply(x, y) {
        let speed = entities.player.powerUpComponent.speedUp.apply(PLAYER_VELOCITY);

        if (this.timeout > 0) {
            return [
                new Projectile(this.context, x - PLAYER_SIZE / 2, y, speed),
                new Projectile(this.context, x + PLAYER_SIZE / 2, y, speed)
            ]
        }
        return [new Projectile(this.context, x, y, speed)];
    }

    draw(context, x, y) {
        drawElement(context, "green", false, 3, () => {
            context.arc(x, y, 14, 0, 2 * Math.PI)
        });
        drawElement(context, "teal", true, 1, () => {
            context.moveTo(x - 2, y - 8);
            context.lineTo(x + 2, y - 8);
            context.lineTo(x + 2, y + 8);
            context.lineTo(x - 2, y + 8);
            context.lineTo(x - 2, y - 8);
        });
        drawElement(context, "teal", true, 1, () => {
            context.moveTo(x - 8, y - 2);
            context.lineTo(x + 8, y - 2);
            context.lineTo(x + 8, y + 2);
            context.lineTo(x - 8, y + 2);
            context.lineTo(x - 8, y - 2);
        });
    }

    setHitBox(entity) {
        entity.topOffset = (14 + 3);
        entity.bottomOffset = (14 + 3);
        entity.leftOffset = (14 + 3);
        entity.rightOffset = (14 + 3);
    }

    update(delta) {
        this.timeout -= delta;
        if (this.timeout <= 0) this.deactivate();
    }

}

class PowerUpComponent {

    constructor(context) {
        this.speedUp = new SpeedPowerUp();
        this.multiShoot = new MultiShootPowerUp(context)
    }

    update(delta) {
        this.speedUp.update(delta);
        this.multiShoot.update(delta);
    }

}

class Entity {

    constructor(context, x, y) {
        this.context = context;
        this.x = x;
        this.y = y;

        this.alive = true;

        this.leftOffset = 0;
        this.rightOffset = 0;
        this.topOffset = 0;
        this.bottomOffset = 0;
    }

}

class Projectile extends Entity {

    constructor(context, x, y, velocity) {
        super(context, x, y);
        this.velocity = velocity;

        this.traveledDistance = 0;

        this.leftOffset = PROJECTILE_WIDTH / 2;
        this.rightOffset = PROJECTILE_WIDTH / 2;
        this.bottomOffset = PROJECTILE_HEIGHT / 2;
        this.topOffset = PROJECTILE_HEIGHT / 2;
    }

    draw() {
        if (!this.alive) return;
        drawElement(this.context, "white", true, 1, () => {
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

class Player extends Entity {

    constructor(context, x, y, radius, rotation = 0) {
        super(context, x, y);
        this.radius = radius;
        this.rotation = rotation;

        this.sides = 3;
        this.powerUpComponent = new PowerUpComponent(this.context);

        setOffsets(this);
    }

    draw() {
        drawPolygon(this.context, this.x, this.y, "white", 2, this.sides, this.radius, this.rotation);
        if (debugging) drawHitBox(this);
    }

    update(delta) {
        setOffsets(this);

        this.powerUpComponent.update(delta);

        entities.projectiles.forEach((p) => {
            if (detectCollision(this, p)) {
                this.alive = false;
                p.alive = false;
            }
        });

        entities.enemies.forEach((e) => {
            if (detectCollision(this, e)) this.alive = false;
        });

        entities.meteorites.forEach((m) => {
            if (detectCollision(this, m)) this.alive = false;
        });

        entities.powerUps.forEach((p) => {
            if (detectCollision(this, p)) {
                p.use();
            }
        });

        let width = this.context.canvas.width;
        let height = this.context.canvas.height;

        let speed = this.powerUpComponent.speedUp.apply(PLAYER_VELOCITY);

        if (keys.ArrowUp && !keys.ArrowDown && (this.y - this.topOffset) > 0) this.y -= delta * speed;
        if (keys.ArrowDown && !keys.ArrowUp && (this.y + this.bottomOffset) < height) this.y += delta * speed;
        if (keys.ArrowLeft && !keys.ArrowRight && (this.x - this.leftOffset) > 0) this.x -= delta * speed;
        if (keys.ArrowRight && !keys.ArrowLeft && (this.x + this.rightOffset) < width) this.x += delta * speed;
    }

    shoot() {
        if (!this.alive) return;

        this.powerUpComponent.multiShoot.apply(this.x, this.y - this.topOffset - PROJECTILE_HEIGHT).forEach(p => {
            entities.projectiles.push(p);
        });
    }

}

class Enemy extends Entity {

    constructor(context, x, y, radius, rotation = 0) {
        super(context, x, y);
        this.radius = radius;
        this.rotation = rotation;

        this.xVelocity = this.x < this.context.canvas.width / 2 ? DEFAULT_X_VELOCITY : -DEFAULT_X_VELOCITY;
        this.yVelocity = DEFAULT_Y_VELOCITY;

        this.sides = 3;
    }

    draw() {
        drawPolygon(this.context, this.x, this.y, "green", 2, this.sides, ENEMY_SIZE / 2, this.rotation);
        if (debugging) drawHitBox(this);
    }

    update(delta) {
        if (this.previousRotation !== null && this.previousRotation !== this.rotation) {
            setOffsets(this);
            this.previousRotation = this.rotation;
        }

        entities.projectiles.forEach((p) => {
            if (detectCollision(this, p)) {
                this.alive = false;
                p.alive = false;
            }
        });

        entities.meteorites.forEach((m) => {
            if (detectCollision(this, m)) this.alive = false;
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

}

class Meteorite extends Entity {

    constructor(context, x, y, radius, rotation = 0) {
        super(context, x, y);
        this.radius = radius;
        this.rotation = rotation;

        setOffsets(this);

        this.xVelocity = (Math.random() + .5) * (this.x < this.context.canvas.width / 2 ? DEFAULT_X_VELOCITY : -DEFAULT_X_VELOCITY);
        this.yVelocity = (Math.random() + .5) * (this.y < this.context.canvas.height / 2 ? DEFAULT_X_VELOCITY : -DEFAULT_X_VELOCITY);

        this.sides = 7;
    }

    draw() {
        drawPolygon(this.context, this.x, this.y, "gray", 2, this.sides, ENEMY_SIZE / 4, this.rotation);
        if (debugging) drawHitBox(this);
    }

    update(delta) {
        setOffsets(this);

        entities.projectiles.forEach((p) => {
            if (detectCollision(this, p)) p.alive = false;
        });

        if (this.xVelocity < 0) {
            if (this.x + this.rightOffset < 0) this.alive = false;
        } else {
            if (this.x - this.leftOffset > this.context.canvas.width) this.alive = false;
        }
        if (this.yVelocity < 0) {
            if (this.y + this.bottomOffset < 0) this.alive = false;
        } else {
            if (this.y - this.topOffset > this.context.canvas.height) this.alive = false;
        }

        this.x += delta * this.xVelocity;
        this.y += delta * this.yVelocity;
        this.rotation += .1;
    }

}

class PowerUp extends Entity {

    constructor(context, x, y, powerUp, time) {
        super(context, x, y);
        this.powerUp = powerUp;
        this.time = time;

        powerUp.setHitBox(this);
    }

    draw() {
        this.powerUp.draw(this.context, this.x, this.y);

        if (debugging) drawHitBox(this);
    }

    use() {
        this.alive = false;
        this.powerUp.activate(this.time);
    }

}

/**
 * Déclenche une vague de 30 vaisseaux ennemis et 10 météorites.
 */
function spawnWave(canvas) {

    if (!entities.player.alive) return;

    if (killedEnemies >= OBJECTIVE) return;

    let x = canvas.width * Math.random();
    let y = canvas.height * Math.random();

    if (Math.random() > .7) entities.powerUps.push(new PowerUp(
        canvas.getContext("2d"),
        x,
        y,
        entities.player.powerUpComponent[Math.random() > .5 ? "speedUp" : "multiShoot"],
        15
    ));

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 10; j++) {
            if (i < 1 && j % 2 === 0)
                entities.meteorites.push(new Meteorite(canvas.getContext("2d"),
                    canvas.width / 2 + (Math.random() >= .5 ? 1 : -1) * canvas.width,
                    canvas.height / 2 + (Math.random() >= .5 ? 1 : -1) * canvas.height,
                    ENEMY_SIZE / 4));
            entities.enemies.push(
                new Enemy(canvas.getContext("2d"), canvas.width * (j + 1) / 11, -canvas.height * (i + 1) / 11, ENEMY_SIZE / 2)
            );
        }
    }
}

window.onload = function () {

    const CANVAS = document.getElementById("game_area");

    entities.player = new Player(CANVAS.getContext("2d"), CANVAS.width / 2, CANVAS.height * 5 / 6, PLAYER_SIZE / 2);

    spawnWave(CANVAS);

    window.setInterval(() => gameLoop(CANVAS), 1000 / FRAMERATE);
    window.setInterval(() => spawnWave(CANVAS), 5 * 1000);
    window.onkeydown = function (e) {
        if (e.key in keys) keys[e.key] = true;
        else switch (e.key.toLowerCase()) {
            case "i":
                debugging = !debugging;
                break;
            case " ":
                entities.player.shoot();
                break;
        }
    };
    window.onkeyup = function (e) {
        if (e.key in keys) keys[e.key] = false;
    };

};
