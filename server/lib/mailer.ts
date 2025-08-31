import sgMail from '@sendgrid/mail';

export function initMailer() {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error('SENDGRID_API_KEY not set');
  sgMail.setApiKey(key);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const from = process.env.SENDGRID_FROM_EMAIL || 'no-reply@example.com';
  const msg = {
    to,
    from,
    subject: 'Reset your password',
    text: `Click the link to reset your password: ${resetUrl}`,
    html: `
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}" target="_blank" rel="noopener">Reset your password</a></p>
      <p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>
    `,
  };
  await sgMail.send(msg);
}
