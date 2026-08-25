import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

type Msg = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are PetPal, the friendly assistant for PetPals — an Indian pet-care marketplace.
We connect pet parents with verified providers for Grooming (from ₹499), Training (from ₹799),
Walking (from ₹299), Veterinary (from ₹599), and a Pet Store (from ₹199).

How the platform works:
- Customers browse a service, pick a provider by city, book a date/time, and pay securely via Razorpay.
- Vendors sign up, complete a business profile (which an admin approves), list services with prices, then accept bookings.

Guidelines:
- Be warm, concise (2-4 sentences), and helpful. Use the ₹ symbol for prices.
- Help users choose a service, understand pricing, or walk through booking.
- To book: tell them to click a service in the top menu, choose a provider, and hit "Book Now".
- For medical emergencies, advise contacting a vet immediately and booking Veterinary care.
- Never invent specific vendor names, exact availability, or make promises about specific providers.`;

// ---------- Rule-based fallback (used when ANTHROPIC_API_KEY is absent or on error) ----------
function ruleBasedReply(text: string): string {
  const t = text.toLowerCase();
  if (/\b(hi|hello|hey|namaste)\b/.test(t))
    return "Hi there! 🐾 How can I help — grooming, training, walking, vet care, or booking?";
  if (t.includes("groom"))
    return "Grooming starts at ₹499. Click ‘Grooming’ in the top menu, pick a provider in your city, and hit Book Now!";
  if (t.includes("train"))
    return "Training programs start at ₹799 and cover behavior & obedience. Browse ‘Training’ to see providers near you.";
  if (t.includes("walk"))
    return "Dog walking starts at ₹299 per session. Open ‘Walking’ to find walkers in your area.";
  if (t.includes("vet") || t.includes("sick") || t.includes("emergency"))
    return "Veterinary care starts at ₹599. For emergencies, please contact a vet right away — you can book under ‘Veterinary’.";
  if (t.includes("store") || t.includes("food") || t.includes("toy"))
    return "Our Pet Store has food, toys & accessories from ₹199. Check the ‘Pet Store’ tab!";
  if (t.includes("book") || t.includes("how"))
    return "To book: pick a service from the top menu → choose a provider by city → select date/time → pay via Razorpay. Easy! 🐾";
  if (t.includes("vendor") || t.includes("provider") || t.includes("sell") || t.includes("register"))
    return "Want to offer services? Click ‘Become a Provider’, complete your business profile, and our team will approve it. Then list your services!";
  if (t.includes("price") || t.includes("cost") || t.includes("charge"))
    return "Pricing: Grooming ₹499+, Training ₹799+, Walking ₹299+, Vet ₹599+, Store ₹199+. Exact prices vary by provider.";
  if (t.includes("cancel") || t.includes("refund"))
    return "You can view and manage bookings under ‘My Bookings’. For cancellations/refunds, reach out to the provider via your booking.";
  return "I can help with grooming, training, walking, vet care, the pet store, booking, or becoming a provider. What would you like to know? 🐾";
}

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: Msg[] };
  const last = messages?.filter((m) => m.role === "user").pop()?.content ?? "";

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // No key -> rule-based.
  if (!apiKey) {
    return NextResponse.json({ reply: ruleBasedReply(last), mode: "rules" });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const resp = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const reply =
      resp.content
        .filter((c) => c.type === "text")
        .map((c: any) => c.text)
        .join("\n") || ruleBasedReply(last);
    return NextResponse.json({ reply, mode: "ai" });
  } catch (e) {
    // On any API error, degrade gracefully to rules.
    return NextResponse.json({ reply: ruleBasedReply(last), mode: "rules-fallback" });
  }
}
