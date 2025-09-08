import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { StylesService } from '../styles/styles.service';
import { UsersService } from '../users/services/users.service';
import { mailerConfig } from 'src/config';
@Injectable()
export class MailerService {
  private transporter: Transporter;
  private readonly defaultStyle: any;
  constructor(
    @Inject(mailerConfig.KEY)
    private readonly cfg: ConfigType<typeof mailerConfig>,
    private readonly configService: ConfigService,
    private readonly stylesService: StylesService,
    private readonly usersService: UsersService,
  ) {
    const { host, port, user, pass } = this.cfg;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
    this.defaultStyle = {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      tertiaryColor: '#28a745',
      banner: this.configService.get<string>('DEFAULT_BANNER_URL') || '',
      companyName: 'FundingHero',
      landingURL: 'https://propfirm.com',
    };
  }

  async sendMail({ to, subject, template, context }) {
    // Obtener el estilo activo de la base de datos
    const activeStyle = await this.stylesService.findActiveStyle();
    const styleData = activeStyle || this.defaultStyle;

    // Combinar el contexto proporcionado con los datos de estilo
    const enrichedContext = {
      ...styleData,
      currentYear: new Date().getFullYear(),
      ...context, // El contexto proporcionado tiene prioridad
    };

    const templatePath = path.join(
      process.cwd(),
      'src',
      'templates',
      `${template}.hbs`,
    );
    const templateString = fs.readFileSync(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(templateString);
    const html = compiledTemplate(enrichedContext);

    const mailOptions = {
      from: this.cfg.from,
      to,
      subject,
      html,
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendRawMail({ to, subject, html }) {
    const mailOptions = {
      from: this.cfg.from,
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
    const styleData = activeStyle || this.defaultStyle;

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
