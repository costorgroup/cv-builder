import {
  Catch,
  Logger,
  ServiceUnavailableException,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentProviderError } from './billing.types.js';

/**
 * A payment provider failure, answered as a 503 users can understand; what
 * went wrong is logged, not shown.
 */
@Catch(PaymentProviderError)
export class PaymentProviderErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('Billing');

  catch(error: PaymentProviderError, host: ArgumentsHost) {
    this.logger.error(error.message);
    const response = new ServiceUnavailableException(
      'Payments are unavailable right now. Try again in a few minutes.',
    );
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(response.getStatus())
      .json(response.getResponse());
  }
}
