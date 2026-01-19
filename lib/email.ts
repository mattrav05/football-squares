import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("Email not configured, skipping send");
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Football Squares" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

export function getGameInviteEmail(
  gameName: string,
  managerName: string,
  joinUrl: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #10b981); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You're Invited!</h1>
        </div>
        <div class="content">
          <p>Hi there!</p>
          <p><strong>${managerName}</strong> has invited you to join their Football Squares game:</p>
          <h2>${gameName}</h2>
          <p>Click the button below to pick your squares:</p>
          <a href="${joinUrl}" class="button">Join Game</a>
          <p>Or copy this link: ${joinUrl}</p>
          <div class="footer">
            <p><strong>Disclaimer:</strong> This platform is a game management tool only. We do not facilitate gambling. Users are responsible for compliance with local laws.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getPaymentReminderEmail(
  playerName: string,
  gameName: string,
  squareCount: number,
  hoursRemaining: number,
  gameUrl: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Reminder</h1>
        </div>
        <div class="content">
          <p>Hi ${playerName},</p>
          <div class="warning">
            <strong>Action Required:</strong> You have ${squareCount} reserved square(s) in "${gameName}" that need payment confirmation.
          </div>
          <p>Your squares will be automatically released in <strong>${hoursRemaining} hours</strong> if payment is not confirmed by the game manager.</p>
          <p>Please contact the game manager to confirm your payment.</p>
          <a href="${gameUrl}" class="button">View Game</a>
          <div class="footer">
            <p><strong>Disclaimer:</strong> This platform is a game management tool only. We do not facilitate gambling.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getPaymentConfirmedEmail(
  playerName: string,
  gameName: string,
  squareCount: number,
  gameUrl: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 12px; margin: 16px 0; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Payment Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi ${playerName},</p>
          <div class="success">
            <strong>Great news!</strong> Your payment for ${squareCount} square(s) in "${gameName}" has been confirmed.
          </div>
          <p>Your squares are now locked in. Good luck!</p>
          <a href="${gameUrl}" class="button">View Your Squares</a>
          <div class="footer">
            <p><strong>Disclaimer:</strong> This platform is a game management tool only. We do not facilitate gambling.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
