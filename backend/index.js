import { WebSocketServer } from "ws";
import express from "express";
import { AccessToken, Role } from "@huddle01/server-sdk/auth";
import cors from "cors";
import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";
import { CdpToolkit } from "@coinbase/cdp-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { mintNft } from "./nft.js";
import { Wallet } from "@coinbase/coinbase-sdk";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

// WebSocket Server
const wss = new WebSocketServer({ port: 8080 });
const positions = {};

wss.on("connection", ws => {
    ws.on("message", message => {
        const { id, x, y } = JSON.parse(message);
        positions[id] = { x, y };
        const positionsString = JSON.stringify(positions);
        ws.send(positionsString);
    });
    console.log("Client connected");
});

console.log("WebSocket server started on port 8080");

// Huddle01 Token Generation API
const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate-token", async (req, res) => {
    try {
        const roomId = req.body.roomId;
        if (!roomId) {
            return res.status(400).json({ error: "Room ID is required" });
        }

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

        const token = await accessToken.toJwt();
        console.log(token);
        return res.status(200).json(token);
    } catch (error) {
        console.error("Token generation error:", error);
        res.status(500).json({ error: "Failed to generate token", details: error.message });
    }
});

// Chatbot and NFT Minting API
function validateEnvironment() {
    const requiredVars = ["XAI_API_KEY", "CDP_API_KEY_NAME", "CDP_API_KEY_PRIVATE_KEY"];
    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length) {
        console.error("Missing environment variables:", missingVars.join(", "));
        process.exit(1);
    }

    if (!process.env.NETWORK_ID) {
        console.warn("NETWORK_ID not set. Defaulting to base-sepolia.");
    }
}

validateEnvironment();

async function initializeAgent(data) {
    const llm = new ChatOpenAI({
        model: "grok-beta",
        apiKey: process.env.XAI_API_KEY,
        configuration: { baseURL: "https://api.x.ai/v1" },
    });

    const agentkit = await CdpAgentkit.configureWithWallet({
        networkId: process.env.NETWORK_ID || "base-sepolia",
    });

    const cdpToolkit = new CdpToolkit(agentkit);
    const tools = cdpToolkit.getTools();

    const agent = createReactAgent({
        llm,
        tools,
        messageModifier: `You are a helpful bot. Use the provided data to answer user queries. Here is the data: ${JSON.stringify(data)}`,
    });

    return agent;
}

async function mintNftHandler(walletAddress) {
    const wallet = await Wallet.create();
    return mintNft(wallet, {
        contractAddress: "0x2e41c31E7E0C96f6874B134916Ad2246Fe392FdF",
        destination: walletAddress,
    });
}

app.post("/api/chat", async (req, res) => {
    const { data, question } = req.body;

    if (!data || !question) {
        res.status(400).json({ error: "Missing required 'data' or 'question' in the request body." });
        return;
    }

    try {
        const agent = await initializeAgent(data);
        const stream = await agent.stream({ messages: [new HumanMessage(question)] });

        let response = "";
        for await (const chunk of stream) {
            if ("agent" in chunk) {
                response += chunk.agent.messages[0]?.content || "";
            }
        }

        res.json({ success: true, response });
    } catch (error) {
        console.error("Error processing chat request:", error);
        res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
    }
});

app.post("/api/mint-nft", async (req, res) => {
    const { walletAddress } = req.body;

    if (!walletAddress) {
        res.status(400).json({ error: "Missing 'walletAddress' in the request body." });
        return;
    }

    try {
        const result = await mintNftHandler(walletAddress);
        res.json({ success: true, result });
    } catch (error) {
        console.error("Error minting NFT:", error);
        res.status(500).json({ success: false, message: error.message || "Internal Server Error" });
    }
});

// Start Express Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

// CLI Mode for Local Interactions
async function runChatMode(agent) {
    console.log("Chat mode started. Type 'exit' to quit.");
    console.log("Options: ");
    console.log("1. Ask a question.");
    console.log("2. Complete a quest (mint an NFT).");

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

    try {
        while (true) {
            const choice = await question("\nEnter your choice (1 or 2): ");
            if (choice.trim().toLowerCase() === "exit") break;

            if (choice === "1") {
                const userInput = await question("Enter your question: ");
                const stream = await agent.stream({ messages: [new HumanMessage(userInput)] });

                for await (const chunk of stream) {
                    if ("agent" in chunk) {
                        console.log(chunk.agent.messages[0]?.content || "No response available.");
                    }
                }
            } else if (choice === "2") {
                const tweetLink = await question("Enter the tweet link: ");
                const walletAddress = await question("Enter your wallet address: ");

                try {
                    const result = await mintNftHandler(walletAddress);
                    console.log("NFT minted successfully!", result);
                } catch (error) {
                    console.error("Error minting NFT:", error);
                }
            } else {
                console.log("Invalid choice. Please choose 1 or 2.");
            }
        }
    } catch (error) {
        console.error("Error in chat mode:", error);
    } finally {
        rl.close();
    }
}

// Main Entry Point
async function main() {
    try {
        const data = ["Sample data 1", "Sample data 2", "Sample data 3"];
        const agent = await initializeAgent(data);

        console.log("Server is running for API requests.");
    } catch (error) {
        console.error("Error initializing bot:", error);
    }
}

main();