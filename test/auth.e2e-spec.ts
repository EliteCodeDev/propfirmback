import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccount } from '../src/modules/users/entities/user-account.entity';
import { PasswordResetToken } from '../src/modules/auth/entities/password-reset-token.entity';
import { Repository } from 'typeorm';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<UserAccount>;
  let tokenRepo: Repository<PasswordResetToken>;

  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    phone: '1234567890',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepo = moduleFixture.get('UserAccountRepository');
    tokenRepo = moduleFixture.get('PasswordResetTokenRepository');

    // Clean up database before tests
    await tokenRepo.delete({});
    await userRepo.delete({});
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register a new user', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201)
      .then((res) => {
        expect(res.body.user).toBeDefined();
        expect(res.body.user.email).toEqual(testUser.email);
      });
  });

  it('should login the user', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200)
      .then((res) => {
        expect(res.body.access_token).toBeDefined();
        expect(res.body.refresh_token).toBeDefined();
      });
  });

  it('should request a password reset', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/request-password-reset')
      .send({ email: testUser.email })
      .expect(201);

    expect(response.body.message).toEqual('Password reset email sent');

    const tokens = await tokenRepo.find();
    expect(tokens.length).toBe(1);
  });

  it('should confirm a password reset', async () => {
    const tokenEntity = await tokenRepo.findOne({ where: {} });
    const newPassword = 'newpassword123';

    const response = await request(app.getHttpServer())
      .post('/auth/confirm-password-reset')
      .send({ token: tokenEntity.token, password: newPassword })
      .expect(201);

    expect(response.body.message).toEqual('Password has been reset successfully');

    // Verify that the token has been deleted
    const tokens = await tokenRepo.find();
    expect(tokens.length).toBe(0);

    // Verify that the user can log in with the new password
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: newPassword })
      .expect(200);
  });
});
