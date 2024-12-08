import { WebSocketServer } from "ws"
import express from "express"
import { AccessToken, Role } from "@huddle01/server-sdk/auth"
import cors from "cors"

const wss = new WebSocketServer({ port: 8080 })

const positions = {}

wss.on("connection", ws => {
    ws.on("message", message => {
        const { id, x, y } = JSON.parse(message)
        positions[id] = { x, y }
        const positionsString = JSON.stringify(positions)
        ws.send(positionsString)
    })
    console.log("Client connected")
})

console.log("Server started on port 8080")

const app = express()
app.use(cors())
app.use(express.json())

app.post("/generate-token", async (req, res) => {
    try {
        // console.log(req.body)
        // const { roomId } = req.body;
        // console.log("roomid ", roomId)
        // // Validate required parameters



        const roomId = req.body.roomId;

        if (!roomId) {
            return res.status(400).json({ error: "Room ID is required" });
        }

        // Generate token using Huddle01 method
        const accessToken = new AccessToken({
            apiKey: "ak_pmc48yPJRR9453iM",
            roomId: roomId,
            role: Role.HOST,
            permissions: {
                admin: true,
                canConsume: true,
                canProduce: true,
                canProduceSources: {
                    cam: true,
                    mic: true,
                    screen: true,
                },
                canRecvData: true,
                canSendData: true,
                canUpdateMetadata: true,
            },
        });
        console.log(accessToken)
        const token = await accessToken.toJwt();
        console.log(token)
        return res.status(200).json(token)

    } catch (error) {
        console.error("Token generation error:", error);
        res
            .status(500)
            .json({ error: "Failed to generate token", details: error.message });
    }
});

app.listen(3000, () => {
    console.log("Server started on port 3000")
})