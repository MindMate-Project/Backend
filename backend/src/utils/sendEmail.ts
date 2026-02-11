import nodemailer, { Transporter } from "nodemailer";

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  console.log("EMAIL_USER:", emailUser);
  console.log("EMAIL_PASS exists:", !!emailPass);

  if (!emailUser || !emailPass) {
    throw new Error(
      "Missing required environment variables: EMAIL_USER or EMAIL_PASS."
    );
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
    from: `"Alzahimar" <${emailUser}>`,
    to,
    subject,
    html,
  };

  try {
    console.log("🔄 Verifying SMTP connection...");

    await transporter.verify();
    console.log("✅ SMTP server is ready");

    console.log("📤 Sending email...");

    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully!");
    console.log("'essage ID:", info.messageId);
    console.log("Sent to:", to);
  } catch (error: any) {
    console.error("FULL EMAIL ERROR:");
    console.error(error);

    if (error?.message) {
      console.error("ERROR MESSAGE:", error.message);
    }

    if (error?.code) {
      console.error("ERROR CODE:", error.code);
    }

    throw error; 
  }
};