import { EMPTY_SHA256, signRequest } from './sigv4.js';

// The worked examples in AWS's "Signature Calculations for the
// Authorization Header" (S3 API reference).
const KEYS = {
  region: 'us-east-1',
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  date: new Date('2013-05-24T00:00:00Z'),
};

describe('signRequest', () => {
  it('matches AWS’s GET Object example', () => {
    expect(
      signRequest({
        ...KEYS,
        method: 'GET',
        url: new URL('https://examplebucket.s3.amazonaws.com/test.txt'),
        headers: {
          host: 'examplebucket.s3.amazonaws.com',
          range: 'bytes=0-9',
          'x-amz-content-sha256': EMPTY_SHA256,
          'x-amz-date': '20130524T000000Z',
        },
      }),
    ).toContain(
      'Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41',
    );
  });

  it('matches AWS’s list objects example (query strings)', () => {
    expect(
      signRequest({
        ...KEYS,
        method: 'GET',
        url: new URL(
          'https://examplebucket.s3.amazonaws.com/?max-keys=2&prefix=J',
        ),
        headers: {
          host: 'examplebucket.s3.amazonaws.com',
          'x-amz-content-sha256': EMPTY_SHA256,
          'x-amz-date': '20130524T000000Z',
        },
      }),
    ).toContain(
      'Signature=34b48302e7b5fa45bde8084f4b7868a86f0a534bc59db6670ed5711ef69dc6f7',
    );
  });
});
