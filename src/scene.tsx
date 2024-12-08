import Phaser from "phaser";
import { useEffect } from "react";
// import mapJson from "./map/map.json"
// import mapImg from "./map/tileset.png"
import { GridEngine } from "grid-engine";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";
import { Wallet, WalletDefault } from "@coinbase/onchainkit/wallet";
import { w3cwebsocket } from "websocket"
import toast from "react-hot-toast";
import { useRoom } from "@huddle01/react";
import { useLocalPeer, useLocalVideo, usePeerIds, useLocalAudio } from "@huddle01/react/hooks";
import axios from "axios";
import { Video } from "@huddle01/react/components";
import RemotePeer from "./components/remote-peer";
import { Dock, DockIcon } from "./components/dock";
import { Loader2, MessageCircle, Mic, MicOff, PhoneOff, VideoIcon, VideoOff } from "lucide-react";
// import { createRoom } from "./utils/create-room";
import { TransactionDefault } from "@coinbase/onchainkit/transaction"
import ChatBox from "./components/chatbox";
import * as ethers from "ethers";
import { parseEther } from "ethers/utils"
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { LIT_NETWORK, LIT_RPC, LIT_ABILITY } from "@lit-protocol/constants";
import { createSiweMessage, generateAuthSig, LitActionResource, LitPKPResource } from "@lit-protocol/auth-helpers";


const ROOM_ID = "fqn-lckz-oos"

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

    this.ws = new w3cwebsocket("ws://37.60.238.86:8080")

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data as string) as { [address: string]: { x: number, y: number } }
      // console.log(data)

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
    this.cameras.main.setZoom(2.5);
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
        toast.success("hello")
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

type TPeerMetadata = {
  displayName: string;
};

