"use client";

import * as React from "react";
import { AbstractPrivyProvider } from "@abstract-foundation/agw-react/privy";

interface AbstractProviderProps {
    children: React.ReactNode;
}

export function AbstractProvider({ children }: AbstractProviderProps) {
    return (
        <AbstractPrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}>
            {children}
        </AbstractPrivyProvider>
    );
}
