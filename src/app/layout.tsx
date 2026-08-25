import type { Metadata } from "next";
import "./globals.css";
import { Chatbot } from "@/components/Chatbot";

export const metadata: Metadata = {
  title: "PetPals — Pet Care Marketplace",
  description:
    "Grooming, training, walking, veterinary & pet store from verified providers near you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Chatbot />
      </body>
    </html>
  );
}
