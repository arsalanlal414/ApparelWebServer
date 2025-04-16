import nodemailer from 'nodemailer';
import User from '../models/User.js'; // Assuming you have a User model to check existing IDs

const generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const generateUniqueUserId = async () => {
  let isUnique = false;
  let userId;

  while (!isUnique) {
    // Generate ID in the format "USR-ABC25"
    userId = `USR-${generateRandomString(5)}`;

    // Check uniqueness in the database
    const existingUser = await User.findOne({ userId });
    if (!existingUser) {
      isUnique = true;
    }
  }

  return userId;
};

// Generate a random 6-digit reset code
export const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Configure the transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.SMTP_USER || 'arsalanlal41@gmail.com',
    pass: process.env.SMTP_PASS || 'nhqc hqzk ocan orma',
  },
});

export const recoveryCodeEmail = async (user, recoveryCode) => {
  const mailOptions = {
    from: process.env.SMTP_USER, // Sender address
    to: user?.email, // Recipient email
    subject: 'Recovery Code',
    text: `Your Recovery Code is: ${recoveryCode}`,
    html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Recovery Code</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        background: #f6f9fc url(https://apparel-web-app.vercel.app/bg_signup.png) no-repeat center center;
        background-size: cover;
      }

      .email-container {
        max-width: 600px;
        margin: 50px auto;
        padding: 0;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.08);
        overflow: hidden;
      }

      .header-table {
        width: 100%;
        padding: 25px 30px;
      }

      .logo {
        font-size: 22px;
        font-weight: bold;
        color: #1a1a1a;
      }

      .logo span {
        color: #007bff;
      }

      .alert-icon {
        background: #fff3cd;
        color: #f5a623;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }

      .content-table {
        width: 100%;
        text-align: center;
        padding: 40px 30px;
      }

      .email-icon-wrapper {
        background: #e6f0ff;
        width: 75px;
        height: 75px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .email-icon {
        width: 36px;
        height: 36px;
      }

      .title {
        font-size: 20px;
        font-weight: 600;
        margin: 10px 0;
      }

      .code {
        font-size: 18px;
        font-weight: bold;
        color: #333;
        margin-bottom: 20px;
      }

      .description {
        font-size: 14px;
        color: #555;
        margin-bottom: 24px;
      }

      .verify-button {
        display: inline-block;
        padding: 12px 30px;
        color: white;
        background: linear-gradient(45deg, #0014A8 -0.19%, #40C9FF 99.81%);
        border-radius: 8px;
        text-decoration: none;
        font-size: 14px;
        margin-bottom: 20px;
      }

      .footer-table {
        width: 100%;
        padding: 0 30px 30px 30px;
        font-size: 12px;
        color: #888;
        text-align: center;
      }

      .footer strong {
        color: #333;
      }

      .footer-links a {
        font-size: 12px;
        color: #007bff;
        text-decoration: none;
        margin: 0 5px;
      }

      @media screen and (max-width: 600px) {
        .email-container {
          margin: 20px;
        }

        .header-table,
        .content-table,
        .footer-table {
          padding: 20px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <!-- Header Table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 25px 30px;">
        <tr>
          <td align="left" style="font-size: 22px; font-weight: bold; color: #1a1a1a;">
            Lucolyx <span style="color: #007bff;">Design</span>
          </td>
          <td align="right">
            <div style="background: #fff3cd; color: #f5a623; border-radius: 50%; width: 24px; height: 24px; line-height: 24px; text-align: center; font-weight: bold;">!</div>
          </td>
        </tr>
      </table>

      <!-- Content Table -->
      <table class="content-table">
        <tr>
          <td align="center" style="vertical-align: middle; text-align: center;">
            <table role="presentation" align="center" style="width: 75px; height: 75px; background: #e6f0ff; border-radius: 50%; margin: 0 auto;">
              <tr>
                <td align="center" style="vertical-align: middle;">
                  <img class="email-icon" src="https://img.icons8.com/?size=100&id=94&format=png&color=000000" alt="lock" width="36" height="36" />
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <div class="title">${recoveryCode}</div>
            <div class="description">Your OTP to reset your password</div>
          </td>
        </tr>
      </table>

      <!-- Footer Table -->
      <table class="footer-table">
        <tr>
          <td>
            If you did not authorize this action, you can ignore this email.<br />
            This email is intended for <strong>${user.name}</strong>.
            <div class="footer-links" style="margin-top: 10px;">
              <a href="#">Help</a> · <a href="#">Learn More</a>
            </div>
            <div style="margin-top: 20px;">
              © 2025 Appareli. All rights reserved.
            </div>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>
    `,
  };

  try {
    // Send email
    const sendEmail = await transporter.sendMail(mailOptions);
    if (!sendEmail) {
      throw new Error('Failed to send email. Please try again later.');
    }
    console.log('Email sent successfully:', sendEmail.messageId);
    return sendEmail; // Return the result of the email sending
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw new Error('Failed to send recovery code email. Please try again later.');
  }
};

export const verifyAccountEmail = async (user) => {
  const mailOptions = {
    from: process.env.SMTP_USER, // Sender address
    to: user?.email, // Recipient email
    subject: 'Verify Account',
    text: `Your Account has been verified`,
    html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Email Verification</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        background: #f6f9fc url(https://apparel-web-app.vercel.app/bg_signup.png) no-repeat center center;
        background-size: cover;
      }

      .email-container {
        max-width: 600px;
        margin: 50px auto;
        padding: 0;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.08);
        overflow: hidden;
      }

      .header-table {
        width: 100%;
        padding: 25px 30px;
      }

      .logo {
        font-size: 22px;
        font-weight: bold;
        color: #1a1a1a;
      }

      .logo span {
        color: #007bff;
      }

      .alert-icon {
        background: #fff3cd;
        color: #f5a623;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }

      .content-table {
        width: 100%;
        text-align: center;
        padding: 40px 30px;
      }

      .email-icon-wrapper {
        background: #e6f0ff;
        width: 75px;
        height: 75px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .email-icon {
        width: 36px;
        height: 36px;

      }

      .title {
        font-size: 20px;
        font-weight: 600;
        margin: 10px 0;
      }

      .description {
        font-size: 14px;
        color: #555;
        margin-bottom: 24px;
      }

      .verify-button {
        display: inline-block;
        padding: 12px 30px;
        color: #ffffff;
        background: linear-gradient(45deg, #0014A8 -0.19%, #40C9FF 99.81%);
        border-radius: 8px;
        text-decoration: none;
        font-size: 14px;
        margin-bottom: 20px;
      }

      .footer-table {
        width: 100%;
        padding: 0 30px 30px 30px;
        font-size: 12px;
        color: #888;
        text-align: center;
      }

      .footer strong {
        color: #333;
      }

      .footer-links a {
        font-size: 12px;
        color: #007bff;
        text-decoration: none;
        margin: 0 5px;
      }

      @media screen and (max-width: 600px) {
        .email-container {
          margin: 20px;
        }

        .header-table,
        .content-table,
        .footer-table {
          padding: 20px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <!-- Header Table -->
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 25px 30px;">
  <tr>
    <td align="left" style="font-size: 22px; font-weight: bold; color: #1a1a1a;">
      Lucolyx <span style="color: #007bff;">Design</span>
    </td>
    <td align="right">
      <div style="background: #fff3cd; color: #f5a623; border-radius: 50%; width: 24px; height: 24px; line-height: 24px; text-align: center; font-weight: bold;">!</div>
    </td>
  </tr>
</table>

      <!-- Content Table -->
      <table class="content-table">
        <tr>
  <td align="center" style="vertical-align: middle; text-align: center;">
    <table role="presentation" align="center" style="width: 75px; height: 75px; background: #e6f0ff; border-radius: 50%; margin: 0 auto;">
      <tr>
        <td align="center" style="vertical-align: middle;">
          <img class="email-icon" src="https://img.icons8.com/ios-filled/50/007bff/new-post.png" alt="email" width="36" height="36" />
        </td>
      </tr>
    </table>
  </td>
</tr>
        <tr>
          <td>
            <div class="title">Verification</div>
            <div class="description">Click on the button below to get verified!</div>
            <a class="verify-button" style="color:white;" href="http://localhost:5173/account-verified?id=${user._id}">Verify My Email</a>
          </td>
        </tr>
      </table>

      <!-- Footer Table -->
      <table class="footer-table">
        <tr>
          <td>
            If you did not authorize this action, you can ignore this email.<br />
            This email is intended for <strong>${user.name}</strong>.
            <div class="footer-links" style="margin-top: 10px;">
              <a href="#">Help</a> · <a href="#">Learn More</a>
            </div>
            <div style="margin-top: 20px;">
              © 2025 Appareli. All rights reserved.
            </div>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>
`,
  };

  try {
    // Send email
    const sendEmail = await transporter.sendMail(mailOptions);
    if (!sendEmail) {
      throw new Error('Failed to send email. Please try again later.');
    }
    console.log('Email sent successfully:', sendEmail.messageId);
    return sendEmail; // Return the result of the email sending
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw new Error('Failed to send verify code email. Please try again later.');
  }
};

