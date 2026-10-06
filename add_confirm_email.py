import re

with open("lib/email/resend.ts", "r", encoding="utf-8") as f:
    c = f.read()

new_email_code = """
export interface AuctionRegistrationConfirmEmailParams {
  to: string
  userName?: string
  auctionName: string
}

export async function sendAuctionRegistrationConfirmEmail({
  to,
  userName,
  auctionName,
}: AuctionRegistrationConfirmEmailParams) {
  if (!resend) {
    console.log('[Email] Registration confirm would be sent to:', to)
    return { id: 'mock-email-id' }
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Auctionhub <onboarding@resend.dev>'
  
  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: `Registration Received: ${auctionName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Registration Received</title>
</head>
<body style="margin: 0; padding: 40px 20px; background-color: #0a0a0f; font-family: sans-serif; color: #f5f5f7;">
  <div style="max-width: 600px; margin: 0 auto; background: #12121a; padding: 40px; border-radius: 16px; border: 1px solid rgba(212, 175, 55, 0.3);">
    <h2 style="color: #d4af37; margin-top: 0;">Registration Received</h2>
    <p>Hello ${userName || 'there'},</p>
    <p>Your registration for the <strong>${auctionName}</strong> auction has been successfully submitted and is currently pending approval by the admin.</p>
    <p>You will receive another email with your access link once your registration is approved.</p>
    <br/>
    <p style="color: #a1a1aa; font-size: 14px;">Thank you,<br/>Auctionhub Team</p>
  </div>
</body>
</html>
    `,
    text: `Hello ${userName || 'there'},\n\nYour registration for the ${auctionName} auction has been received and is pending approval.\n\nThank you,\nAuctionhub Team`
  })

  if (error) {
    console.error('Failed to send registration confirm email:', error)
    throw error
  }

  return data
}
"""

if "sendAuctionRegistrationConfirmEmail" not in c:
    c += "\n\n" + new_email_code.strip() + "\n"
    with open("lib/email/resend.ts", "w", encoding="utf-8") as f:
        f.write(c)
    print("Added sendAuctionRegistrationConfirmEmail to resend.ts")
