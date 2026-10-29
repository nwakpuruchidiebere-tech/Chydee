import { GoogleContact, DriveReceiptFile, GmailMessageItem } from '../types';

/**
 * Google Drive API v3 Helpers
 */

export async function uploadReceiptToDrive(
  accessToken: string,
  receiptData: {
    transactionId: string;
    senderName: string;
    receiverName: string;
    amount: number;
    currency: string;
    note: string;
    date: string;
    socialTag?: string;
  }
): Promise<{ id: string; name: string }> {
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const fileName = `PaySocial_Receipt_${receiptData.transactionId.slice(0, 8)}_${Date.now()}.html`;
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PaySocial Receipt #${receiptData.transactionId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; padding: 40px; }
    .card { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .badge { display: inline-block; background: #3b82f6; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .amount { font-size: 38px; font-weight: 800; color: #0f172a; margin: 16px 0; }
    .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .label { color: #64748b; }
    .value { font-weight: 600; color: #1e293b; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Verified Payment Receipt</span>
    <div class="amount">$${receiptData.amount.toFixed(2)} ${receiptData.currency}</div>
    <div class="row"><span class="label">From:</span><span class="value">${receiptData.senderName}</span></div>
    <div class="row"><span class="label">To:</span><span class="value">${receiptData.receiverName}</span></div>
    <div class="row"><span class="label">Note:</span><span class="value">${receiptData.note}</span></div>
    <div class="row"><span class="label">Date:</span><span class="value">${new Date(receiptData.date).toLocaleString()}</span></div>
    <div class="row"><span class="label">Transaction ID:</span><span class="value">${receiptData.transactionId}</span></div>
    ${receiptData.socialTag ? `<div class="row"><span class="label">Social Connection:</span><span class="value">${receiptData.socialTag}</span></div>` : ''}
    <div class="footer">Saved via PaySocial Google Drive Integration</div>
  </div>
</body>
</html>`;

  const metadata = {
    name: fileName,
    mimeType: 'text/html',
    description: `PaySocial payment receipt between ${receiptData.senderName} and ${receiptData.receiverName}`,
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/html\r\n\r\n' +
    htmlContent +
    closeDelimiter;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Drive upload failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function listPaySocialDriveFiles(accessToken: string): Promise<DriveReceiptFile[]> {
  const query = encodeURIComponent("name contains 'PaySocial' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,createdTime,webViewLink,size)&orderBy=createdTime desc&pageSize=20`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to list Google Drive files: ${res.statusText}`);
  }

  const data = await res.json();
  return data.files || [];
}

export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete Google Drive file: ${res.statusText}`);
  }
}

/**
 * Gmail API v1 Helpers
 */

export async function sendGmailPaymentNotice(
  accessToken: string,
  toEmail: string,
  subject: string,
  amount: number,
  senderName: string,
  note: string,
  transactionId: string
): Promise<{ id: string }> {
  const emailLines = [
    `To: ${toEmail}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    `<!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; background: #f4f6f8; padding: 24px;">
        <div style="background: white; border-radius: 12px; padding: 24px; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0;">
          <h2 style="color: #2563eb; margin-top: 0;">PaySocial Payment Notice</h2>
          <p style="font-size: 16px; color: #334155;"><strong>${senderName}</strong> sent you a payment notice on PaySocial!</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="font-size: 28px; font-weight: bold; color: #0f172a; margin: 0;">$${amount.toFixed(2)} USD</p>
            <p style="color: #64748b; margin: 4px 0 0 0;">"${note}"</p>
          </div>
          <p style="font-size: 13px; color: #94a3b8;">Transaction ID: ${transactionId}</p>
        </div>
      </body>
    </html>`,
  ].join('\r\n');

  // Convert to base64url format
  const encodedEmail = btoa(unescape(encodeURIComponent(emailLines)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encodedEmail }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gmail send failed: ${res.status} ${errorText}`);
  }

  return res.json();
}

export async function listGmailPaymentMessages(accessToken: string): Promise<GmailMessageItem[]> {
  const query = encodeURIComponent('subject:(PaySocial OR payment OR receipt)');
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=10`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to list Gmail messages: ${res.statusText}`);
  }

  const data = await res.json();
  if (!data.messages) return [];

  // Fetch details for each message
  const messagesWithDetails = await Promise.all(
    data.messages.slice(0, 8).map(async (msg: { id: string; threadId: string }) => {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!detailRes.ok) return msg;
        const detail = await detailRes.json();
        const headers = detail.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value;
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value;
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value;
        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: detail.snippet,
          subject: subject || 'Payment Notification',
          from: from || 'Google User',
          date: date || '',
        };
      } catch (e) {
        return msg;
      }
    })
  );

  return messagesWithDetails;
}

/**
 * Google People API (Contacts) Helpers
 */

export async function fetchGoogleContacts(accessToken: string): Promise<GoogleContact[]> {
  const url =
    'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,photos,phoneNumbers&pageSize=50';

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Google Contacts: ${res.statusText}`);
  }

  const data = await res.json();
  const connections = data.connections || [];

  return connections.map((person: any) => {
    const name = person.names?.[0]?.displayName || 'Unnamed Contact';
    const email = person.emailAddresses?.[0]?.value;
    const photoUrl = person.photos?.[0]?.url;
    const phoneNumber = person.phoneNumbers?.[0]?.value;

    return {
      resourceName: person.resourceName,
      displayName: name,
      email,
      photoUrl,
      phoneNumber,
    };
  });
}
