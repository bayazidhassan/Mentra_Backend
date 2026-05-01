import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendToEmail = async (
  to: string,
  subject: string,
  html: string,
) => {
  const { data, error } = await resend.emails.send({
    from: 'Mentra <onboarding@resend.dev>',
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
};
