import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import type TestAgent from 'supertest/lib/agent.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app-setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * One account, or one embed's end user, never reaches another's data: each
 * kind of resource is tried with someone else's id. Runs the real app
 * against the real database, and removes what it made.
 */
describe('Tenant isolation (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const stamp = Date.now();
  const emails = [`iso-a-${stamp}@example.com`, `iso-b-${stamp}@example.com`];
  let a: TestAgent;
  let b: TestAgent;
  let aId: string;
  let aOrg: string;

  const JPEG = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1,
  ]);
  const newCv = (photo = '') => ({
    name: 'Mine',
    data: { personalInformation: { photo } },
    appearance: { templateId: 'default' },
  });

  const signUp = async (email: string) => {
    const agent = request.agent(app.getHttpServer());
    const response = await agent.post('/auth/sign-up').send({
      firstName: 'Iso',
      lastName: 'Lation',
      email,
      password: 'password123',
    });
    expect(response.status).toBe(201);
    return { agent, id: response.body.user.id as string };
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(
      module.createNestApplication<NestExpressApplication>({ rawBody: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    const first = await signUp(emails[0]!);
    const second = await signUp(emails[1]!);
    a = first.agent;
    b = second.agent;
    aId = first.id;
    aOrg = (
      await prisma.organization.findUniqueOrThrow({
        where: { personalOwnerId: aId },
      })
    ).id;
    // Both accounts get the paid features, so only ownership stands between them.
    await prisma.subscription.updateMany({
      where: {
        organization: { personalOwnerId: { in: [first.id, second.id] } },
      },
      data: {
        overrides: {
          features: ['api.access', 'embed.builder', 'cv.download.pdf'],
          limits: {
            'cv.max': 5,
            'apiKey.max': 2,
            'api.requests.monthly': 100,
            'embed.max': 1,
            'embed.externalUsers.max': 5,
          },
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.organization.deleteMany({
      where: {
        type: 'TEAM',
        members: { some: { user: { email: { in: emails } } } },
      },
    });
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await app.close();
  });

  it("can't read, change, copy, print or delete another account's CV", async () => {
    const cv = (await a.post('/cvs').send(newCv())).body;
    expect((await b.get(`/cvs/${cv.id}`)).status).toBe(404);
    expect(
      (await b.patch(`/cvs/${cv.id}`).send({ name: 'Mine now' })).status,
    ).toBe(404);
    expect((await b.post(`/cvs/${cv.id}/duplicate`)).status).toBe(404);
    expect((await b.post(`/cvs/${cv.id}/pdf`)).status).toBe(404);
    expect((await b.delete(`/cvs/${cv.id}`)).status).toBe(404);
    expect((await b.get('/cvs')).body.items).toEqual([]);
    expect((await a.get(`/cvs/${cv.id}`)).body.name).toBe('Mine');
  });

  it("can't reach a team it isn't in", async () => {
    const team = (await a.post('/teams').send({ name: 'Isolated team' })).body;
    expect((await b.get(`/teams/${team.id}`)).status).toBe(404);
    expect((await b.get(`/teams/${team.id}/members`)).status).toBe(404);
    expect(
      (await b.patch(`/teams/${team.id}`).send({ name: 'Taken' })).status,
    ).toBe(404);
    expect((await b.get(`/teams/${team.id}/overview`)).status).toBe(404);
    expect((await b.get(`/teams/${team.id}/api-keys`)).status).toBe(404);
    expect((await b.get(`/teams/${team.id}/embeds`)).status).toBe(404);
    expect((await b.get(`/teams/${team.id}/storage`)).status).toBe(404);
    expect(
      (await b.post('/billing/cancel').send({ teamId: team.id })).status,
    ).toBe(404);
  });

  it("can't revoke another account's API key, or use its own on another's CVs", async () => {
    const aKey = (
      await a.post('/account/api-keys').send({ name: 'A', scopes: ['cv:read'] })
    ).body;
    expect((await b.delete(`/account/api-keys/${aKey.apiKey.id}`)).status).toBe(
      404,
    );

    const cv = (await a.get('/cvs')).body.items[0];
    const bKey = (
      await b.post('/account/api-keys').send({ name: 'B', scopes: ['cv:read'] })
    ).body.key;
    const server = app.getHttpServer();
    expect(
      (
        await request(server)
          .get(`/v1/cvs/${cv.id}`)
          .set('Authorization', `Bearer ${bKey}`)
      ).status,
    ).toBe(404);
    expect(
      (
        await request(server)
          .get(`/v1/cvs/${cv.id}`)
          .set('Authorization', `Bearer ${aKey.key}`)
      ).status,
    ).toBe(200);
  });

  it("can't change or delete another account's embed", async () => {
    const embed = (await a.post('/account/embeds').send({ name: 'A embed' }))
      .body;
    expect(
      (await b.patch(`/account/embeds/${embed.id}`).send({ name: 'x' })).status,
    ).toBe(404);
    expect((await b.delete(`/account/embeds/${embed.id}`)).status).toBe(404);
  });

  it("can't take on another account's uploaded photo", async () => {
    const upload = await a
      .post('/assets/photos')
      .attach('file', JPEG, 'photo.jpg');
    expect(upload.status).toBe(201);
    await b.post('/cvs').send(newCv(upload.body.url));
    const asset = await prisma.asset.findUniqueOrThrow({
      where: { id: upload.body.id },
    });
    expect(asset.cvId).toBeNull();
    expect(asset.organizationId).toBe(aOrg);
  });

  it("keeps one embed user's CVs from another's", async () => {
    const server = app.getHttpServer();
    const embed = (await a.get('/account/embeds')).body[0];
    await a.patch(`/account/embeds/${embed.id}`).send({
      allowedOrigins: ['https://careers.example.com'],
    });
    const key = (
      await a
        .post('/account/api-keys')
        .send({ name: 'Embed', scopes: ['embed:session'] })
    ).body.key;
    const session = async (externalUserId: string) => {
      const launch = await request(server)
        .post('/v1/embed/sessions')
        .set('Authorization', `Bearer ${key}`)
        .send({ publicKey: embed.publicKey, externalUserId });
      const exchanged = await request(server)
        .post('/embed/v1/sessions/exchange')
        .send({
          publicKey: embed.publicKey,
          launchToken: launch.body.launchToken,
        });
      return exchanged.body.embedToken as string;
    };
    const x = await session('x');
    const y = await session('y');
    const cv = (
      await request(server)
        .post('/embed/v1/cvs')
        .set('Authorization', `Bearer ${x}`)
        .send(newCv())
    ).body;
    expect(
      (
        await request(server)
          .get(`/embed/v1/cvs/${cv.id}`)
          .set('Authorization', `Bearer ${y}`)
      ).status,
    ).toBe(404);
    expect(
      (
        await request(server)
          .delete(`/embed/v1/cvs/${cv.id}`)
          .set('Authorization', `Bearer ${y}`)
      ).status,
    ).toBe(404);
    // Nor can the account owner's session reach it, or the embed token the app.
    expect((await a.get(`/cvs/${cv.id}`)).status).toBe(404);
    expect(
      (await request(server).get('/cvs').set('Authorization', `Bearer ${x}`))
        .status,
    ).toBe(401);
  });

  it("lets a team's key work with its own embedded users' CVs only", async () => {
    const server = app.getHttpServer();
    const team = (await a.post('/teams').send({ name: 'Embed team' })).body;
    await prisma.subscription.update({
      where: { organizationId: team.id },
      data: {
        overrides: {
          features: ['api.access', 'embed.builder', 'cv.download.pdf'],
          limits: {
            'cv.max': 5,
            'apiKey.max': 2,
            'api.requests.monthly': 100,
            'embed.max': 1,
            'embed.externalUsers.max': 5,
          },
        },
      },
    });
    const embed = (
      await a.post(`/teams/${team.id}/embeds`).send({ name: 'Team' })
    ).body;
    const key = (
      await a
        .post(`/teams/${team.id}/api-keys`)
        .send({
          name: 'Team',
          scopes: ['embed:session', 'cv:read', 'cv:create'],
        })
    ).body.key;
    const auth = { Authorization: `Bearer ${key}` };
    await request(server)
      .post('/v1/embed/sessions')
      .set(auth)
      .send({ publicKey: embed.publicKey, externalUserId: 'candidate-7' });

    const made = await request(server)
      .post('/v1/cvs?externalUserId=candidate-7')
      .set(auth)
      .send(newCv());
    expect(made.status).toBe(201);
    expect(
      (
        await request(server)
          .get('/v1/cvs?externalUserId=candidate-7')
          .set(auth)
      ).body.total,
    ).toBe(1);
    expect((await request(server).get('/v1/cvs').set(auth)).status).toBe(400);
    expect(
      (await request(server).get('/v1/cvs?externalUserId=nobody').set(auth))
        .status,
    ).toBe(404);

    // Another account's key, with the same external id, finds no such user.
    const bKey = (
      await b
        .post('/account/api-keys')
        .send({ name: 'B2', scopes: ['cv:read'] })
    ).body.key;
    expect(
      (
        await request(server)
          .get(`/v1/cvs/${made.body.id}?externalUserId=candidate-7`)
          .set('Authorization', `Bearer ${bKey}`)
      ).status,
    ).toBe(404);
  });
});
