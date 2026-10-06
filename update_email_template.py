import re

with open("lib/email/resend.ts", "r", encoding="utf-8") as f:
    c = f.read()

# 1. Update AuctionAccessEmailParams interface
c = c.replace(
    "export interface AuctionAccessEmailParams {\n  to: string\n  auctionName: string\n  auctionDate: string\n  accessToken: string\n  userName?: string\n}",
    "export interface AuctionAccessEmailParams {\n  to: string\n  auctionName: string\n  auctionDate: string\n  auctionDescription?: string | null\n  accessToken: string\n  userName?: string\n}"
)

# 2. Update sendAuctionAccessEmail args
c = c.replace(
    "  auctionDate,\n  accessToken,\n  userName,\n}: AuctionAccessEmailParams)",
    "  auctionDate,\n  auctionDescription,\n  accessToken,\n  userName,\n}: AuctionAccessEmailParams)"
)

# 3. Update subject and pass auctionDescription to html
c = c.replace(
    """  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Auctionhub <onboarding@resend.dev>'
  const replyTo = process.env.RESEND_REPLY_TO || undefined

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to,
    replyTo,
    subject: `Your Access Pass: ${auctionName}`,
    html: generateAuctionEmailHtml({
      auctionName,
      auctionDate,
      accessToken,
      userName,
    }),""",
    """  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Auctionhub <onboarding@resend.dev>'
  const replyTo = process.env.RESEND_REPLY_TO

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to,
    ...(replyTo ? { replyTo } : {}),
    subject: `Registration Confirmed: ${auctionName}`,
    html: generateAuctionEmailHtml({
      auctionName,
      auctionDate,
      auctionDescription,
      accessToken,
      userName,
    }),"""
)

# 4. Update generateAuctionEmailHtml text fallback
c = c.replace(
    """    text: `Your Auction Access Pass\\n\\n${userName ? `Hi ${userName},` : 'Hello,'}\\n\\nYou've been approved for \\n${auctionName}.\\nDate: ${auctionDate}\\n\\nEnter your auction room: ${auctionUrl}\\n\\nThis link is unique to you. Do not \\nshare it with others.\\n\\nImportant:\\n- You must be logged into your account to enter\\n- This link is personal and \\nnon-transferable\\n- Join on time - late entry may limit bidding\\n\\nAuctionhub - Premium gem auctions`,""",
    """    text: `Registration Confirmed\\n\\n${userName ? `Hi ${userName},` : 'Hello,'}\\n\\nYour registration for ${auctionName} has been approved!\\nDate: ${auctionDate}\\n\\n${auctionDescription ? `Details: ${auctionDescription}\\n\\n` : ''}Enter your auction room: ${auctionUrl}\\n\\nThis link is unique to you. Do not share it with others.\\n\\nImportant:\\n- You must be logged into your account to enter\\n- This link is personal and non-transferable\\n- Join on time - late entry may limit bidding\\n\\nAuctionhub - Premium gem auctions`,"""
)

# 5. Update generateAuctionEmailHtml args
c = c.replace(
    "}: {\n  auctionName: string\n  auctionDate: string\n  accessToken: string\n  userName?: string\n}) {",
    "}: {\n  auctionName: string\n  auctionDate: string\n  auctionDescription?: string | null\n  accessToken: string\n  userName?: string\n}) {"
)

# 6. Change title in HTML from Your Access Pass to Registration Confirmed
c = re.sub(
    r"<title>Your Access Pass</title>", 
    "<title>Registration Confirmed</title>",
    c, count=1
)

# 7. Update HTML greeting
c = re.sub(
    r"You've been approved to join the <strong",
    "Your registration has been approved for the <strong",
    c, count=1
)

# 8. Add description block to HTML (using a very specific regex replacement limited to generateAuctionEmailHtml)
html_desc_block = """                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
${auctionDescription ? `
          <tr>
            <td style="padding: 16px 40px 24px;">
              <h3 style="margin: 0 0 12px; color: #d4af37; font-size: 16px; font-weight: 600;">Auction Details</h3>
              <p style="margin: 0; color: #a1a1aa; font-size: 14px; line-height: 1.6;">${auctionDescription}</p>
            </td>
          </tr>
` : ''}

          <!-- CTA Button -->
"""
# find the first CTA button comment after generateAuctionEmailHtml and replace
match = re.search(r"function generateAuctionEmailHtml(.*?)(?=function generate)", c, re.DOTALL)
if match:
    sub_chunk = match.group(0).replace("""                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->""", html_desc_block.strip() + "\n")
    c = c.replace(match.group(0), sub_chunk)

# 9. Update sendWinnerEmail replyTo
c = c.replace(
    """  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Auctionhub <onboarding@resend.dev>'
  const replyTo = process.env.RESEND_REPLY_TO || undefined

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to,
    replyTo,
    subject: `Congratulations! You Won: ${gemName}`,""",
    """  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Auctionhub <onboarding@resend.dev>'
  const replyTo = process.env.RESEND_REPLY_TO

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to,
    ...(replyTo ? { replyTo } : {}),
    subject: `Congratulations! You Won: ${gemName}`,"""
)

# 10. Update sendAuctionSummaryEmail replyTo
c = c.replace(
    """  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Auctionhub <onboarding@resend.dev>'
  const replyTo = process.env.RESEND_REPLY_TO || undefined

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to,
    replyTo,
    subject: `Auction Summary: ${auctionName}`,""",
    """  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Auctionhub <onboarding@resend.dev>'
  const replyTo = process.env.RESEND_REPLY_TO

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to,
    ...(replyTo ? { replyTo } : {}),
    subject: `Auction Summary: ${auctionName}`,"""
)

with open("lib/email/resend.ts", "w", encoding="utf-8") as f:
    f.write(c)
