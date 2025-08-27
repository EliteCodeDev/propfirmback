import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

@Injectable()
export class MailerService {
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('mailer.host'),
      port: this.configService.get<number>('mailer.port'),
      secure: this.configService.get<number>('mailer.port') === 465,
      auth: {
        user: this.configService.get<string>('mailer.user'),
        pass: this.configService.get<string>('mailer.pass'),
      },
    });
  }

  async sendMail({ to, subject, template, context }) {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'templates',
      `${template}.hbs`,
    );
    const templateString = fs.readFileSync(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(templateString);
    const html = compiledTemplate(context);

    const mailOptions = {
      from: this.configService.get<string>('mailer.from'),
      to,
      subject,
      html,
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendRawMail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }) {
    const mailOptions = {
      from: this.configService.get<string>('mailer.from'),
      to,
      subject,
      html,
    };

    return this.transporter.sendMail(mailOptions);
  }
}
