import nodemailer from 'nodemailer';
import { MailtrapTransport } from 'mailtrap';

// const sendEmail = (options) => {
//   // 1) Create a transporter
//   // 2) Define the email options
//   // 3) Actually send the email
// };

type EmailOptions = {
  from?: string;
  email: string;
  subject: string;
  text: string;
  html?: string;
};

const TOKEN = String(process.env.SEND_EMAIL_TOKEN);

const transport = nodemailer.createTransport(
  MailtrapTransport({
    token: String(TOKEN),
  }),
);

const sender = {
  address: 'hello@demomailtrap.co',
  name: 'Mailtrap Test',
};
// const recipients = ['medo.emadd23@gmail.com'];

// transport
//   .sendMail({
//     from: sender,
//     to: recipients,
//     subject: 'You are awesome!',
//     text: 'Congrats for sending test email with Mailtrap!',
//     category: 'Integration Test',
//   })
//   .then(console.log, console.error);

const sendEmail = async (options: EmailOptions) => {
  await transport.sendMail({
    from: sender,
    to: [options.email],
    subject: options.subject,
    text: options.text,
    // html: options.html,
  });
};

export default sendEmail;
