import { monthStart } from './usage.service.js';

describe('monthStart', () => {
  it('is the first instant of the month in UTC', () => {
    expect(monthStart(new Date('2026-09-30T23:59:59.999Z'))).toEqual(
      new Date('2026-09-01T00:00:00.000Z'),
    );
  });

  it('follows UTC, not the server time zone, at a month boundary', () => {
    // Already October in UTC, though still September west of Greenwich.
    expect(monthStart(new Date('2026-10-01T00:30:00Z'))).toEqual(
      new Date('2026-10-01T00:00:00Z'),
    );
  });

  it('rolls over the year', () => {
    expect(monthStart(new Date('2027-01-15T10:00:00Z'))).toEqual(
      new Date('2027-01-01T00:00:00Z'),
    );
  });
});
