import nodemailer from "nodemailer";

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail(payload: EmailPayload): Promise<{ sent: boolean; note?: string; error?: string }> {
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_FROM || "noreply@fleetcommand.app";

  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: payload.to,
          subject: payload.subject,
          text: payload.text,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        return { sent: false, error: `Resend error: ${JSON.stringify(err)}` };
      }
      return { sent: true };
    } catch (err) {
      return { sent: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (smtpHost && smtpUser && smtpPassword) {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });

    try {
      await transporter.sendMail({
        from: fromEmail,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
      });
      return { sent: true, note: "Sent via SMTP" };
    } catch (err) {
      return { sent: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  console.log(`[email] No email provider configured. Would send to ${payload.to}:\nSubject: ${payload.subject}\n${payload.text}`);
  return { sent: true, note: "No email provider configured; email logged to server console instead." };
}