export default function Scene() {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount()
  const { updateMetadata } = useLocalPeer<TPeerMetadata>();
  const { joinRoom, state } = useRoom({
    onJoin: (room) => {
      console.log('onJoin', room);
      updateMetadata({ displayName: window.address });
    },
    onPeerJoin: (peer) => {
      console.log('onPeerJoin', peer);
    },
  });
  const { enableVideo, isVideoOn, stream, disableVideo } = useLocalVideo();
  const { peerIds } = usePeerIds();
  const { enableAudio, disableAudio, isAudioOn } = useLocalAudio();

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

  const clickContractAddress = '0xaEf14599D048335b91cD6a5bDB454a227F808Cb3';
  const clickContractAbi = [
    {
      inputs: [
        {
          internalType: "address",
          name: "winner",
          type: "address",
        },
      ],
      name: "declareWinner",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "enterRaffle",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "entranceFee",
          type: "uint256",
        },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      name: "Raffle__RaffleNotOpen",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      name: "Raffle__SendMoreToEnterRaffle",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      name: "Raffle__TransferFailed",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      name: "Raffle__WinnerAlreadyDeclared",
      type: "error",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "player",
          type: "address",
        },
      ],
      name: "RaffleEntered",
      type: "event",
    },
    {
      inputs: [],
      name: "resetRaffle",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "startCalculatingWinner",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "winner",
          type: "address",
        },
      ],
      name: "WinnerDeclared",
      type: "event",
    },
    {
      inputs: [],
      name: "getPlayers",
      outputs: [
        {
          internalType: "address payable[]",
          name: "",
          type: "address[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getRaffleState",
      outputs: [
        {
          internalType: "enum Raffle.RaffleState",
          name: "",
          type: "uint8",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getRecentWinner",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getTotalStaked",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalStaked",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ] as const;

  const calls = [
    {
      to: clickContractAddress,
      abi: clickContractAbi,
      method: "enterRaffle",
      args: ["0.0001"]
    }
  ];

  const LIT_ADDRESS = "0xaEf14599D048335b91cD6a5bDB454a227F808Cb3"
  const LIT_ABI = [
    {
      inputs: [
        {
          internalType: "address",
          name: "winner",
          type: "address",
        },
      ],
      name: "declareWinner",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "enterRaffle",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "entranceFee",
          type: "uint256",
        },
      ],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      name: "Raffle__RaffleNotOpen",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      name: "Raffle__SendMoreToEnterRaffle",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      name: "Raffle__TransferFailed",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      name: "Raffle__WinnerAlreadyDeclared",
      type: "error",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "player",
          type: "address",
        },
      ],
      name: "RaffleEntered",
      type: "event",
    },
    {
      inputs: [],
      name: "resetRaffle",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "startCalculatingWinner",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "winner",
          type: "address",
        },
      ],
      name: "WinnerDeclared",
      type: "event",
    },
    {
      inputs: [],
      name: "getPlayers",
      outputs: [
        {
          internalType: "address payable[]",
          name: "",
          type: "address[]",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getRaffleState",
      outputs: [
        {
          internalType: "enum Raffle.RaffleState",
          name: "",
          type: "uint8",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getRecentWinner",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getTotalStaked",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalStaked",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];

  const litNodeClient = new LitJsSdk.LitNodeClient({
    litNetwork: LIT_NETWORK.DatilDev
  });

  return <div className="flex flex-col items-end">
    <div className="h-10 flex flex-row gap-1 p-1 items-center justify-center bg-[#a08c64] absolute top-0 left-0 right-0 z-20">
      <TransactionDefault calls={calls as any} className="w-fit" />
      <button className="bg-[#1e293b] text-white p-2 rounded-md" onClick={async () => {

        litNodeClient.connect();
        await litNodeClient.connect();
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          LIT_ADDRESS,
          LIT_ABI,
          signer
        );
        const transaction = await contract.enterRaffle({
          value: parseEther("0.0001"), // Send the required ETH as msg.value
        });
        console.log(transaction);
      }}>Enter Raffle</button>

      <button className="bg-[#1e293b] text-white p-2 rounded-md" onClick={async () => {
        // const roomid = await createRoom()
        // console.log(roomid)
        // localStorage.setItem("roomid", roomid)
        async function getToken() {
          let data = JSON.stringify({
            "roomId": "ymd-ltjl-zfx"
          });

          let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'http://37.60.238.86:3000/generate-token',
            headers: {
              'Content-Type': 'application/json'
            },
            data: data
          };

          const res = await axios.request(config)

          return res.data
        }

        const token = await getToken();
        console.log(token)
        joinRoom({ roomId: ROOM_ID, token }).then(() => {

        })
      }}>Join Huddle{state == "connecting" && <Loader2 className="animate-spin inline" />}</button>
      <div className="grow"></div>
      <WalletDefault />
      {state == "connected" && <div className="flex-1 p-6 relative top-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Local Video */}
          <div className="relative aspect-video bg-[#1A1C23] rounded-xl overflow-hidden">
            {stream && (
              <> <Video
                stream={stream}
                className="w-full h-full object-cover"
              />
              </>
            )}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                You
              </span>
            </div>
          </div>
          <Dock className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#1A1C23] border border-gray-800 rounded-xl shadow-lg">
            <DockIcon
              // @ts-ignore
              onClick={() => isAudioOn ? disableAudio() : enableAudio()}
              className={isAudioOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"}
            >
              {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </DockIcon>
            <DockIcon
              // @ts-ignore
              onClick={() => isVideoOn ? disableVideo() : enableVideo()}
              className={isVideoOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"}
            >
              {isVideoOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </DockIcon>
            <DockIcon
              // @ts-ignore
              onClick={() => window.location.reload()}
              className={"bg-red-500 hover:bg-red-600"}
            >
              <PhoneOff className="w-5 h-5" />
            </DockIcon>
          </Dock>
          {/* Remote Peers */}
          {peerIds.map((peerId) => (
            <RemotePeer key={peerId} peerId={peerId} />
          ))}
        </div>
      </div>}
      <ChatBox booth="Base Chat" userWalletAddress={window.address} />
    </div>
    <div id="game-contatiner" className="absolute top-[40px] !h-[calc(80vh-40px)]"></div>
  </div>
}