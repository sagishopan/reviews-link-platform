// Modular notification dispatcher. Each channel is independently toggled by
// both a global env flag (is the integration configured at all) and a
// per-branch flag (does this branch want it). A channel failing never blocks
// the others - low-rating alerts are best-effort, not part of the save path.

async function sendEmail({ branch, restaurant, response }) {
  if (process.env.NOTIFY_EMAIL_ENABLED !== 'true') return;
  if (!branch.notify_email_enabled) return;
  if (!process.env.RESEND_API_KEY || !branch.manager_email) return;

  const body = buildEmailBody({ branch, restaurant, response });
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM_EMAIL || 'alerts@example.com',
        to: branch.manager_email,
        subject: `דירוג נמוך התקבל - ${branch.name}`,
        html: body,
      }),
    });
  } catch (err) {
    console.error('Email notification failed:', err.message);
  }
}

async function sendWhatsapp({ branch, response }) {
  if (process.env.NOTIFY_WHATSAPP_ENABLED !== 'true') return;
  if (!branch.notify_whatsapp_enabled) return;
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID || !branch.manager_whatsapp) return;

  const text = buildPlainText({ branch, response });
  try {
    await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: branch.manager_whatsapp,
        type: 'text',
        text: { body: text },
      }),
    });
  } catch (err) {
    console.error('WhatsApp notification failed:', err.message);
  }
}

async function sendWebhook({ branch, restaurant, response }) {
  if (process.env.NOTIFY_WEBHOOK_ENABLED !== 'true') return;
  if (!branch.notify_webhook_enabled) return;
  const url = branch.notify_webhook_url || process.env.WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branch: branch.name,
        restaurant: restaurant?.name,
        rating: response.rating,
        categories: safeParseCategories(response.categories),
        comment: response.comment,
        customer_name: response.customer_name,
        customer_phone: response.customer_phone,
        customer_email: response.customer_email,
        created_at: response.created_at,
      }),
    });
  } catch (err) {
    console.error('Webhook notification failed:', err.message);
  }
}

function safeParseCategories(json) {
  try {
    return JSON.parse(json || '[]');
  } catch {
    return [];
  }
}

function buildPlainText({ branch, response }) {
  const categories = safeParseCategories(response.categories).join(', ') || 'לא צוינו';
  const contact = [response.customer_name, response.customer_phone, response.customer_email].filter(Boolean).join(' | ') || 'לא נמסרו פרטים';
  return [
    `דירוג נמוך התקבל בסניף ${branch.name}`,
    `ציון: ${response.rating}/5`,
    `קטגוריות: ${categories}`,
    `הערה: ${response.comment ? response.comment.slice(0, 200) : 'אין'}`,
    `פרטי קשר: ${contact}`,
  ].join('\n');
}

function buildEmailBody({ branch, response }) {
  const categories = safeParseCategories(response.categories).join(', ') || 'לא צוינו';
  const contact = [response.customer_name, response.customer_phone, response.customer_email].filter(Boolean).join(' | ') || 'לא נמסרו פרטים';
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif;">
      <h2>דירוג נמוך התקבל - ${branch.name}</h2>
      <p><strong>ציון:</strong> ${response.rating}/5</p>
      <p><strong>קטגוריות:</strong> ${categories}</p>
      <p><strong>הערה:</strong> ${response.comment ? response.comment.slice(0, 500) : 'אין'}</p>
      <p><strong>פרטי קשר:</strong> ${contact}</p>
    </div>
  `;
}

// Fire-and-forget dispatch to all enabled channels for a low-rating response.
async function notifyLowRating({ branch, restaurant, response }) {
  await Promise.allSettled([
    sendEmail({ branch, restaurant, response }),
    sendWhatsapp({ branch, response }),
    sendWebhook({ branch, restaurant, response }),
  ]);
}

module.exports = { notifyLowRating };
