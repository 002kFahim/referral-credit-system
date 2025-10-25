import nodemailer from "nodemailer";
import { IUser } from "../models/User";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Constructor is now empty - transporter will be initialized lazily
  }

  private initializeTransporter(): void {
    if (this.transporter) return; // Already initialized

    // Clean environment variables (remove quotes if present)
    const smtpHost = (process.env.SMTP_HOST || "").replace(/['"]/g, "");
    const smtpPort = parseInt(
      (process.env.SMTP_PORT || "587").replace(/['"]/g, "")
    );
    const smtpSecure =
      (process.env.SMTP_SECURE || "false")
        .replace(/['"]/g, "")
        .toLowerCase() === "true";
    const smtpUser = (process.env.SMTP_USER || "").replace(/['"]/g, "");
    const smtpPassword = (process.env.SMTP_PASSWORD || "").replace(/['"]/g, "");

    console.log("📧 Email Service Configuration:");
    console.log(`   Host: ${smtpHost}`);
    console.log(`   Port: ${smtpPort}`);
    console.log(`   Secure: ${smtpSecure}`);
    console.log(
      `   User: ${smtpUser ? smtpUser.substring(0, 3) + "***" : "Not set"}`
    );
    console.log(`   Password: ${smtpPassword ? "***" : "Not set"}`);

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
      debug: process.env.NODE_ENV === "development",
      logger: process.env.NODE_ENV === "development",
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      this.initializeTransporter();
      console.log("📧 Testing SMTP connection...");
      await this.transporter!.verify();
      console.log("✅ SMTP connection successful");
      return true;
    } catch (error) {
      console.error("❌ SMTP connection failed:", error);
      return false;
    }
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      this.initializeTransporter();

      const smtpUser = (process.env.SMTP_USER || "").replace(/['"]/g, "");
      const smtpPassword = (process.env.SMTP_PASSWORD || "").replace(
        /['"]/g,
        ""
      );

      if (!smtpUser || !smtpPassword) {
        console.log("📧 Email service not configured, skipping email send");
        return false;
      }

      const smtpFrom = (process.env.SMTP_FROM || smtpUser).replace(/['"]/g, "");

      const mailOptions = {
        from: smtpFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      console.log(`📧 Attempting to send email to ${options.to}...`);
      await this.transporter!.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${options.to}`);
      return true;
    } catch (error: any) {
      console.error("❌ Email send failed:", {
        error: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
      });

      // Provide specific error messages for common issues
      if (error.code === "ECONNREFUSED") {
        console.error("💡 Suggestion: Check if SMTP host and port are correct");
      } else if (error.code === "EAUTH") {
        console.error("💡 Suggestion: Check SMTP username and password");
      } else if (error.responseCode === 535) {
        console.error(
          "💡 Suggestion: Enable 'Less secure app access' or use App Password for Gmail"
        );
      }

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

  async sendPasswordResetEmail(
    user: IUser,
    resetToken: string,
    resetUrl: string
  ): Promise<boolean> {
    const subject = "Reset Your Password - ReferralCredit";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.firstName}!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            We received a request to reset your password for your ReferralCredit account. 
            If you didn't make this request, you can safely ignore this email.
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
            To reset your password, click the button below. This link will expire in 1 hour for security reasons.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Reset My Password
            </a>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          
          <p style="color: #2563eb; word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 5px; margin-bottom: 30px;">
            ${resetUrl}
          </p>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #9ca3af; font-size: 14px; margin-bottom: 10px;">
              <strong>Security Tips:</strong>
            </p>
            <ul style="color: #9ca3af; font-size: 14px; margin: 0; padding-left: 20px;">
              <li>This link expires in 1 hour</li>
              <li>Only use this link if you requested a password reset</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>
          
          <p style="color: #666; margin-top: 30px;">Best regards,<br>The ReferralCredit Team</p>
        </div>
      </div>
    `;

    const textContent = `
Password Reset Request

Hello ${user.firstName}!

We received a request to reset your password for your ReferralCredit account.

To reset your password, visit this link: ${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
The ReferralCredit Team
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html,
      text: textContent,
    });
  }

  async sendPasswordResetConfirmationEmail(user: IUser): Promise<boolean> {
    const subject = "Password Successfully Reset - ReferralCredit";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #059669; margin: 0; font-size: 28px;">✅ Password Reset Successful</h1>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${
            user.firstName
          }!</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Your password has been successfully reset for your ReferralCredit account.
          </p>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
            You can now log in to your account using your new password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:3000"
            }/login" 
               style="background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Login to Your Account
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #dc2626; font-size: 14px; margin-bottom: 10px;">
              <strong>⚠️ Security Notice:</strong>
            </p>
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              If you didn't reset your password, please contact our support team immediately 
              as your account may have been compromised.
            </p>
          </div>
          
          <p style="color: #666; margin-top: 30px;">Best regards,<br>The ReferralCredit Team</p>
        </div>
      </div>
    `;

    const textContent = `
Password Reset Successful

Hello ${user.firstName}!

Your password has been successfully reset for your ReferralCredit account.

You can now log in to your account using your new password.

Login at: ${process.env.FRONTEND_URL || "http://localhost:3000"}/login

Security Notice: If you didn't reset your password, please contact our support team immediately.

Best regards,
The ReferralCredit Team
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      html,
      text: textContent,
    });
  }
}

export const emailService = new EmailService();
