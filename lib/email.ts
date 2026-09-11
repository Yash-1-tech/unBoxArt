// Email utility using Resend (resend.com — free 3000 emails/month)
// Add RESEND_API_KEY to .env.local to enable

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Silently skip if not configured — don't break the flow
    console.log(`[Email skipped — no RESEND_API_KEY] To: ${to}, Subject: ${subject}`);
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Unboxarts <orders@unboxarts.com>',
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('[Resend error]', err);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Email send failed]', err);
    return false;
  }
}

// ── Email templates ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(name: string, email: string) {
  return sendEmail({
    to: email,
    subject: 'Welcome to Unboxarts 🎨',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
        <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">
          Welcome to <span style="color:#e63329">Unboxarts</span>, ${name}!
        </h1>
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin-bottom:20px">
          India's largest art portal — discover and collect original paintings and digital prints from independent artists. 0% commission, always.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://unboxarts.vercel.app'}/art-gallery"
           style="display:inline-block;background:#e63329;color:#fff;padding:12px 28px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.05em;text-transform:uppercase">
          Explore Gallery →
        </a>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>
        <p style="color:#9ca3af;font-size:12px">
          Unboxarts · India's Largest Art Portal<br/>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#e63329">unboxarts.com</a>
        </p>
      </div>
    `,
  });
}

export async function sendOrderConfirmationEmail(
  buyerEmail: string,
  buyerName: string,
  orderNumber: string,
  items: Array<{ title: string; price: number; type: string }>,
  total: number
) {
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px">${item.title}</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right;white-space:nowrap">₹${item.price.toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  return sendEmail({
    to: buyerEmail,
    subject: `Order Confirmed — ${orderNumber}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
        <h1 style="font-size:22px;font-weight:700;margin-bottom:4px">Order Confirmed ✓</h1>
        <p style="color:#6b7280;font-size:13px;margin-bottom:24px">Hi ${buyerName}, your order has been placed successfully.</p>

        <div style="background:#f9fafb;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em">Order Number</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#e63329">${orderNumber}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          ${itemsHtml}
          <tr>
            <td style="padding:12px 0;font-size:14px;font-weight:700">Total</td>
            <td style="padding:12px 0;font-size:14px;font-weight:700;text-align:right">₹${total.toLocaleString('en-IN')}</td>
          </tr>
        </table>

        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin-bottom:20px">
          The artist will prepare your artwork and ship it within 3–5 business days.
          You'll receive a tracking number by email once it's dispatched.
        </p>

        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://unboxarts.vercel.app'}/orders"
           style="display:inline-block;background:#e63329;color:#fff;padding:12px 28px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.05em;text-transform:uppercase">
          View My Orders →
        </a>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>
        <p style="color:#9ca3af;font-size:12px">Unboxarts · 0% Commission Art Marketplace</p>
      </div>
    `,
  });
}

export async function sendNewOrderNotificationEmail(
  artistEmail: string,
  artistName: string,
  orderNumber: string,
  artworkTitle: string,
  buyerName: string,
  amount: number
) {
  return sendEmail({
    to: artistEmail,
    subject: `🎉 New Sale — ${artworkTitle}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
        <h1 style="font-size:22px;font-weight:700;margin-bottom:4px">You made a sale! 🎉</h1>
        <p style="color:#6b7280;font-size:13px;margin-bottom:24px">Hi ${artistName}, someone just purchased your artwork.</p>

        <div style="background:#fde8e7;border-left:4px solid #e63329;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em">Artwork Sold</p>
          <p style="margin:0;font-size:16px;font-weight:700">${artworkTitle}</p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#e63329">₹${amount.toLocaleString('en-IN')}</p>
        </div>

        <p style="color:#6b7280;font-size:13px;margin-bottom:4px"><strong>Buyer:</strong> ${buyerName}</p>
        <p style="color:#6b7280;font-size:13px;margin-bottom:20px"><strong>Order:</strong> ${orderNumber}</p>

        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin-bottom:20px">
          Please prepare and ship the artwork within 3–5 business days.
          Log in to your dashboard to view the shipping address and manage this order.
        </p>

        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://unboxarts.vercel.app'}/dashboard"
           style="display:inline-block;background:#e63329;color:#fff;padding:12px 28px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.05em;text-transform:uppercase">
          View Dashboard →
        </a>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>
        <p style="color:#9ca3af;font-size:12px">Unboxarts · 0% Commission Art Marketplace</p>
      </div>
    `,
  });
}
