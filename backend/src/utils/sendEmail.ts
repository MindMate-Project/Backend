import nodemailer, { Transporter } from "nodemailer";
export const sendEmail = async (to: string , subject : string, html : string) : Promise<void> => {
  //console.log("user : ",process.env.EMAIL_USER)
  const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
        throw new Error("Missing required environment variables: EMAIL_USER or EMAIL_PASS.");
    }
  const transporter:Transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: emailUser,
      pass:  emailPass
    }
  });

  const mailOptions = {
    from: emailUser,
    to : to ,
    subject : subject,
    html: html
  };
  try {
     
        await transporter.sendMail(mailOptions);
         console.log("Email sent successfully to:", to);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email.");
    }
 
};