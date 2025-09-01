import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { StylesService } from '../styles/styles.service';
import { UsersService } from '../users/services/users.service';

@Injectable()
export class MailerService {
  private transporter: Transporter;

  constructor(
    private readonly configService: ConfigService,
    private readonly stylesService: StylesService,
    private readonly usersService: UsersService,
  ) {
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

  async sendAdminMail({
    to,
    subject,
    title,
    body,
  }: {
    to: string;
    subject: string;
    title?: string;
    body: string;
  }) {
    // Obtener el estilo activo de la base de datos
    const activeStyle = await this.stylesService.findActiveStyle();
    
    // Intentar obtener información del usuario por email
    let userInfo = null;
    try {
      userInfo = await this.usersService.findByEmail(to);
    } catch (error) {
      // Si no se encuentra el usuario, continuamos sin su información
    }
    
    // Valores por defecto si no hay estilo activo
    const defaultStyle = {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      tertiaryColor: '#28a745',
      banner: this.configService.get<string>('DEFAULT_BANNER_URL') || '',
      companyName: 'PropFirm',
      landingURL: 'https://propfirm.com',
    };

    const styleData = activeStyle || defaultStyle;

    const context = {
      ...styleData,
      title,
      body,
      subject,
      currentYear: new Date().getFullYear(),
      userFirstName: userInfo?.firstName || null,
      userLastName: userInfo?.lastName || null,
      userEmail: to,
    };

    return this.sendMail({
      to,
      subject,
      template: 'admin-email',
      context,
    });
  }
}
