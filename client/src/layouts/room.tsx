import { ReactNode } from "react";

export default function RoomLayout({children}: {children: ReactNode}) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4">
            {children}
        </div>
    )
}