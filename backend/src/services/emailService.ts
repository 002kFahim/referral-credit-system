import nodemailer from "nodemailer";
import { IUser } from "../models/User";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.log("📧 Email service not configured, skipping email send");
        return false;
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      console.error("📧 Email send failed:", error);
      return false;
    }
  }

  async sendWelcomeEmail(user: IUser): Promise<boolean> {
    const subject = "Welcome to ReferralCredit System! 🎉";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to ReferralCredit System! 🎉</h2>
        
        <p>Hi ${user.firstName},</p>
        
        <p>Welcome to our referral credit system! Your account has been successfully created.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">Your Referral Details:</h3>
          <p><strong>Your Referral Code:</strong> <span style="background-color: #2563eb; color: white; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${user.referralCode}</span></p>
          <p><strong>Current Credits:</strong> ${user.credits}</p>
        </div>
        
        <h3 style="color: #1f2937;">How it works:</h3>
        <ul>
          <li>Share your referral code with friends</li>
          <li>When they sign up and make their first purchase, you both earn credits!</li>
          <li>Use your credits for future purchases</li>
        </ul>
        
        <p>Start referring friends today and earn rewards!</p>
        
        <p>Best regards,<br>The ReferralCredit Team</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html,
      text: `Welcome to ReferralCredit System! Your referral code is: ${user.referralCode}`,
    });
  }

  async sendReferralSuccessEmail(
    referrer: IUser,
    referredUser: IUser
  ): Promise<boolean> {
    const subject = `🎉 ${referredUser.firstName} ${referredUser.lastName} used your referral code!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Great News! Your Friend Joined! 🎉</h2>
        
        <p>Hi ${referrer.firstName},</p>
        
        <p>Exciting news! Your friend <strong>${referredUser.firstName} ${
      referredUser.lastName
    }</strong> (${
      referredUser.email
    }) just signed up using your referral code <strong>${
      referrer.referralCode
    }</strong>!</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="color: #15803d; margin-top: 0;">Referral Details:</h3>
          <p style="color: #166534; margin: 5px 0;"><strong>Friend's Name:</strong> ${
            referredUser.firstName
          } ${referredUser.lastName}</p>
          <p style="color: #166534; margin: 5px 0;"><strong>Email:</strong> ${
            referredUser.email
          }</p>
          <p style="color: #166534; margin: 5px 0;"><strong>Joined:</strong> ${new Date().toLocaleDateString()}</p>
          <p style="color: #166534; margin: 5px 0;"><strong>Their Referral Code:</strong> ${
            referredUser.referralCode
          }</p>
        </div>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="color: #1d4ed8; margin-top: 0;">What happens next:</h3>
          <ul style="color: #1e40af;">
            <li>When ${
              referredUser.firstName
            } makes their first purchase, you'll both earn credits!</li>
            <li>You'll receive an email notification when credits are awarded</li>
            <li>Credits can be used for future purchases</li>
            <li>You can reach out to ${
              referredUser.firstName
            } to help them get started!</li>
          </ul>
        </div>
        
        <p>Keep sharing your referral code <strong>${
          referrer.referralCode
        }</strong> to earn more rewards!</p>
        
        <p>Best regards,<br>The ReferralCredit Team</p>
      </div>
    `;

    return this.sendEmail({
      to: referrer.email,
      subject,
      html,
      text: `Your friend ${referredUser.firstName} ${referredUser.lastName} (${referredUser.email}) just signed up using your referral code ${referrer.referralCode}!`,
    });
  }

  async sendCreditsEarnedEmail(
    user: IUser,
    creditsEarned: number,
    purchaserInfo: {
      name: string;
      email: string;
      amount: number;
      description?: string;
    }
  ): Promise<boolean> {
    const subject = `💰 ${purchaserInfo.name} made a purchase - You earned ${creditsEarned} credits!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Your Referral Made a Purchase! 💰</h2>
        
        <p>Hi ${user.firstName},</p>
        
        <p>Exciting news! Your friend <strong>${
          purchaserInfo.name
        }</strong> just made their first purchase, and you've earned <strong>${creditsEarned} credits</strong>!</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280;">
          <h3 style="color: #374151; margin-top: 0;">Purchase Details:</h3>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Customer:</strong> ${
            purchaserInfo.name
          }</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Email:</strong> ${
            purchaserInfo.email
          }</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Purchase Amount:</strong> ${
            purchaserInfo.amount
          }</p>
          ${
            purchaserInfo.description
              ? `<p style="color: #4b5563; margin: 5px 0;"><strong>Item:</strong> ${purchaserInfo.description}</p>`
              : ""
          }
          <p style="color: #4b5563; margin: 5px 0;"><strong>Purchase Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #b91c1c; margin-top: 0;">Your Reward:</h3>
          <p style="color: #991b1b; margin: 5px 0;"><strong>Credits Earned:</strong> ${creditsEarned} credits</p>
          <p style="color: #991b1b; margin: 5px 0;"><strong>Reward Rate:</strong> 10% of purchase amount</p>
          <p style="color: #991b1b; margin: 5px 0;"><strong>Your Total Credits:</strong> ${
            user.credits
          } credits</p>
        </div>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1d4ed8; margin-top: 0;">What's Next:</h3>
          <p style="color: #1e40af;">• Use your credits for future purchases</p>
          <p style="color: #1e40af;">• Keep sharing your referral code to earn more</p>
          <p style="color: #1e40af;">• Thank ${
            purchaserInfo.name
          } for using your referral!</p>
        </div>
        
        <p>Keep referring friends to earn more rewards!</p>
        
        <p>Best regards,<br>The ReferralCredit Team</p>
      </div>
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html,
      text: `${purchaserInfo.name} (${purchaserInfo.email}) made a purchase of ${purchaserInfo.amount}. You earned ${creditsEarned} credits! Total credits: ${user.credits}`,
    });
  }

  async sendReferralWelcomeEmail(
    referredUser: IUser,
    referrer: IUser
  ): Promise<boolean> {
    const referrerName = `${referrer.firstName} ${referrer.lastName}`;
    const subject = `Welcome! You were referred by ${referrerName} 🎉`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to ReferralCredit System! 🎉</h2>
        
        <p>Hi ${referredUser.firstName},</p>
        
        <p>Welcome! You were referred by your friend <strong>${referrerName}</strong> and have successfully joined our referral credit system.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280;">
          <h3 style="color: #374151; margin-top: 0;">Who Referred You:</h3>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Name:</strong> ${referrerName}</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Email:</strong> ${
            referrer.email
          }</p>
          <p style="color: #4b5563; margin: 5px 0;"><strong>Their Referral Code:</strong> ${
            referrer.referralCode
          }</p>
          <p style="color: #4b5563; margin: 5px 0;"><em>Feel free to reach out and thank them for the referral!</em></p>
        </div>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="color: #1d4ed8; margin-top: 0;">Your Account Details:</h3>
          <p><strong>Your Referral Code:</strong> <span style="background-color: #2563eb; color: white; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${
            referredUser.referralCode
          }</span></p>
          <p><strong>Current Credits:</strong> ${referredUser.credits}</p>
          <p><strong>Account Created:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #15803d; margin-top: 0;">Special Bonus! 🎁</h3>
          <p>When you make your first purchase, both you and ${referrerName} will earn bonus credits!</p>
          <p>This is our way of saying thank you for joining through a friend's recommendation.</p>
        </div>
        
        <p>Start exploring and don't forget to share your own referral code <strong>${
          referredUser.referralCode
        }</strong> with friends!</p>
        
        <p>Best regards,<br>The ReferralCredit Team</p>
      </div>
    `;

    return this.sendEmail({
      to: referredUser.email,
      subject,
      html,
      text: `Welcome! You were referred by ${referrerName} (${referrer.email}). Your referral code is: ${referredUser.referralCode}`,
    });
  }
}

export const emailService = new EmailService();
