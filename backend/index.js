import { WebSocketServer } from "ws"

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
