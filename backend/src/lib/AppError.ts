/**
 * AppError — custom error class that carries an HTTP status code.
 * Thrown by service functions; caught and serialized by errorHandler middleware.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    // Restore prototype chain (necessary when extending built-ins in TS)
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
