import { Resend } from 'resend'

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export interface AuctionAccessEmailParams {
  to: string
  auctionName: string
  auctionDate: string
  accessToken: string
  userName?: string
}

export async function sendAuctionAccessEmail({
  to,
  auctionName,
  auctionDate,
  accessToken,
  userName,
}: AuctionAccessEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const auctionUrl = `${appUrl}/auction-room/${accessToken}`

  // If Resend is not configured, log and return
  if (!resend) {
    console.log('📧 Email would be sent to:', to)
    console.log('📧 Auction URL:', auctionUrl)
    console.log('⚠️  Resend API key not configured - email not sent')
    return { id: 'mock-email-id' }
  }

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Auctionhub <onboarding@resend.dev>',
    to,
    subject: `🎫 Your Access Pass: ${auctionName}`,
    html: generateAuctionEmailHtml({
      auctionName,
      auctionDate,
      auctionUrl,
      userName,
    }),
  })

  if (error) {
    console.error('Failed to send email:', error)
    throw error
  }

  return data
}

function generateAuctionEmailHtml({
  auctionName,
  auctionDate,
  auctionUrl,
  userName,
}: {
  auctionName: string
  auctionDate: string
  auctionUrl: string
  userName?: string
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Auction Access Pass</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(145deg, #1a1a24 0%, #12121a 100%); border-radius: 24px; border: 1px solid rgba(212, 175, 55, 0.2); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <div style="font-size: 48px; margin-bottom: 16px;">💎</div>
              <h1 style="margin: 0; color: #f5f5f7; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
                You're In!
              </h1>
              <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 16px;">
                Your exclusive auction access is confirmed
              </p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <p style="margin: 0; color: #f5f5f7; font-size: 16px; line-height: 1.6;">
                ${userName ? `Hi ${userName},` : 'Hello,'}
              </p>
              <p style="margin: 16px 0 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                You've successfully registered for an exclusive auction. Here's your personal access pass:
              </p>
            </td>
          </tr>
          
          <!-- Auction Card -->
          <tr>
            <td style="padding: 24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(212, 175, 55, 0.08); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 16px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Auction Event
                    </p>
                    <h2 style="margin: 0 0 16px; color: #d4af37; font-size: 24px; font-weight: 700;">
                      ${auctionName}
                    </h2>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="color: #f5f5f7; font-size: 14px;">📅 ${auctionDate}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${auctionUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #c9a961 0%, #a0823d 100%); color: #0a0a0f; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 12px; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);">
                      Enter Auction Room →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; color: #71717a; font-size: 13px; text-align: center;">
                This link is unique to you. Do not share it with others.
              </p>
            </td>
          </tr>
          
          <!-- Important Notice -->
          <tr>
            <td style="padding: 24px 40px; background: rgba(255, 255, 255, 0.03); border-top: 1px solid rgba(255, 255, 255, 0.08);">
              <h3 style="margin: 0 0 12px; color: #f5f5f7; font-size: 14px; font-weight: 600;">
                ⚠️ Important
              </h3>
              <ul style="margin: 0; padding: 0 0 0 20px; color: #a1a1aa; font-size: 14px; line-height: 1.8;">
                <li>You must be logged into your account to enter</li>
                <li>This link is personal and non-transferable</li>
                <li>Join on time - late entry may limit bidding</li>
              </ul>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.08);">
              <p style="margin: 0; color: #71717a; font-size: 13px;">
                Auctionhub
              </p>
              <p style="margin: 8px 0 0; color: #52525b; font-size: 12px;">
                Premium gem auctions for discerning collectors
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Footer Links -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin-top: 24px;">
          <tr>
            <td align="center">
              <p style="margin: 0; color: #52525b; font-size: 12px;">
                If the button doesn't work, copy this link:<br>
                <a href="${auctionUrl}" style="color: #d4af37; word-break: break-all;">${auctionUrl}</a>
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export { resend }
