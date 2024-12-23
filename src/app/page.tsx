"use client";

import { SparklesCore } from "@/components/ui/sparkles-core";
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
    useEffect(() => {
        // Script loading for Jupiter
        const loadJupiterScript = () => {
            const existingScript = document.querySelector(
                'script[src="https://terminal.jup.ag/main-v2.js"]'
            );

            if (!existingScript) {
                const script = document.createElement("script");
                script.src = "https://terminal.jup.ag/main-v2.js";
                script.async = true;

                script.onload = () => {
                    console.log("Jupiter script loaded");
                    initializeJupiter();
                };

                script.onerror = () => {
                    console.error("Failed to load Jupiter script");
                };

                document.head.appendChild(script);
            } else {
                initializeJupiter();
            }
        };

        const initializeJupiter = () => {
            // Delay to ensure everything is loaded
            setTimeout(() => {
                try {
                    if (window.Jupiter) {
                        const target = document.getElementById(
                            "integrated-terminal"
                        );
                        if (target) {
                            window.Jupiter.init({
                                displayMode: "integrated",
                                integratedTargetId: "integrated-terminal",
                                endpoint:
                                    "https://mainnet.helius-rpc.com/?api-key=babb9990-412f-4fa4-bc5c-ed4a4296ba2b",
                                strictTokenList: false,
                                defaultExplorer: "SolanaFM",
                                formProps: {
                                    initialAmount: "888888880000",
                                    initialInputMint:
                                        "So11111111111111111111111111111111111111112",
                                    initialOutputMint:
                                        "3t2LfNCAooGrQSzi45Ndg27X54TnsdbBv2So8FfrcL2k",
                                    fixedOutputMint: true,
                                },
                            });
                            console.log("Jupiter initialized successfully");
                        } else {
                            console.error(
                                "Integrated terminal container not found"
                            );
                        }
                    } else {
                        console.error("Jupiter object not available");
                    }
                } catch (error) {
                    console.error("Error initializing Jupiter:", error);
                }
            }, 1000);
        };

        // Call the script loading function
        loadJupiterScript();

        // Cleanup function
        return () => {
            // Any cleanup logic if needed
        };
    }, []); // Empty dependency array means this runs once on mount

    return (
        <div className="relative w-full flex flex-col min-h-screen">
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

            {/* Content Section */}
            <div className="flex flex-col justify-center items-center z-10 blur-0 w-full h-[55rem]">
                <p className="text-3xl md:text-4xl lg:text-7xl font-bold inter-var text-center pb-4">
                    ELYRAI
                </p>

                <div className="text-left text-sm md:text-lg">
                    <p>{"> ELYRAI booting..."}</p>
                    <p>{"> Navigate the Solana Ecosystem with Ease"}</p>
                    <p>{"> loading CA"}</p>
                    <p>{"> 3t2LfNCAooGrQSzi45Ndg27X54TnsdbBv2So8FfrcL2k"}</p>
                </div>

                <div className="flex space-x-4 mt-8">
                    <a
                        href="https://x.com/ElyraiAgent"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base md:text-xl font-normal inter-var text-center text-[#14F195] hover:underline"
                    >
                        [Twitter]
                    </a>

                    <a
                        href="https://t.me/ELYRAI_TERMINAL"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base md:text-xl font-normal inter-var text-center text-[#14F195] hover:underline"
                    >
                        [Telegram]
                    </a>

                    <Link
                        href="./chat"
                        // target="_blank"
                        // rel="noopener noreferrer"
                        className="text-base md:text-xl font-normal inter-var text-center text-[#14F195] hover:underline"
                    >
                        [Chat]
                    </Link>
                </div>
            </div>

            {/* Iframe and Bottom Text Section */}
            <div className="w-full flex flex-col items-center h-[45rem] mb-96 md:mb-48">
                <div className=" w-full max-w-7xl mx-auto p-4 ">
                    <p className="text-3xl md:text-4xl lg:text-7xl font-bold inter-var text-center pb-4"></p>
                    <div className="flex flex-col md:flex-row w-full items-center justify-center md:h-[700px] gap-4">
                        <iframe
                            src="https://dexscreener.com/solana/6nzyvzb1ayjhc3juswuezd8zegahgwuc7fsam1w9u9as?embed=1&theme=dark&info=0"
                            className=" relative z-22 w-full px-4 md:w-3/4 h-[500px] md:h-[700px] border-0 rounded-lg shadow-lg"
                            allowFullScreen
                        />
                        <div
                            id="integrated-terminal"
                            className="md:w-2/6 h-[700px]  bg-black z-22 relative"
                        ></div>
                    </div>
                </div>
            </div>
            <div className="w-full flex flex-col items-center md:mt-36 mt-72">
                {/* <div className="w-full max-w-4xl mx-auto p-4 pb-24">
                    <p className="text-3xl md:text-4xl lg:text-7xl font-bold inter-var text-center pb-12">
                        About
                    </p>
                    <div className="flex flex-col text-left w-full text-sm md:text-xl gap-4">
                        <p>
                            {
                                " Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod"
                            }
                        </p>
                        <p>
                            {
                                " Minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip"
                            }
                        </p>
                        <p>
                            {
                                " Voluptate velit esse cillum dolore eu fugiat nulla pariatur"
                            }
                        </p>
                        <p>{" 3t2LfNCAooGrQSzi45Ndg27X54TnsdbBv2So8FfrcL2k"}</p>
                    </div>
                </div> */}

                <p
                    className="text-sm md:text-md text-center pb-4"
                    style={{ color: "#14F195" }}
                >
                    This is an experiment. NFA.
                </p>
            </div>
        </div>
    );
}
