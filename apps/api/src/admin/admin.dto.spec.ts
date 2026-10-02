// The DTOs' decorators need it; Nest loads it at startup.
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ListAuditLogsQuery,
  ListSubscriptionsQuery,
  ListUsersQuery,
} from './admin.dto.js';

/** As the global ValidationPipe parses a query string's values. */
const parse = async <T extends object>(
  type: new () => T,
  query: Record<string, unknown>,
) => {
  const instance = plainToInstance(type, query);
  const errors = await validate(instance, { whitelist: true });
  return { instance, errors };
};

describe('list filters', () => {
  it('reads several values separated by commas', async () => {
    const { instance, errors } = await parse(ListUsersQuery, {
      status: 'active,disabled',
      role: 'ADMIN, SUPER_ADMIN',
    });
    expect(errors).toEqual([]);
    expect(instance.status).toEqual(['active', 'disabled']);
    expect(instance.role).toEqual(['ADMIN', 'SUPER_ADMIN']);
  });

  it('still reads a single value, as before', async () => {
    const { instance, errors } = await parse(ListSubscriptionsQuery, {
      status: 'ACTIVE',
      planKey: 'pro',
    });
    expect(errors).toEqual([]);
    expect(instance.status).toEqual(['ACTIVE']);
    expect(instance.planKey).toEqual(['pro']);
  });

  it('reads a repeated parameter and drops empty parts', async () => {
    const { instance, errors } = await parse(ListAuditLogsQuery, {
      action: ['CV_DELETED,', 'USER_CREATED'],
    });
    expect(errors).toEqual([]);
    expect(instance.action).toEqual(['CV_DELETED', 'USER_CREATED']);
  });

  it('refuses a value that is not allowed', async () => {
    const { errors } = await parse(ListUsersQuery, {
      status: 'active,banned',
    });
    expect(errors.map(({ property }) => property)).toEqual(['status']);
  });

  it('leaves a filter out when it is not given', async () => {
    const { instance, errors } = await parse(ListSubscriptionsQuery, {});
    expect(errors).toEqual([]);
    expect(instance.status).toBeUndefined();
    expect(instance.planKey).toBeUndefined();
  });
});
