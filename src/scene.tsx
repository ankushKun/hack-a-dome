import Phaser from "phaser";
import { useEffect } from "react";
// import mapJson from "./map/map.json"
// import mapImg from "./map/tileset.png"
import { GridEngine } from "grid-engine";

class Scene1 extends Phaser.Scene {

  sprite: Phaser.GameObjects.Sprite | null = null;
  tileWidth: number | undefined;
  tileHeight: number | undefined;
  gridEngine: any;

  preload() {
    this.load.setBaseURL(window.location.origin + "/hack-a-dome/");

    this.load.tilemapTiledJSON('main-map', '/map/map.json');
    this.load.image('tileset', '/map/tileset.png');

    this.load.image('map', '/map.png');
    this.load.image('1', '/1.png');
    this.load.image('2', '/2.png');
    this.load.image('3', '/3.png');
    this.load.image('cat', '/cat.png');
  }

  create() {
    this.tileWidth = 16;
    this.tileHeight = 16;

    const map = this.make.tilemap({ key: 'main-map' });
    const tileset = map.addTilesetImage('tileset', 'tileset');

    map.layers.forEach((_layer, index) => {
      return map.createLayer(index, tileset || '', 0, 0);
    });
    const heroSprite = this.physics.add.sprite(0, 0, '1');
    heroSprite.setScale(0.03, 0.03);
    const gridEngineConfig = {
      characters: [{
        id: 'hero',
        sprite: heroSprite,
        startPosition: { x: 10, y: 10 },
      }],
    };

    // Adjust the camera to fit the entire map
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.setZoom(3);
    // this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
    // centre on the player
    this.cameras.main.startFollow(heroSprite);

    this.gridEngine.create(map, gridEngineConfig);


    // spawn npcs and run a function when they are clicked
    const catSprite = this.physics.add.sprite(40, 40, 'cat');
    catSprite.setScale(0.03, 0.03);
    this.gridEngine.addCharacter('cat', catSprite, { x: 15, y: 15 });
    console.log(this.gridEngine);
  }


  update(_time: number, _delta: number): void {
    // console.log(time, delta);
    const cursors = this.input?.keyboard?.createCursorKeys();

    if (cursors?.left.isDown) {
      this.gridEngine.move('hero', 'left');
    } else if (cursors?.right.isDown) {
      this.gridEngine.move('hero', 'right');
    } else if (cursors?.up.isDown) {
      this.gridEngine.move('hero', 'up');
    } else if (cursors?.down.isDown) {
      this.gridEngine.move('hero', 'down');
    }
  }
}

export default function Scene() {


  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: "game-contatiner",
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
      default: "arcade"
    },
    backgroundColor: "#696969",
    pixelArt: true,
    roundPixels: true,

    input: {
      keyboard: true,
    },
    scene: Scene1,
    plugins: {
      scene: [{
        key: "gridEngine",
        plugin: GridEngine,
        mapping: "gridEngine"
      }]
    }
  }

  useEffect(() => {
    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true)
    }
  }, [])

  return <div id="game-contatiner"></div>
}