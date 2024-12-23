"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLoginWithOAuth, usePrivy, useWallets } from "@privy-io/react-auth";
import { Copy, LogOut, Settings, Wallet } from "lucide-react";
import { getBalance } from "viem/actions";
import { SearchBar } from "@/components/Search";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { useAbstractPrivyLogin } from "@abstract-foundation/agw-react/privy";
// import { getWalletBalance } from "@/lib/web3";

export const Header = () => {
    const { ready, logout, user, createWallet } = usePrivy();
    const { login, link } = useAbstractPrivyLogin();

    const router = useRouter();
    const handleAuth = async () => {
        try {
            //   await initOAuth({ provider: "twitter" });
            await login();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <header className="sticky border-b-[1px] top-0 z-40 w-full dark:border-b-card bg-background">
            <NavigationMenu className="mx-auto">
                <NavigationMenuList className="container flex justify-between w-screen h-16 px-4">
                    <NavigationMenuItem className="flex-col font-bold md:flex">
                        <Link
                            rel="noreferrer noopener"
                            href="/"
                            className="flex h-full grow hover:underline"
                        >
                            <h1 className="items-center justify-center pl-2 mr-3 text-xl font-bold md:flex">
                                🍜
                                <span className="hidden ml-2 md:flex">
                                    noodles.fun
                                </span>
                            </h1>
                        </Link>
                    </NavigationMenuItem>

                    {/* mobile */}
                    <nav className="flex flex-row md:hidden grow">
                        <SearchBar />
                    </nav>

                    {/* desktop */}
                    <nav className="items-center justify-center hidden gap-2 grow md:flex">
                        <HeaderLink href="/how-it-works">
                            [How it Works]
                        </HeaderLink>
                        <SearchBar className="max-w-[500px]" />
                        <HeaderLink href="/referrals">[Referrals]</HeaderLink>
                        <HeaderLink href="/kitchen">[Kitchen]</HeaderLink>
                    </nav>

                    <div className="gap-2 pl-3 md:flex">
                        {/* <span className="items-center justify-between hidden text-purple-400 md:flex">
                            {balance !== null &&
                                `${Number(balance).toPrecision(5)} ETH`}
                        </span> */}
                        {!ready ? (
                            <Button
                                disabled
                                onClick={handleAuth}
                                // className="cursor-pointer text-bold bg-card"
                            >
                                Loading
                            </Button>
                        ) : user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Avatar className="cursor-pointer">
                                        <AvatarImage
                                            src={
                                                user.twitter?.profilePictureUrl
                                                    ? user.twitter.profilePictureUrl.replace(
                                                          "normal",
                                                          "400x400"
                                                      )
                                                    : undefined
                                            }
                                            alt={
                                                user.twitter?.username ?? "User"
                                            }
                                        />
                                        {/* <AvatarFallback>CN</AvatarFallback> */}
                                    </Avatar>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 bg-background">
                                    <DropdownMenuItem
                                        className="flex items-center justify-between"
                                        onClick={() => {
                                            // router.push(
                                            //     `/profile/${user.twitter?.username}`
                                            // );
                                        }}
                                    >
                                        {/* @{user?.twitter?.username} */}
                                        ayo
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                user.wallet?.address ?? ""
                                            );
                                        }}
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        <span className="w-full text-left">
                                            {user.wallet?.address.slice(0, 6)}
                                            ...{user.wallet?.address.slice(-4)}
                                        </span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="cursor-pointer">
                                        <Settings className="w-4 h-4 mr-2" />
                                        <span>Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={logout}
                                        className="cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button onClick={handleAuth}>Sign in</Button>
                        )}
                    </div>
                </NavigationMenuList>
            </NavigationMenu>
        </header>
    );
};

function HeaderLink({
    href,
    children,
    className,
}: {
    href: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <Link
            rel="noreferrer noopener"
            href={href}
            // className={`text-[16px] ${buttonVariants({
            //     variant: "ghost",
            // })}`}
            className={cn("text-[14px] hover:underline px-0.5", className)}
        >
            {children}
        </Link>
    );
}
