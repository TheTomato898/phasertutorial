import Phaser from '../lib/phaser.js';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { ASSET_KEYS } from '../common/assets.js';

const textConfig = {
  fontSize: '40px',
  color: '#fff',
  stroke: '#FF5F1F',
  strokeThickness: 2,
};

const fallingObjectTypes = {
  basic: {
    'gun': 0,
    'knife': 0,
    'e-stick': 0,
    'microchip': 0,
    'solar-panel': 0,
    'key-card': 0,
    'data-chip': 0,
    'usb-drive': 0,
    'goggles': 0,
    'walkie-talkie': 0,
    'watch': 0,
    'tablet': 0,
    'box': 0,
    'nre': 0,
    'can': 0,
    'bottle': 0,
    'oxygen-cylinder': 0,
    'gas-mask': 0,
    'glove': 0,
    'boot': 0,
    'backpack': 0,
    'toolbox': 0,
    'drone': 0,
    'coil': 0,
    'circuit-board': 0,
    'control-board': 0,
    'memory-module': 0,
    'spray-can': 0,
    'keys': 0,
    'radio': 0,
    'combat-helmet': 0,
    'combat-vest': 0,
    'assault-helmet': 0,
    'scrap': 0,
    'reactor-core': 0,
  },
  heal: {
    'heal-syringe': 0,
    'medikit': 0,
  },
  powerUp: {
    'power-cell': 0,
    'usb-drive': 0,
    'laser': 0,
    'energy-grenade': 0,
    'light-grenade': 0,
  },
  damage: {
    'coin-chest': 0,
    'credit-card': 0,
    'coin-crate': 0,
  },
}

export class GameScene extends Phaser.Scene {
  #cursorKeys;
  #player;
  #playerSpeed;
  #fallingObjectFrames;
  #fallingObjects;
  #fallingObjectSpeed;
  #score;
  #scoreTextGameObject;
  #misses;
  #maxMisses;
  #isGameOver;
  #timerEvent;
  #livesTextGameObject;
  #fallingObjectsType;

  constructor() {
    super({
      key: SCENE_KEYS.GAME_SCENE,
    });
  }

  init() {
    this.#playerSpeed = 800;
    this.#fallingObjectSpeed = 400;
    this.#score = 0;
    this.#misses = 0;
    this.#maxMisses = 3;
    this.#isGameOver = false;
  }

  /**
   * @public
   * Tied to the Phaser Scene lifecycle. Will run one time after the PRELOAD
   * logic is finished. Runs each time the Phaser Scene restarts.
   * @returns {void}
   */
  create() {
    const { width, height } = this.scale;
    //add game background
    this.add.image(width / 2, height / 2, ASSET_KEYS.BACKGROUND);
    //add player
    this.#player = this.add
      .image(width / 2, height + height / 25, ASSET_KEYS.JAR)
      .setDepth(1)
      .setScale(0.9);
    //add keyboard support
    this.#cursorKeys = this.input.keyboard.createCursorKeys();

    this.#fallingObjects = [];

    this.#fallingObjectFrames = Object.keys(this.textures.get(ASSET_KEYS.OBJECTS).frames).filter(
      (name) => name !== '__BASE',
    );

    this.#timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.#spawnFallingObject,
      callbackScope: this,
      loop: true,
    });

    const scoreTextPrefix = (this.#scoreTextGameObject = this.add.text(10, 10, 'Score:', textConfig));
    this.#scoreTextGameObject = this.add.text(
      scoreTextPrefix.x + scoreTextPrefix.width,
      scoreTextPrefix.y,
      `${this.#score}`,
      textConfig,
    );

    const livesTextPrefix = (this.#livesTextGameObject = this.add.text(10, 60, 'Lives:', textConfig));
    this.#livesTextGameObject = this.add.text(
      livesTextPrefix.x + livesTextPrefix.width,
      livesTextPrefix.y,
      `${this.#maxMisses - this.#misses}`,
      textConfig,
    );
  }

  update(time, delta) {
    if (this.#isGameOver) {
      return;
    }
    //allow player to move
    const moveStep = this.#playerSpeed * (delta / 1000);
    if (this.#cursorKeys.left.isDown) {
      this.#player.x -= moveStep;
    } else if (this.#cursorKeys.right.isDown) {
      this.#player.x += moveStep;
    }

    //screen border
    if (this.#player.x - this.#player.displayWidth / 2 < 0) {
      this.#player.x = this.#player.displayWidth / 2;
    } else if (this.#player.x + this.#player.displayWidth / 2 > this.scale.width) {
      this.#player.x = this.scale.width - this.#player.displayWidth / 2;
    }
    //move the objects down the screen
    for (let i = this.#fallingObjects.length - 1; i >= 0; i--) {
      const obj = this.#fallingObjects[i];
      obj.y += this.#fallingObjectSpeed * (delta / 1000);
      //collisions
      const overlapPoints = Phaser.Geom.Intersects.GetRectangleToRectangle(this.#player.getBounds(), obj.getBounds());
      if (overlapPoints.length > 0) {
        obj.destroy();
        this.#fallingObjects.splice(i, 1);
        this.#score += 10;
        this.#scoreTextGameObject.setText(`${this.#score}`);
      }

      //remove objects when they are off screen
      if (obj.y > this.scale.height) {
        obj.destroy();
        this.#fallingObjects.splice(i, 1);
        this.#misses += 1;
        this.#livesTextGameObject.setText(`${this.#maxMisses - this.#misses}`);
      }
    }

    if (this.#misses >= this.#maxMisses) {
      this.#handleGameOver();
    }
  }

  #spawnFallingObject() {
    const randomFrame = Phaser.Utils.Array.GetRandom(this.#fallingObjectFrames);
    const obj = this.add
      .image(Phaser.Math.RND.between(50, this.scale.width - 50), 0, ASSET_KEYS.OBJECTS, randomFrame)
      .setScale(0.6);
    this.#fallingObjects.push(obj);
  }

  #handleGameOver() {
    this.#isGameOver = true;
    this.#timerEvent.remove();
    this.add.text(this.scale.width / 2, this.scale.height / 2, 'Game Over', textConfig).setOrigin(0.5);
    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => {
      this.scene.restart();
    });
  }
}
