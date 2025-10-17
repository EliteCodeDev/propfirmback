import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Raw } from 'typeorm';
import { Verification } from './entities/verification.entity';
import { Media } from './entities/media.entity';
import { CreateVerificationDto } from './dto/create-verification.dto';
import { UpdateVerificationDto } from './dto/update-verification.dto';
import { VerificationStatus } from 'src/common/enums/verification-status.enum';
import { MediaType } from 'src/common/enums/media-type.enum';
import { DocumentType } from 'src/common/enums/verification-document-type.enum';
import { MinioService } from 'src/modules/storage/minio/minio.service';
import { MailerService } from 'src/modules/mailer/mailer.service';
import { UserAccount } from '../users/entities';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SaveVeriffSessionDto } from './dto/veriff-session.dto';
@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    private minioService: MinioService,
    private mailerService: MailerService,
    @InjectRepository(UserAccount)
    private userAccountRepository: Repository<UserAccount>,
    private configService: ConfigService,
  ) {}

  /**
   * Maneja eventos del webhook de Veriff (created, started, submitted, etc.)
   * Intenta asociar el evento con el usuario usando `vendorData`.
   */
  async handleVeriffEvent(payload: any, signature?: string) {
    // Verificación opcional de firma
    const ok = this.verifyVeriffSignature(payload, signature);
    if (!ok) {
      // No rechazamos duro; registramos y continuamos para facilitar pruebas locales
      // throw new BadRequestException('Invalid Veriff signature');
    }

    const vendorData = this.extractVendorData(payload);
    const status = this.mapEventStatus(payload);

    if (!vendorData) {
      return { success: false, message: 'vendorData missing' };
    }

    const userID = await this.resolveUserIdFromVendorData(vendorData);
    if (!userID) {
      return { success: false, message: 'user not found from vendorData' };
    }

    // Buscar última verificación del usuario y actualizar estado, o crear una si no existe
    let latest = await this.verificationRepository.findOne({
      where: { userID },
      order: { submittedAt: 'DESC' },
    });

    if (!latest) {
      latest = this.verificationRepository.create({
        userID,
        status,
        documentType: DocumentType.OTHER,
      });
      latest = await this.verificationRepository.save(latest);
    } else {
      latest.status = status;
      latest = await this.verificationRepository.save(latest);
    }

    return { success: true, verificationID: latest.verificationID, status };
  }

  /**
   * Maneja el webhook de decisión de Veriff (approved/rejected/resubmission_requested).
   */
  async handleVeriffDecision(payload: any, signature?: string) {
    const ok = this.verifyVeriffSignature(payload, signature);
    if (!ok) {
      // throw new BadRequestException('Invalid Veriff signature');
    }

    const vendorData = this.extractVendorData(payload);
    const decision = this.mapDecisionStatus(payload);
    const rejectionReason = this.extractRejectionReason(payload);

    if (!vendorData || !decision) {
      return { success: false, message: 'vendorData or decision missing' };
    }

    const userID = await this.resolveUserIdFromVendorData(vendorData);
    if (!userID) {
      return { success: false, message: 'user not found from vendorData' };
    }

    // Usar la verificación más reciente del usuario como objetivo
    const verification = await this.verificationRepository.findOne({
      where: { userID },
      order: { submittedAt: 'DESC' },
      relations: ['user'],
    });

    if (!verification) {
      // Crear una nueva si no existe para no perder el evento
      const created = await this.verificationRepository.save(
        this.verificationRepository.create({
          userID,
          status: decision,
          documentType: DocumentType.OTHER,
          rejectionReason,
        }),
      );
      // Enviar correo acorde al estado
      await this.sendVerificationStatusEmail(created, decision);
      // Actualizar flag de usuario si aprobado
      if (decision === VerificationStatus.APPROVED) {
        await this.userAccountRepository.update({ userID }, { isVerified: true });
      }
      return { success: true, verificationID: created.verificationID, status: decision };
    }

    // Actualizar utilizando la lógica central existente
    const updated = await this.update(verification.verificationID, {
      status: decision,
      rejectionReason,
    } as UpdateVerificationDto);

    return { success: true, verificationID: updated.verificationID, status: decision };
  }

  private verifyVeriffSignature(payload: any, signature?: string): boolean {
    try {
      const sharedSecret = this.configService.get<string>('veriff.sharedSecret');
      if (!sharedSecret || !signature) return true; // firmado opcional
      const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const hmac = crypto.createHmac('sha256', sharedSecret).update(raw).digest('hex');
      const normalized = String(signature).replace(/^sha256=/i, '').trim();
      return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(normalized));
    } catch {
      return false;
    }
  }

  private extractVendorData(payload: any): any {
    const vd =
      payload?.vendorData ||
      payload?.verification?.vendorData ||
      payload?.session?.vendorData ||
      payload?.context?.vendorData;
    return vd;
  }

  private normalizeVendorData(vd: any): { obj?: any; str?: string } {
    if (vd == null) return {};
    if (typeof vd === 'string') {
      const s = vd.trim();
      try {
        const obj = JSON.parse(s);
        return { obj, str: s };
      } catch {
        return { str: s };
      }
    }
    if (typeof vd === 'object') return { obj: vd };
    return { str: String(vd) };
  }

  private getUuidFromObject(obj: any): string | undefined {
    if (!obj || typeof obj !== 'object') return;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const queue: any[] = [obj];
    while (queue.length) {
      const curr = queue.shift()!;
      for (const [k, v] of Object.entries(curr)) {
        const key = k.toLowerCase().replace(/[\s_\-]/g, '');
        // Prefer candidate keys that often carry user IDs
        const keySuggestsUserId =
          key.includes('userid') ||
          (key.includes('usuario') && key.includes('id')) ||
          key === 'id';

        if (keySuggestsUserId) {
          if (typeof v === 'string' && uuidRegex.test(v)) return v;
          if (
            typeof v === 'object' &&
            v &&
            typeof (v as any).id === 'string' &&
            uuidRegex.test((v as any).id)
          ) {
            return (v as any).id;
          }
        }
        // Direct string value that looks like UUID
        if (typeof v === 'string' && uuidRegex.test(v)) return v;
        if (typeof v === 'object' && v) queue.push(v as any);
      }
    }
    return undefined;
  }

  private getEmailOrUsernameFromObject(obj: any): { email?: string; username?: string } {
    if (!obj || typeof obj !== 'object') return {};
    const queue: any[] = [obj];
    while (queue.length) {
      const curr = queue.shift()!;
      for (const [k, v] of Object.entries(curr)) {
        const key = k.toLowerCase();
        if (typeof v === 'string') {
          if (key.includes('email') || key.includes('correo') || v.includes('@')) {
            return { email: v };
          }
          if (key.includes('username') || key.includes('usuario') || key.includes('user')) {
            return { username: v };
          }
        } else if (typeof v === 'object' && v) {
          queue.push(v as any);
        }
      }
    }
    return {};
  }

  private async resolveUserIdFromVendorData(vendorData: any): Promise<string | undefined> {
    const { obj, str } = this.normalizeVendorData(vendorData);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    // 1) If vendorData string is a UUID, return directly
    if (str && uuidRegex.test(str)) return str;

    // 2) Try to extract UUID from object
    const uuidFromObj = obj && this.getUuidFromObject(obj);
    if (uuidFromObj) return uuidFromObj;

    // 3) If vendorData string is email/username
    if (str) {
      const trimmed = str.trim();
      if (trimmed.includes('@')) {
        const userByEmail = await this.userAccountRepository.findOne({ where: { email: trimmed } });
        if (userByEmail) return userByEmail.userID;
      } else {
        const userByUsername = await this.userAccountRepository.findOne({ where: { username: trimmed } });
        if (userByUsername) return userByUsername.userID;
      }
    }

    // 4) Try to find email or username inside object
    if (obj) {
      const { email, username } = this.getEmailOrUsernameFromObject(obj);
      if (email) {
        const u = await this.userAccountRepository.findOne({ where: { email } });
        if (u) return u.userID;
      }
      if (username) {
        const u = await this.userAccountRepository.findOne({ where: { username } });
        if (u) return u.userID;
      }
    }

    return undefined;
  }

  private mapEventStatus(payload: any): VerificationStatus {
    const event = (payload?.event || payload?.type || '').toString().toLowerCase();
    // Mapear eventos típicos
    if (event.includes('created')) return VerificationStatus.CREATED;
    if (event.includes('started')) return VerificationStatus.STARTED;
    if (event.includes('submitted')) return VerificationStatus.SUBMITTED;
    return VerificationStatus.PENDING;
  }

  private mapDecisionStatus(payload: any): VerificationStatus | undefined {
    const decision = (
      payload?.decision?.status ||
      payload?.decision ||
      payload?.status ||
      ''
    )
      .toString()
      .toLowerCase();

    if (['approved', 'accept', 'accepted', 'approve'].includes(decision)) {
      return VerificationStatus.APPROVED;
    }
    if (['declined', 'rejected', 'reject', 'fail', 'failed'].includes(decision)) {
      return VerificationStatus.REJECTED;
    }
    if (['resubmission_requested', 'resubmit', 'resubmission'].includes(decision)) {
      return VerificationStatus.RESUBMISSION_REQUESTED;
    }
    return undefined;
  }

  private extractRejectionReason(payload: any): string | undefined {
    const fields = [
      payload?.decision?.reason,
      payload?.reason,
      payload?.message,
      payload?.details,
    ];
    const reason = fields.find((x) => !!x);
    return typeof reason === 'string' ? reason : undefined;
  }

  async createVerification(
    userID: string,
    createVerificationDto: CreateVerificationDto,
    files?: any[],
  ): Promise<Verification> {
    //create verification

    const verification = await this.create(
      userID,
      createVerificationDto,
      files,
    );
    const user = await this.userAccountRepository.findOne({
      where: { userID: userID },
    });
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Verification in Process',
      template: 'verification-in-process',
      context: {
        firstName: user.firstName,
        lastName: user.lastName,
        verificationID: verification.verificationID,
        currentYear: new Date().getFullYear(),
      },
    });
    return verification;
    //send email to user
  }
  async create(
    userID: string,
    createVerificationDto: CreateVerificationDto,
    files?: any[],
  ): Promise<Verification> {
    const verification = this.verificationRepository.create({
      ...createVerificationDto,
      userID,
      status: VerificationStatus.PENDING,
    });

    const savedVerification =
      await this.verificationRepository.save(verification);

    // Si hay archivos, guardarlos en MinIO
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = this.getFileTypeFromIndex(i); // front, back, selfie
        const folderPath = `verifications/${userID}/${savedVerification.verificationID}`;

        const uploadResult = await this.minioService.uploadFile(
          file,
          folderPath,
        );

        // Crear registro en Media
        const media = this.mediaRepository.create({
          url: uploadResult.url,
          type: this.getMediaType(file.mimetype),
          scope: 'verification',
          verificationID: savedVerification.verificationID,
        });

        await this.mediaRepository.save(media);
      }
    }

    return savedVerification;
  }

  // ^ ILike (Postgres). Si no usas Postgres, mira la variante con Raw más abajo.

  async findAll(query: any) {
    const { page = 1, limit = 10, status, documentType } = query;
    const rawSearch: string | undefined = (query.search || query.q || '')?.toString();
    const search = rawSearch?.trim();

    const take = Math.min(Math.max(+limit || 10, 1), 100);
    const currentPage = Math.max(+page || 1, 1);
    const skip = (currentPage - 1) * take;

    const qb = this.verificationRepository
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.user', 'u')
      .leftJoinAndSelect('v.media', 'm')
      .orderBy('v.submittedAt', 'DESC')
      .skip(skip)
      .take(take);

    if (status) {
      qb.andWhere('v.status = :status', { status });
    }
    if (documentType) {
      qb.andWhere('v.documentType = :documentType', { documentType });
    }
    if (search) {
      qb.andWhere(
        '(u.firstName ILIKE :q OR u.lastName ILIKE :q OR u.email ILIKE :q OR u.username ILIKE :q OR v.numDocument ILIKE :q)',
        { q: `%${search}%` },
      );
    }

    const [verifications, total] = await qb.getManyAndCount();

    return {
      data: verifications,
      total,
      page: currentPage,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findByUserId(userID: string, query: any) {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const whereConditions: any = { userID };
    if (status) {
      whereConditions.status = status;
    }

    const [verifications, total] =
      await this.verificationRepository.findAndCount({
        where: whereConditions,
        skip,
        take: limit,
        order: { submittedAt: 'DESC' },
        relations: ['media'],
      });

    return {
      data: verifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Verification> {
    const verification = await this.verificationRepository.findOne({
      where: { verificationID: id },
      relations: ['user', 'media'],
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    return verification;
  }

  async update(
    id: string,
    updateVerificationDto: UpdateVerificationDto,
  ): Promise<Verification> {
    const verification = await this.findOne(id);
    const previousStatus = verification.status;

    Object.assign(verification, updateVerificationDto);

    if (updateVerificationDto.status === VerificationStatus.APPROVED) {
      verification.approvedAt = new Date();

      // Actualizar el campo isVerified del usuario cuando se aprueba la verificación
      await this.userAccountRepository.update(
        { userID: verification.userID },
        { isVerified: true },
      );
    } else if (updateVerificationDto.status === VerificationStatus.REJECTED) {
      verification.rejectedAt = new Date();
    }

    const updatedVerification =
      await this.verificationRepository.save(verification);

    // Enviar correo solo si el estado cambió
    if (previousStatus !== updateVerificationDto.status) {
      await this.sendVerificationStatusEmail(
        updatedVerification,
        updateVerificationDto.status,
      );
    }

    return updatedVerification;
  }

  private async sendVerificationStatusEmail(
    verification: Verification,
    newStatus: VerificationStatus,
  ): Promise<void> {
    try {
      const user = verification.user;
      const clientUrl = this.configService.get<string>('app.clientUrl');
      const dashboardUrl = `${clientUrl}/dashboard`;

      if (newStatus === VerificationStatus.APPROVED) {
        await this.mailerService.sendMail({
          to: user.email,
          subject: 'Verification Approved',
          template: 'verification-approved',
          context: {
            firstName: user.firstName,
            lastName: user.lastName,
            verificationID: verification.verificationID,
            currentYear: new Date().getFullYear(),
            dashboardUrl,
          },
        });
      } else if (newStatus === VerificationStatus.REJECTED) {
        await this.mailerService.sendMail({
          to: user.email,
          subject: 'Verification Rejected',
          template: 'verification-rejected',
          context: {
            firstName: user.firstName,
            lastName: user.lastName,
            verificationID: verification.verificationID,
            rejectionReason: verification.rejectionReason,
            currentYear: new Date().getFullYear(),
          },
        });
      }
    } catch (error) {
      console.error('Error sending verification status email:', error);
      // No lanzamos el error para no afectar la actualización de la verificación
    }
  }

  async remove(id: string): Promise<void> {
    const verification = await this.findOne(id);

    // Eliminar archivos asociados de MinIO
    if (verification.media && verification.media.length > 0) {
      for (const media of verification.media) {
        // Extraer el nombre del archivo de la URL
        const fileName = media.url.split('/').pop();
        if (fileName) {
          await this.minioService.deleteFile(fileName);
        }
      }
    }

    await this.verificationRepository.remove(verification);
  }

  private getFileTypeFromIndex(index: number): string {
    const types = ['front', 'back', 'selfie'];
    return types[index] || 'document';
  }

  private getMediaType(mimetype: string): MediaType {
    if (mimetype.startsWith('image/')) {
      return MediaType.IMAGE;
    } else if (mimetype === 'application/pdf') {
      return MediaType.DOCUMENT;
    } else {
      return MediaType.DOCUMENT; // Default
    }
  }

  async saveVeriffSession(userID: string, dto: SaveVeriffSessionDto): Promise<Verification> {
    let latest = await this.verificationRepository.findOne({
      where: { userID },
      order: { submittedAt: 'DESC' },
    });

    const isFinal = latest && [VerificationStatus.APPROVED, VerificationStatus.REJECTED].includes(latest.status);

    if (!latest || isFinal) {
      latest = this.verificationRepository.create({
        userID,
        status: VerificationStatus.CREATED,
        documentType: DocumentType.OTHER,
        veriffSessionUrl: dto.url,
        veriffSessionId: dto.sessionId,
      });
      latest = await this.verificationRepository.save(latest);
    } else {
      latest.veriffSessionUrl = dto.url;
      latest.veriffSessionId = dto.sessionId;
      // Si aún no hay estado claro, marcar como CREATED
      if (!latest.status || latest.status === (undefined as any)) {
        latest.status = VerificationStatus.CREATED;
      }
      latest = await this.verificationRepository.save(latest);
    }

    return latest;
  }
}
