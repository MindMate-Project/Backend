import nodemailer, { Transporter } from "nodemailer";

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error("Missing required environment variables: EMAIL_USER or EMAIL_PASS.");
  }

  const transporter: Transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  const mailOptions = {
    from: emailUser,
    to,
    subject,
    html,
  };

  try {

    await transporter.verify();
    console.log("✅ SMTP server is ready");

    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully to:", to);

  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email.");
  }
};