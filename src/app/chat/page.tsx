"use client";

import { Fragment, useEffect, useState } from "react";
import { SparklesCore } from "@/components/ui/sparkles-core";
import Link from "next/link";

export default function Chatbot() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<
        { role: string; content: string }[]
    >([]);
    const [sessionId, setSessionId] = useState("");

    const createSession = async () => {
        try {
            const response = await fetch("/api/chat/create", {
                method: "POST",
            });

            const data = await response.json();
            localStorage.setItem("sessionId", data.sessionId);
            setSessionId(data.sessionId);
        } catch (error) {
            console.error("Error creating session:", error);
            setMessages([
                {
                    role: "bot",
                    content: "Error: Unable to connect to the server.",
                },
            ]);
        }
    };

    useEffect(() => {
        // Check the local storage for sessionId and create a new session if not found
        const sessionId = localStorage.getItem("sessionId");
        if (!sessionId) {
            createSession();
        } else {
            setSessionId(sessionId);
        }
    }, []);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, newMessage]);
        setInput(""); // Clear input field

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: input, sessionId }),
            });

            const data = await response.json();
            console.log("Bot response:", data);
            const botMessage = {
                role: "bot",
                content: data.message || "No response received",
            };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "bot",
                    content: "Error: Unable to connect to the server.",
                },
            ]);
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center  ">
            {/* Terminal Container */}
            <div className="w-full absolute inset-0 h-full">
                <SparklesCore
                    id="tsparticlesfullpage"
                    background="transparent"
                    minSize={1}
                    maxSize={3.2}
                    particleDensity={100}
                    className="w-full h-full"
                    particleColor="#14F195"
                />
            </div>
            <div className="flex space-x-8 ml-12 mt-8 top-0 h-full w-full z-10">
                <Link
                    href="/"
                    className="text-base md:text-xl font-normal inter-var text-center text-[#14F195] hover:underline"
                >
                    [Home]
                </Link>
                <a
                    href="https://t.me/ELYRAI_TERMINAL"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base md:text-xl font-normal inter-var text-center text-[#14F195] hover:underline"
                >
                    [Telegram]
                </a>

                <a
                    href="https://x.com/ElyraiAgent"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base md:text-xl font-normal inter-var text-center text-[#14F195] hover:underline"
                >
                    [Twitter]
                </a>
            </div>
            <div className="w-full max-w-3xl z-20 justify-center items-center h-full text-[#00FF00] mt-8 rounded-lg shadow-lg p-4 border border-gray-700 font-mono">
                {/* Terminal Header */}
                <div className="flex items-center justify-start mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="ml-4 text-gray-400 text-sm">./ELYRAI</span>
                </div>

                {/* Message Display */}
                <div className="h-[600px] overflow-y-auto bg-[#0D0D0D] p-2 rounded text-sm">
                    {messages.map((msg, index) => (
                        <div key={index} className="mb-1">
                            {msg.role === "user" ? (
                                <p>
                                    <span className="text-blue-500">You:</span>{" "}
                                    {msg.content}
                                </p>
                            ) : (
                                <p>
                                    <span className="text-[#FF00FF]">
                                        ELYRAI:
                                    </span>{" "}
                                    {msg.content
                                        .split("\n")
                                        .map((line, index) => (
                                            <Fragment key={index}>
                                                {line}
                                                <br />
                                            </Fragment>
                                        ))}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Input Field */}
                <div className="flex items-center mt-2">
                    <span className="text-[#00FF00] mr-2">$</span>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Type your message..."
                        className="w-full bg-transparent text-[#00FF00] outline-none"
                    />
                </div>
            </div>
        </div>
    );
}
