import React, { useState } from "react";
import axios from "axios";

interface ChatBoxProps {
    booth: string; // Dynamic booth name
    userWalletAddress: string; // User's wallet address
}

const ChatBox: React.FC<ChatBoxProps> = ({ booth, userWalletAddress }) => {
    const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);
    const [input, setInput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [userChoice, setUserChoice] = useState<"doubt" | "quest" | null>(null); // Track user choice
    const [showPrompt, setShowPrompt] = useState<boolean>(true); // Track if prompt is visible
    const boothName = booth || "BASE";
    const [chatVisible, setChatVisible] = useState<boolean>(true);

    const backendUrl = "http://localhost:3000/api/chat"; // Replace with your backend URL
    const mintNFTUrl = "http://localhost:3000/api/mint-nft"; // Replace with your minting endpoint

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: "user" as const, text: input.trim() };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            if (userChoice === "quest") {
                // If the user is in "quest" mode, directly handle Twitter link
                if (input.trim().startsWith("https://twitter.com/")) {
                    await handleTweetLink(input.trim());
                } else {
                    // Prompt user to enter a valid tweet link
                    const botMessage = {
                        sender: "bot" as const,
                        text: "Please share the link to your tweet where you followed and tweeted about the booth.",
                    };
                    setMessages((prev) => [...prev, botMessage]);
                }
            } else {
                // Handle general query or conversation in doubt mode
                const response = await axios.post(backendUrl, {
                    data: ["Sample data 1", "Sample data 2", "Sample data 3"],
                    question: input.trim(),
                });

                const botMessage = { sender: "bot" as const, text: response.data.response || "No response available." };
                setMessages((prev) => [...prev, botMessage]);
            }
        } catch (error: any) {
            console.error("Error fetching bot response:", error);
            const errorMessage = { sender: "bot" as const, text: "Something went wrong. Please try again later." };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleChoice = (choice: "doubt" | "quest") => {
        setUserChoice(choice);
        setShowPrompt(false);
        const botMessage = {
            sender: "bot" as const,
            text: `You can now start your ${choice === "doubt" ? "doubt" : "quest"}.`,
        };
        setMessages((prev) => [...prev, botMessage]);

        if (choice === "quest") {
            // Provide quest instructions
            const questMessage = {
                sender: "bot" as const,
                text: `To complete the quest for "${boothName}", follow and tweet about the booth. Share the tweet link here to claim your NFT! Remember, you'll need to show the NFT at the physical booth to claim your swag.`,
            };
            setMessages((prev) => [...prev, questMessage]);
        }
    };

    const handleTweetLink = async (tweetLink: string) => {
        setMessages((prev) => [...prev, { sender: "user", text: tweetLink }]);

        try {
            // Call backend function to mint NFT and send it to user's wallet
            const response = await axios.post(mintNFTUrl, {
                tweetLink,
                boothName,
                userWalletAddress, // Pass the wallet address for minting
            });

            const botMessage = {
                sender: "bot" as const,
                text: `Thank you for completing the quest! You've earned an NFT for "${boothName}". The NFT has been minted to your wallet. Remember, show it at the physical booth to claim your swag!`,
            };
            setMessages((prev) => [...prev, botMessage]);

            // Switch back to chat mode after NFT minting
            setUserChoice(null); // Reset user choice
            setShowPrompt(true); // Show the prompt again for future interactions

        } catch (error: any) {
            console.error("Error minting NFT:", error);
            const errorMessage = {
                sender: "bot" as const,
                text: "There was an issue processing your quest. Please try again later.",
            };
            setMessages((prev) => [...prev, errorMessage]);
        }
    };

    const handleClose = () => {
        setMessages([]);
        setUserChoice(null);
        setShowPrompt(true); // Show prompt when chat is closed
        setChatVisible(!chatVisible);
    };

    return (
        <div style={styles.container} className="fixed right-0 h-fit bottom-0">
            <div style={styles.chatBox} className={chatVisible ? "h-auto" : "!h-20"}>
                {/* <ChatHeader title={boothName} onClose={handleClose} /> */}
                <div style={styles.header}>
                    <h2 style={styles.headerText}>{boothName}</h2>
                    <button onClick={handleClose} className="absolute right-2 top-0">
                        {chatVisible ? "x" : "^"}
                    </button>
                </div>
                {chatVisible && <>{!showPrompt && <ChatMessages messages={messages} loading={loading} />}
                    {showPrompt && <ChoicePrompt onChoice={handleChoice} />}
                    <ChatInput
                        input={input}
                        setInput={setInput}
                        onSend={handleSend}
                        loading={loading}
                        disabled={!userChoice} // Disable input if no choice made
                    />
                </>}
            </div>
        </div>
    );
};

