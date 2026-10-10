import Phaser from '../lib/phaser.js';
import { SCENE_KEYS } from '../common/scene-keys.js';
import { ASSET_KEYS } from '../common/assets.js';

export class GameScene extends Phaser.Scene {
  #cursorKeys;
  #player;
  #playerSpeed;
  #fallingObjectFrames;
  #fallingObjects;
  #fallingObjectSpeed;
  #score;
  #scoreTextGameObject;

  constructor() {
    super({
      key: SCENE_KEYS.GAME_SCENE,
    });
  }

  init() {
    this.#playerSpeed = 500;
    this.#fallingObjectSpeed = 200;
    this.#score = 0;
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
    this.#player = this.add.image(width / 2, height, ASSET_KEYS.JAR).setDepth(1);
    //add keyboard support
    this.#cursorKeys = this.input.keyboard.createCursorKeys();

    this.#fallingObjects = [];

    this.#fallingObjectFrames = Object.keys(this.textures.get(ASSET_KEYS.OBJECTS).frames).filter(
      (name) => name !== '__Base',
    );

    this.time.addEvent({
      delay: 1000,
      callback: this.#spawnFallingObject,
      callbackScope: this,
      loop: true,
    });

    const textConfig = {
      fontSize: '40px',
      color: '#fff700',
      stroke: '#000000',
      strokeThickness: 6,
    };
    const scoreTextPrefix = (this.#scoreTextGameObject = this.add.text(10, 10, 'Score:', textConfig));
    this.#scoreTextGameObject = this.add.text(
      scoreTextPrefix.x + scoreTextPrefix.width,
      scoreTextPrefix.y,
      `${this.#score}`,
      textConfig,
    );
  }

  update(time, delta) {
    //allow player to move
    const moveStep = this.#playerSpeed * (delta / 1000);
    if (this.#cursorKeys.left.isDown) {
      this.#player.x -= moveStep;
    } else if (this.#cursorKeys.right.isDown) {
      this.#player.x += moveStep;
    }

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
      }
    }
  }

  #spawnFallingObject() {
    const randomFrame = Phaser.Utils.Array.GetRandom(this.#fallingObjectFrames);
    const obj = this.add
      .image(Phaser.Math.RND.between(50, this.scale.width - 50), 0, ASSET_KEYS.OBJECTS, randomFrame)
      .setScale(0.75);
    this.#fallingObjects.push(obj);
  }
}
