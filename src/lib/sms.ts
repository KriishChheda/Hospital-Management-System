/**
 * SMS Utility — Mock mode for development.
 *
 * In production, replace the body of `sendSms()` with a real MSG91 API call.
 * Everything else in the codebase stays exactly the same.
 *
 * MSG91 API reference: https://docs.msg91.com/reference/send-sms
 */

export interface SmsResult {
  success: boolean;
  mock?: boolean;
  error?: string;
}

export async function sendSms(
  phone: string,
  message: string
): Promise<SmsResult> {
  const mode = process.env.SMS_MODE ?? "mock";

  if (mode === "mock") {
    // ── DEV: just log the message to the server console ──
    console.log(
      "\n╔══════════════════════════════════════════════════════╗"
    );
    console.log("║               [MOCK SMS — NOT SENT OVER NETWORK]    ║");
    console.log(`║  To     : ${phone.padEnd(42)}║`);
    console.log("╠══════════════════════════════════════════════════════╣");
    message.split("\n").forEach((line) => {
      console.log(`║  ${line.substring(0, 50).padEnd(50)}  ║`);
    });
    console.log(
      "╚══════════════════════════════════════════════════════╝\n"
    );
    return { success: true, mock: true };
  }

  // ── PRODUCTION: MSG91 ──
  // Uncomment and fill in your credentials from .env when going live.
  //
  // const authKey = process.env.MSG91_AUTH_KEY!;
  // const senderId = process.env.MSG91_SENDER_ID!;
  // const templateId = process.env.MSG91_TEMPLATE_ID!;
  //
  // const res = await fetch("https://api.msg91.com/api/v5/flow/", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json", authkey: authKey },
  //   body: JSON.stringify({
  //     template_id: templateId,
  //     short_url: "0",
  //     recipients: [{ mobiles: `91${phone}`, var1: message }],
  //   }),
  // });
  // const data = await res.json();
  // return { success: data.type === "success" };

  return { success: false, error: "SMS_MODE not configured for production." };
}
