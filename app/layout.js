import "./globals.css";
import { SiteSettingsProvider } from "@/components/SiteSettingsContext";

export const metadata = {
    title: "Virtual Herbarium",
    description:
        "Digital Plant Collection",
};

export default function RootLayout({
    children,
}) {
    return (
        <html lang="th">
            <body>
                <SiteSettingsProvider>
                    {children}
                </SiteSettingsProvider>
            </body>
        </html>
    );
}