import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MailerService } from './mailer.service';
import { SendMailDto } from './dto/send-mail.dto';
import { Auth } from 'src/common/decorators/auth.decorator';

@ApiTags('Mailer')
@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

  @Post('send')
  @Auth('admin')
  @ApiOperation({ summary: 'Send an email' })
  async send(@Body() dto: SendMailDto) {
    if (dto.html) {
      return this.mailerService.sendRawMail({
        to: dto.to,
        subject: dto.subject,
        html: dto.html,
      });
    }
    if (dto.template) {
      return this.mailerService.sendMail({
        to: dto.to,
        subject: dto.subject,
        template: dto.template,
        context: dto.context || {},
      });
    }
    return { error: 'Either html or template must be provided' };
  }

  @Post('send-admin')
  @Auth('admin')
  @ApiOperation({ summary: 'Send a styled admin email using company branding' })
  async sendAdmin(
    @Body() dto: { to: string; subject: string; title?: string; body: string },
  ) {
    return this.mailerService.sendAdminMail(dto);
  }
}
