"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TrackingGateway", {
    enumerable: true,
    get: function() {
        return TrackingGateway;
    }
});
const _websockets = require("@nestjs/websockets");
const _socketio = require("socket.io");
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
const _config = require("@nestjs/config");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let TrackingGateway = class TrackingGateway {
    afterInit(server) {
        this.logger.log('WebSocket Gateway initialized');
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET')
            });
            client.data.userId = payload.sub;
            client.data.role = payload.role;
            this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
        } catch  {
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinOrderRoom(data, client) {
        client.join(`order:${data.orderId}`);
        this.logger.log(`Client ${client.id} joined room order:${data.orderId}`);
        return {
            event: 'joined',
            data: {
                room: `order:${data.orderId}`
            }
        };
    }
    handleLeaveOrderRoom(data, client) {
        client.leave(`order:${data.orderId}`);
        return {
            event: 'left',
            data: {
                room: `order:${data.orderId}`
            }
        };
    }
    emitLocationUpdate(orderId, location) {
        this.server.to(`order:${orderId}`).emit('location-update', location);
    }
    emitOrderStatusUpdate(orderId, status) {
        this.server.to(`order:${orderId}`).emit('order-status-update', {
            orderId,
            status,
            timestamp: new Date()
        });
    }
    emitNotification(userId, notification) {
        this.server.to(`user:${userId}`).emit('notification', notification);
    }
    handleJoinUserRoom(client) {
        if (client.data.userId) {
            client.join(`user:${client.data.userId}`);
            return {
                event: 'joined',
                data: {
                    room: `user:${client.data.userId}`
                }
            };
        }
    }
    constructor(jwtService, configService){
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new _common.Logger(TrackingGateway.name);
    }
};
_ts_decorate([
    (0, _websockets.WebSocketServer)(),
    _ts_metadata("design:type", typeof _socketio.Server === "undefined" ? Object : _socketio.Server)
], TrackingGateway.prototype, "server", void 0);
_ts_decorate([
    (0, _websockets.SubscribeMessage)('join-order-room'),
    _ts_param(0, (0, _websockets.MessageBody)()),
    _ts_param(1, (0, _websockets.ConnectedSocket)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof _socketio.Socket === "undefined" ? Object : _socketio.Socket
    ]),
    _ts_metadata("design:returntype", void 0)
], TrackingGateway.prototype, "handleJoinOrderRoom", null);
_ts_decorate([
    (0, _websockets.SubscribeMessage)('leave-order-room'),
    _ts_param(0, (0, _websockets.MessageBody)()),
    _ts_param(1, (0, _websockets.ConnectedSocket)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof _socketio.Socket === "undefined" ? Object : _socketio.Socket
    ]),
    _ts_metadata("design:returntype", void 0)
], TrackingGateway.prototype, "handleLeaveOrderRoom", null);
_ts_decorate([
    (0, _websockets.SubscribeMessage)('join-user-room'),
    _ts_param(0, (0, _websockets.ConnectedSocket)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _socketio.Socket === "undefined" ? Object : _socketio.Socket
    ]),
    _ts_metadata("design:returntype", void 0)
], TrackingGateway.prototype, "handleJoinUserRoom", null);
TrackingGateway = _ts_decorate([
    (0, _websockets.WebSocketGateway)({
        cors: {
            origin: '*'
        },
        namespace: '/tracking'
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _jwt.JwtService === "undefined" ? Object : _jwt.JwtService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], TrackingGateway);

//# sourceMappingURL=tracking.gateway.js.map