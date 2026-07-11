const BASE_URL = 'https://api.africastalking.com/version1';
const API_KEY = process.env.SMS_API_KEY;
const USERNAME = process.env.SMS_USERNAME || 'venderra';

export async function sendSMS(phoneNumber, message) {
  if (!API_KEY) {
    console.log('[SMS] Skipping — no SMS_API_KEY configured. Would send to:', phoneNumber);
    return { sent: false, reason: 'no_config' };
  }

  try {
    const params = new URLSearchParams();
    params.append('username', USERNAME);
    params.append('to', phoneNumber);
    params.append('message', message);

    const response = await fetch(`${BASE_URL}/messaging`, {
      method: 'POST',
      headers: {
        'apiKey': API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: params.toString(),
    });

    const data = await response.json();
    console.log('[SMS] Sent:', JSON.stringify(data));
    return { sent: true, data };
  } catch (err) {
    console.error('[SMS] Failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

export function lowStockSMS(businessName, products) {
  const list = products.slice(0, 5).map(p => `${p.name} (${p.quantity})`).join(', ');
  return `${businessName}: Low stock alert! ${list}${products.length > 5 ? ` and ${products.length - 5} more` : ''}. Check Venderra POS for details.`;
}

export function dailySummarySMS(businessName, summary) {
  return `${businessName} Daily Summary:\nSales: UGX ${summary.totalSales?.toLocaleString()}\nTransactions: ${summary.transactionCount}\nLow Stock: ${summary.lowStockCount} items`;
}
