import nodemailer from 'nodemailer';

export class EmailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'itsjv0994@gmail.com',
      pass: 'unag reut wnmb ywvf',
    },
  });

  async sendMail(to: string, subject: string, text: string) {
    await this.transporter.sendMail({
      from: 'itsjv0994@gmail.com',
      to,
      subject,
      text,
    });
  }
}
