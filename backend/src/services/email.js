import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail({ to, subject, html }) {
  if (!process.env.EMAIL_USER) {
    console.log('[EMAIL] Skipping — no EMAIL_USER configured. Would send:', subject, 'to', to);
    return { sent: false, reason: 'no_config' };
  }
  try {
    const info = await transporter.sendMail({
      from: `"Venderra POS" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('[EMAIL] Sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EMAIL] Failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

export function welcomeEmail(businessName, userName) {
  return {
    subject: `Welcome to Venderra POS, ${userName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0d9488, #10b981); padding: 30px; border-radius: 12px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Venderra</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 8px;">Uganda's most trusted POS platform</p>
        </div>
        <div style="padding: 30px; background: #f8fafc; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1e293b;">Hi ${userName},</h2>
          <p style="color: #475569; line-height: 1.6;">Your business <strong>${businessName}</strong> has been created on Venderra POS. You're ready to start selling!</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
            <h3 style="color: #0d9488; margin-top: 0;">Quick Start Guide:</h3>
            <ol style="color: #475569; line-height: 1.8;">
              <li>Add your products (with barcodes if available)</li>
              <li>Set up your staff accounts</li>
              <li>Start making sales from the POS terminal</li>
              <li>Track stock levels and expenses in real-time</li>
            </ol>
          </div>
          <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 30px;">
            Need help? Contact us at support@venderra.ug
          </p>
        </div>
      </div>
    `,
  };
}

export function passwordResetEmail(resetUrl) {
  return {
    subject: 'Reset Your Venderra Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0d9488, #10b981); padding: 30px; border-radius: 12px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc; border-radius: 0 0 12px 12px;">
          <p style="color: #475569; line-height: 1.6;">You requested a password reset for your Venderra POS account. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #0d9488, #10b981); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `,
  };
}

export function dailySummaryEmail(businessName, summary) {
  return {
    subject: `Daily Summary — ${businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0d9488, #10b981); padding: 30px; border-radius: 12px; text-align: center;">
          <h1 style="color: white; margin: 0;">Daily Summary</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 5px;">${businessName}</p>
        </div>
        <div style="padding: 30px; background: #f8fafc; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Total Sales</td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0d9488;">UGX ${summary.totalSales?.toLocaleString()}</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Transactions</td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${summary.transactionCount}</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Products Sold</td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${summary.itemsSold}</td></tr>
            <tr><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">Low Stock Items</td><td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #f59e0b;">${summary.lowStockCount}</td></tr>
            <tr><td style="padding: 12px; color: #64748b;">Out of Stock</td><td style="padding: 12px; text-align: right; font-weight: bold; color: #ef4444;">${summary.outOfStockCount}</td></tr>
          </table>
        </div>
      </div>
    `,
  };
}

export function subscriptionExpiryEmail(businessName, daysLeft) {
  return {
    subject: `Your Venderra subscription expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #f97316); padding: 30px; border-radius: 12px; text-align: center;">
          <h1 style="color: white; margin: 0;">Subscription Expiring</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc; border-radius: 0 0 12px 12px;">
          <p style="color: #475569; line-height: 1.6;">Your Venderra POS subscription for <strong>${businessName}</strong> expires in <strong>${daysLeft} day${daysLeft > 1 ? 's' : ''}</strong>.</p>
          <p style="color: #475569;">Please renew your subscription to continue using all features.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings" style="background: linear-gradient(135deg, #0d9488, #10b981); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Renew Now</a>
          </div>
        </div>
      </div>
    `,
  };
}
