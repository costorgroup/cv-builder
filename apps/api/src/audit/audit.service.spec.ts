import { withoutSecrets } from './audit.service.js';

describe('withoutSecrets', () => {
  it('redacts anything that looks like a secret, however deep', () => {
    expect(
      withoutSecrets({
        planKey: 'premium',
        password: 'hunter2',
        nested: { apiKey: 'pdl_live_x', refreshToken: 'abc', count: 2 },
        list: [{ webhookSecret: 's' }, { name: 'ok' }],
        cardNumber: '4242',
      }),
    ).toEqual({
      planKey: 'premium',
      password: '[redacted]',
      nested: { apiKey: '[redacted]', refreshToken: '[redacted]', count: 2 },
      list: [{ webhookSecret: '[redacted]' }, { name: 'ok' }],
      cardNumber: '[redacted]',
    });
  });

  it('keeps ordinary values and dates as they are', () => {
    const date = new Date('2026-09-30');
    expect(withoutSecrets({ before: { status: 'ACTIVE' }, at: date })).toEqual({
      before: { status: 'ACTIVE' },
      at: date,
    });
  });
});
