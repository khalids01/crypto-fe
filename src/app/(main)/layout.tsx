import { QueryProvider } from "./provider";
import { Header } from "@/features/main/header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider >
            <Header />
            {children}
        </QueryProvider>
    )
}
