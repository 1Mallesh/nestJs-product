"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AllExceptionsFilter", {
    enumerable: true,
    get: function() {
        return AllExceptionsFilter;
    }
});
const _common = require("@nestjs/common");
const _client = require("@prisma/client");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AllExceptionsFilter = class AllExceptionsFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status;
        let message;
        let errors;
        if (exception instanceof _common.HttpException) {
            status = exception.getStatus();
            const raw = exception.getResponse();
            // class-validator returns { message: string[], error: string }
            if (typeof raw === 'object' && Array.isArray(raw.message)) {
                errors = raw.message;
                message = errors.join('; ');
            } else if (typeof raw === 'object' && typeof raw.message === 'string') {
                message = raw.message;
            } else if (typeof raw === 'string') {
                message = raw;
            } else {
                message = raw;
            }
        } else if (exception instanceof _client.Prisma.PrismaClientKnownRequestError) {
            switch(exception.code){
                case 'P2002':
                    {
                        const fields = exception.meta?.target?.join(', ') ?? 'unknown field';
                        status = _common.HttpStatus.CONFLICT;
                        message = `A record with this ${fields} already exists.`;
                        break;
                    }
                case 'P2003':
                    {
                        const field = exception.meta?.field_name ?? 'unknown';
                        status = _common.HttpStatus.BAD_REQUEST;
                        message = `Referenced record not found for field: ${field}. Make sure the ID exists.`;
                        break;
                    }
                case 'P2025':
                    status = _common.HttpStatus.NOT_FOUND;
                    message = 'Record not found.';
                    break;
                case 'P2014':
                    status = _common.HttpStatus.BAD_REQUEST;
                    message = 'Relation violation: the required related record was not found.';
                    break;
                default:
                    status = _common.HttpStatus.INTERNAL_SERVER_ERROR;
                    message = `Database error (${exception.code}): ${exception.message}`;
            }
        } else if (exception instanceof _client.Prisma.PrismaClientValidationError) {
            status = _common.HttpStatus.BAD_REQUEST;
            message = 'Invalid data sent to database. Check field types and required fields.';
            this.logger.error('Prisma validation error', exception.message);
        } else {
            status = _common.HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
        }
        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: typeof message === 'object' ? message.message ?? message : message
        };
        if (errors) {
            errorResponse.errors = errors;
        }
        // Log every 400+ with full detail so debugging is easy
        if (status >= 400) {
            this.logger.warn(`${request.method} ${request.url} → ${status} | body: ${JSON.stringify(request.body)} | error: ${JSON.stringify(errorResponse.message)}`);
        }
        if (status === _common.HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(`${request.method} ${request.url}`, exception.stack);
        }
        response.status(status).json(errorResponse);
    }
    constructor(){
        this.logger = new _common.Logger('ExceptionFilter');
    }
};
AllExceptionsFilter = _ts_decorate([
    (0, _common.Catch)()
], AllExceptionsFilter);

//# sourceMappingURL=http-exception.filter.js.map