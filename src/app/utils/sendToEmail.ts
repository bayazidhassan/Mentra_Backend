import nodemailer from 'nodemailer';

export const sendToEmail = async (
  to: string,
  subject: string,
  html: string,
) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.APP_EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });
  await transporter.sendMail({
    from: process.env.APP_EMAIL,
    to,
    subject,
    html,
  });
};
