// Email utility using Resend.
// Email delivery remains optional until the project owner configures
// a verified sending domain and API key.

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return value.replace(/[&<>"']/g, (character) => {
    return entities[character] ?? character;
  });
}

function getAppUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const fallbackUrl = 'https://unboxarts.vercel.app';

  if (!configuredUrl) {
    return fallbackUrl;
  }

  try {
    const parsedUrl = new URL(configuredUrl);

    if (
      parsedUrl.protocol !== 'https:' &&
      parsedUrl.protocol !== 'http:'
    ) {
      return fallbackUrl;
    }

    return parsedUrl.origin;
  } catch {
    return fallbackUrl;
  }
}

function formatINR(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `₹${safeAmount.toLocaleString('en-IN')}`;
}

function safeSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, ' ').trim().slice(0, 200);
}

async function sendEmail({
  to,
  subject,
  html,
}: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

  // Email is optional. Registration and ordering must continue
  // even when the project owner has not configured Resend.
  if (!apiKey) {
    console.info(
      '[Email skipped] RESEND_API_KEY is not configured.'
    );
    return false;
  }

  if (!fromEmail) {
    console.info(
      '[Email skipped] RESEND_FROM_EMAIL is not configured.'
    );
    return false;
  }

  if (!to.trim()) {
    console.warn('[Email skipped] Recipient address is empty.');
    return false;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: to.trim(),
        subject: safeSubject(subject),
        html,
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();

      let errorDetails: unknown = responseText;

      try {
        errorDetails = JSON.parse(responseText);
      } catch {
        // Keep the original response text if it is not JSON.
      }

      console.error('[Resend error]', {
        status: response.status,
        details: errorDetails,
      });

      return false;
    }

    return true;
  } catch (error: unknown) {
    console.error(
      '[Email send failed]',
      error instanceof Error ? error.message : 'Unknown error'
    );

    return false;
  }
}

// -----------------------------------------------------------------------------
// Email templates
// -----------------------------------------------------------------------------

export async function sendWelcomeEmail(
  name: string,
  email: string
): Promise<boolean> {
  const safeName = escapeHtml(name);
  const appUrl = getAppUrl();

  return sendEmail({
    to: email,
    subject: 'Welcome to Unboxarts 🎨',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
        <h1 style="font-size:24px;font-weight:700;margin-bottom:8px">
          Welcome to <span style="color:#e63329">Unboxarts</span>, ${safeName}!
        </h1>

        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin-bottom:20px">
          India's largest art portal — discover and collect original paintings and digital prints from independent artists. 0% commission, always.
        </p>

        <a href="${appUrl}/art-gallery"
           style="display:inline-block;background:#e63329;color:#fff;padding:12px 28px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.05em;text-transform:uppercase">
          Explore Gallery →
        </a>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>

        <p style="color:#9ca3af;font-size:12px">
          Unboxarts · India's Largest Art Portal<br/>
          <a href="${appUrl}" style="color:#e63329">Visit Unboxarts</a>
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
): Promise<boolean> {
  const safeBuyerName = escapeHtml(buyerName);
  const safeOrderNumber = escapeHtml(orderNumber);
  const appUrl = getAppUrl();

  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px">
            ${escapeHtml(item.title)}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right;white-space:nowrap">
            ${formatINR(item.price)}
          </td>
        </tr>
      `
    )
    .join('');

  return sendEmail({
    to: buyerEmail,
    subject: `Order Confirmed — ${orderNumber}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
        <h1 style="font-size:22px;font-weight:700;margin-bottom:4px">
          Order Confirmed ✓
        </h1>

        <p style="color:#6b7280;font-size:13px;margin-bottom:24px">
          Hi ${safeBuyerName}, your order has been placed successfully.
        </p>

        <div style="background:#f9fafb;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em">
            Order Number
          </p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#e63329">
            ${safeOrderNumber}
          </p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          ${itemsHtml}
          <tr>
            <td style="padding:12px 0;font-size:14px;font-weight:700">
              Total
            </td>
            <td style="padding:12px 0;font-size:14px;font-weight:700;text-align:right">
              ${formatINR(total)}
            </td>
          </tr>
        </table>

        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin-bottom:20px">
          The artist will prepare your artwork and ship it within 3–5 business days.
          You'll receive a tracking number by email once it's dispatched.
        </p>

        <a href="${appUrl}/orders"
           style="display:inline-block;background:#e63329;color:#fff;padding:12px 28px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.05em;text-transform:uppercase">
          View My Orders →
        </a>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>

        <p style="color:#9ca3af;font-size:12px">
          Unboxarts · 0% Commission Art Marketplace
        </p>
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
): Promise<boolean> {
  const safeArtistName = escapeHtml(artistName);
  const safeOrderNumber = escapeHtml(orderNumber);
  const safeArtworkTitle = escapeHtml(artworkTitle);
  const safeBuyerName = escapeHtml(buyerName);
  const appUrl = getAppUrl();

  return sendEmail({
    to: artistEmail,
    subject: `🎉 New Sale — ${artworkTitle}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a1a">
        <h1 style="font-size:22px;font-weight:700;margin-bottom:4px">
          You made a sale! 🎉
        </h1>

        <p style="color:#6b7280;font-size:13px;margin-bottom:24px">
          Hi ${safeArtistName}, someone just purchased your artwork.
        </p>

        <div style="background:#fde8e7;border-left:4px solid #e63329;padding:16px;margin-bottom:24px">
          <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em">
            Artwork Sold
          </p>
          <p style="margin:0;font-size:16px;font-weight:700">
            ${safeArtworkTitle}
          </p>
          <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#e63329">
            ${formatINR(amount)}
          </p>
        </div>

        <p style="color:#6b7280;font-size:13px;margin-bottom:4px">
          <strong>Buyer:</strong> ${safeBuyerName}
        </p>

        <p style="color:#6b7280;font-size:13px;margin-bottom:20px">
          <strong>Order:</strong> ${safeOrderNumber}
        </p>

        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin-bottom:20px">
          Please prepare and ship the artwork within 3–5 business days.
          Log in to your dashboard to view the shipping address and manage this order.
        </p>

        <a href="${appUrl}/dashboard"
           style="display:inline-block;background:#e63329;color:#fff;padding:12px 28px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.05em;text-transform:uppercase">
          View Dashboard →
        </a>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0"/>

        <p style="color:#9ca3af;font-size:12px">
          Unboxarts · 0% Commission Art Marketplace
        </p>
      </div>
    `,
  });
}