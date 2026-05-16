"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NotificationsService", {
    enumerable: true,
    get: function() {
        return NotificationsService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let NotificationsService = class NotificationsService {
    async create(userId, title, message, type, data) {
        return this.prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                data
            }
        });
    }
    async getNotifications(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [notifications, total, unreadCount] = await Promise.all([
            this.prisma.notification.findMany({
                where: {
                    userId
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.notification.count({
                where: {
                    userId
                }
            }),
            this.prisma.notification.count({
                where: {
                    userId,
                    isRead: false
                }
            })
        ]);
        return {
            message: 'Notifications fetched',
            data: {
                notifications,
                total,
                unreadCount,
                page,
                limit
            }
        };
    }
    async markAsRead(userId, notificationId) {
        await this.prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId
            },
            data: {
                isRead: true
            }
        });
        return {
            message: 'Marked as read'
        };
    }
    async markAllAsRead(userId) {
        await this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false
            },
            data: {
                isRead: true
            }
        });
        return {
            message: 'All notifications marked as read'
        };
    }
    async deleteNotification(userId, notificationId) {
        await this.prisma.notification.deleteMany({
            where: {
                id: notificationId,
                userId
            }
        });
        return {
            message: 'Notification deleted'
        };
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
NotificationsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], NotificationsService);

//# sourceMappingURL=notifications.service.js.map