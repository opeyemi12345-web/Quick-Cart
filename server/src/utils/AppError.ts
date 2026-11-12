//App error
//App error with an Http status code attached, e.g throw new AppError(404, "Product not found")
//errorHandler.ts replies with that status and message.
export class AppError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message); //let the normal Error the message
    this.statusCode = statusCode;
  }
}
