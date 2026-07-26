import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeetPilot | Scheduling made simple",
  description: "A calm scheduling workspace for independent professionals.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
