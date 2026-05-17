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
        if (exception instanceof _common.HttpException) {
            status = exception.getStatus();
            message = exception.getResponse();
        } else if (exception instanceof _client.Prisma.PrismaClientKnownRequestError) {
            status = _common.HttpStatus.BAD_REQUEST;
            switch(exception.code){
                case 'P2002':
                    message = `Unique constraint violation on field: ${exception.meta?.target?.join(', ')}`;
                    break;
                case 'P2003':
                    message = `Foreign key constraint failed on field: ${exception.meta?.field_name}`;
                    break;
                case 'P2025':
                    message = 'Record not found';
                    status = _common.HttpStatus.NOT_FOUND;
                    break;
                default:
                    message = `Database error: ${exception.message}`;
            }
        } else {
            status = _common.HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
        }
        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message: typeof message === 'object' ? message.message || message : message
        };
        if (status === _common.HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(`${request.method} ${request.url}`, exception);
        }
        response.status(status).json(errorResponse);
    }
    constructor(){
        this.logger = new _common.Logger(AllExceptionsFilter.name);
    }
};
AllExceptionsFilter = _ts_decorate([
    (0, _common.Catch)()
], AllExceptionsFilter);

//# sourceMappingURL=http-exception.filter.js.map