class AuthenticationError extends Error {
  code = 1
  constructor() {
    super('Authentication failed. Application key might be invalid.');
    this.name = 'AuthenticationError'
  }
}

class BlindnetServiceError extends Error {
  code = 2
  constructor(message: string) {
    super(message);
    this.name = 'BlindnetServiceError'
  }
}

export {
  AuthenticationError,
  BlindnetServiceError
}