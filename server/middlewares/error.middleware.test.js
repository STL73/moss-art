import { describe, it, expect, vi } from 'vitest';
import errorMiddleware from './error.middleware.js';

const buildRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe('errorMiddleware', () => {
    it('maps a Mongoose CastError to 404', () => {
        const err = { name: 'CastError', value: '123' };
        const res = buildRes();

        errorMiddleware(err, {}, res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Resource not found with id of 123',
        });
    });

    it('maps a Mongoose duplicate key error (11000) to 400', () => {
        const err = { code: 11000 };
        const res = buildRes();

        errorMiddleware(err, {}, res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Duplicate field value entered',
        });
    });

    it('maps a Mongoose ValidationError to 400 with joined messages', () => {
        const err = {
            name: 'ValidationError',
            errors: {
                email: { message: 'Email is required' },
                name: { message: 'Name is required' },
            },
        };
        const res = buildRes();

        errorMiddleware(err, {}, res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Email is required, Name is required',
        });
    });

    it('respects a custom statusCode set by a controller', () => {
        const err = new Error('User already exists');
        err.statusCode = 409;
        const res = buildRes();

        errorMiddleware(err, {}, res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'User already exists',
        });
    });

    it('defaults to 500 when no statusCode is set', () => {
        const err = new Error('boom');
        const res = buildRes();

        errorMiddleware(err, {}, res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'boom',
        });
    });
});