const ChatMessages: React.FC<{ messages: { sender: "user" | "bot"; text: string }[]; loading: boolean }> = ({ messages, loading }) => (
    <div style={styles.messages}>
        {messages.map((msg, index) => (
            <div
                key={index}
                style={{
                    ...styles.message,
                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                    backgroundColor: msg.sender === "user" ? "#FF6347" : "#D3D3D3", // User (neon red), Bot (light gray)
                    color: msg.sender === "user" ? "#fff" : "#000",
                }}
            >
                {msg.text}
            </div>
        ))}
        {loading && <div style={styles.loading}>Typing...</div>}
    </div>
);

const ChatInput: React.FC<{ input: string; setInput: React.Dispatch<React.SetStateAction<string>>; onSend: () => void; loading: boolean; disabled: boolean }> = ({ input, setInput, onSend, loading, disabled }) => (
    <div style={styles.inputContainer}>
        <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            style={styles.input}
            disabled={disabled}
        />
        <button onClick={onSend} style={styles.sendButton} disabled={loading || !input.trim() || disabled}>
            Send
        </button>
    </div>
);

const ChoicePrompt: React.FC<{ onChoice: (choice: "doubt" | "quest") => void }> = ({ onChoice }) => (
    <div style={styles.choicePrompt}>
        <p style={styles.choiceText}>What would you like to do?</p>
        <button onClick={() => onChoice("doubt")} style={styles.choiceButton}>Ask a Doubt</button>
        <button onClick={() => onChoice("quest")} style={styles.choiceButton}>Do Quest</button>
    </div>
);

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "",
        backgroundColor: "transparent", // Dark background for retro feel
    },
    chatBox: {
        width: "400px",
        height: "80vh",
        display: "flex",
        flexDirection: "column" as const,
        backgroundColor: "#F5F5DC", // Cream background (light beige)
        border: "8px solid #8B4513", // Thick brown border for retro feel
        borderRadius: "16px",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
        overflow: "hidden",
        fontFamily: "sans-serif",
    },
    header: {
        padding: "16px",
        backgroundColor: "#8B4513", // Brown header for retro console feel
        color: "#FFF",
        textAlign: "center" as const,
        fontSize: "20px",
        position: "relative" as "relative",
    },
    headerText: {
        margin: 0,
        fontSize: "18px",
    },
    closeButton: {
        position: "absolute",
        top: "8px",
        right: "8px",
        color: "#FFF",
        border: "none",
        fontSize: "18px",
        cursor: "pointer",
        padding: "5px 10px",
    },
    messages: {
        flex: 1,
        padding: "16px",
        overflowY: "auto" as const,
        display: "flex",
        flexDirection: "column" as const,
    },
    message: {
        padding: "8px 16px",
        marginBottom: "8px",
        borderRadius: "12px",
        maxWidth: "80%",
    },
    loading: {
        marginTop: "10px",
        fontStyle: "italic" as const,
        color: "#8B4513",
    },
    inputContainer: {
        display: "flex",
        padding: "16px",
        borderTop: "2px solid #8B4513",
        backgroundColor: "#FFF",
    },
    input: {
        flex: 1,
        padding: "10px",
        borderRadius: "8px",
        border: "2px solid #8B4513",
        fontFamily: "sans-serif",
    },
    sendButton: {
        backgroundColor: "#8B4513",
        color: "#FFF",
        border: "none",
        padding: "10px",
        borderRadius: "8px",
        fontFamily: "sans-serif",
        cursor: "pointer",
        marginLeft: "8px",
    },
    choicePrompt: {
        textAlign: "center" as "center",
        marginTop: "20px",
        display: "flex",
        flex: 1,
        flexDirection: "column" as const,
        justifyContent: "center",
        alignItems: "center",
    },
    choiceText: {
        fontSize: "16px",
        fontFamily: "sans-serif",
    },
    choiceButton: {
        backgroundColor: "#8B4513",
        color: "#FFF",
        border: "none",
        padding: "10px",
        marginTop: "10px",
        borderRadius: "8px",
        fontFamily: "sans-serif",
        cursor: "pointer",
        width: "80%",
    },
};

export default ChatBox;