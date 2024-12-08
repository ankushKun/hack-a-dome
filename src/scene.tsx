import Phaser from "phaser";
import { useEffect } from "react";
// import mapJson from "./map/map.json"
// import mapImg from "./map/tileset.png"
import { GridEngine } from "grid-engine";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";
import { Wallet, WalletDefault } from "@coinbase/onchainkit/wallet";
import { w3cwebsocket } from "websocket"

class Scene1 extends Phaser.Scene {

  sprite: Phaser.GameObjects.Sprite | null = null;
  tileWidth: number | undefined;
  tileHeight: number | undefined;
  gridEngine: any;

  positions: any = {}
  ws: w3cwebsocket | null = null


  preload() {
    this.load.setBaseURL(window.location.origin + "/hack-a-dome/");

    this.load.tilemapTiledJSON('main-map', '/map/map.json');
    this.load.image('tileset', '/map/tileset.png');

    this.load.image('map', '/map.png');
    this.load.image('1', '/1.png');
    this.load.image('2', '/2.png');
    this.load.image('3', '/3.png');
    this.load.image('cat', '/cat.png');

    this.ws = new w3cwebsocket("ws://localhost:8080")

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data as string) as { [address: string]: { x: number, y: number } }
      console.log(data)

      for (const [address, { x, y }] of Object.entries(data)) {
        if (address === window.address) continue
        if (!this.positions[address]) {
          const sprite = this.physics.add.sprite(x, y, '1');
          // sprite always on top
          sprite.setDepth(50);
          sprite.setScale(0.03, 0.03);
          // add a text on top of the user and make it always follow user
          sprite.setInteractive();
          sprite.on('pointerdown', () => {
            alert(address)
          });

          this.positions[address] = sprite
        } else {
          this.positions[address].x = x
          this.positions[address].y = y
        }
      }
    }
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
    this.cameras.main.setZoom(1);
    // this.cameras.main.centerOn(map.widthInPixels / 2, map.heightInPixels / 2);
    // centre on the player
    this.cameras.main.startFollow(heroSprite);

    this.gridEngine.create(map, gridEngineConfig);


    // spawn npcs and run a function when they are clicked
    const catSprite = this.physics.add.sprite(20, 20, 'cat');
    catSprite.setScale(0.03, 0.03);
    // this.gridEngine.addCharacter('cat', catSprite, { x: 30, y: 20 });

    // on cat click
    catSprite.setInteractive();
    catSprite.on('pointerdown', () => {
      alert("meow")
    });

    // const npc1 = this.physics.add.sprite(69, 130, '2');
    // npc1.setScale(0.03, 0.03);
    // npc1.setDepth(50);

    // // on npc1 click
    // npc1.setInteractive();
    // npc1.on('pointerdown', () => {
    //   alert("hello")
    // });

    function spawnNpc(x: number, y: number) {
      const npc = this.physics.add.sprite(x, y, '3');
      npc.setScale(0.13, 0.13);
      npc.setDepth(50);

      // on npc1 click
      npc.setInteractive();
      npc.on('pointerdown', () => {
        alert("hello")
      });
    }

    spawnNpc.bind(this)(69, 130)
    spawnNpc.bind(this)(69, 330)
    spawnNpc.bind(this)(69, 555)
    spawnNpc.bind(this)(69, 755)
    spawnNpc.bind(this)(69, 955)

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

    const characters = this.gridEngine.config.characters

    const { x, y } = characters.find((c: any) => c.id === 'hero').sprite;
    // console.log(x, y);

    setTimeout(() => {
      if (Date.now() - window.lastTime < 100) return
      //make an api call to update the position of the player
      // console.log(x, y);
      this.ws.send(JSON.stringify({ id: window.address, x, y }))
      window.lastTime = Date.now()
    }, 25)
  }
}

export default function Scene() {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount()

  useEffect(() => {
    window.address = address
  }, [address])

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
    if (!isConnected) navigate("/")
  }, [isConnected])

  useEffect(() => {
    const game = new Phaser.Game(config);

    return () => game.destroy(true)
  }, [])

  return <div className="flex flex-col items-end">
    <div className="h-10 flex flex-col items-end bg-[#a08c64] absolute top-0 left-0 right-0 z-20">
      <WalletDefault />
    </div>
    <div id="game-contatiner" className="absolute top-[40px] !h-[calc(80vh-40px)]"></div>
  </div>
}