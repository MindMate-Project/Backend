import * as Brevo from '@getbrevo/brevo';

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {

  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error("Missing BREVO_API_KEY");
  }

  const apiInstance = new Brevo.TransactionalEmailsApi();

  apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    apiKey
  );

  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = {
    name: "Alzahimar",
    email: "mohammedhossam343@gmail.com", 
  };

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email sent successfully to:", to);
  } catch (error) {
    console.error("Brevo Error:", error);
    throw error;
  }
};