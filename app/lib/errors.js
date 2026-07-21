export class AppError extends Error {

    constructor(message, status = 500) {
        super(message);
        this.name = 'AppError';
        this.status = status;
    }
}

export class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends AppError {
    constructor(message) {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}

export function mapErrorToResponse(error) {
    if (error instanceof AppError) {
        return Response.json({ error: error.message }, { status: error.status });
    }
    console.error('Unhandled error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
}
