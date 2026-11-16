class HttpException extends Error {
  constructor(response, status = 500) {
    const message =
      typeof response === 'string'
        ? response
        : response?.message || 'Http Exception';
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.statusCode = status;
    this.response = response;
  }

  getStatus() {
    return this.status;
  }

  getResponse() {
    if (this.response !== undefined) {
      return this.response;
    }
    return {
      statusCode: this.status,
      message: this.message,
    };
  }
}

class BadRequestException extends HttpException {
  constructor(response = 'Bad Request') {
    super(response, 400);
  }
}

class UnauthorizedException extends HttpException {
  constructor(response = 'Unauthorized') {
    super(response, 401);
  }
}

class ForbiddenException extends HttpException {
  constructor(response = 'Forbidden') {
    super(response, 403);
  }
}

class NotFoundException extends HttpException {
  constructor(response = 'Not Found') {
    super(response, 404);
  }
}

class ConflictException extends HttpException {
  constructor(response = 'Conflict') {
    super(response, 409);
  }
}

module.exports = {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
};
