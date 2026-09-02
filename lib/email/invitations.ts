export async function sendInvitationEmail(email: string) {
  if (process.env.NODE_ENV === "production") throw new Error("Invitation email delivery is not configured.");
  // Keep local development deterministic without logging recipient or invite tokens.
  return { status: "mocked" as const, recipient: email };
}
