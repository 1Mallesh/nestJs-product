"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersService", {
    enumerable: true,
    get: function() {
        return UsersService;
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
let UsersService = class UsersService {
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                avatar: true,
                createdAt: true,
                vendor: {
                    select: {
                        id: true,
                        shopName: true,
                        approvalStatus: true
                    }
                },
                deliveryBoy: {
                    select: {
                        id: true,
                        approvalStatus: true
                    }
                }
            }
        });
        if (!user) throw new _common.NotFoundException('User not found');
        return {
            message: 'Profile fetched',
            data: user
        };
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.update({
            where: {
                id: userId
            },
            data: dto,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true
            }
        });
        return {
            message: 'Profile updated',
            data: user
        };
    }
    async getAddresses(userId) {
        const addresses = await this.prisma.address.findMany({
            where: {
                userId
            }
        });
        return {
            message: 'Addresses fetched',
            data: addresses
        };
    }
    async addAddress(userId, dto) {
        if (dto.isDefault) {
            await this.prisma.address.updateMany({
                where: {
                    userId
                },
                data: {
                    isDefault: false
                }
            });
        }
        const address = await this.prisma.address.create({
            data: {
                ...dto,
                userId
            }
        });
        return {
            message: 'Address added',
            data: address
        };
    }
    async updateAddress(userId, addressId, dto) {
        const address = await this.prisma.address.findFirst({
            where: {
                id: addressId,
                userId
            }
        });
        if (!address) throw new _common.NotFoundException('Address not found');
        if (dto.isDefault) {
            await this.prisma.address.updateMany({
                where: {
                    userId
                },
                data: {
                    isDefault: false
                }
            });
        }
        const updated = await this.prisma.address.update({
            where: {
                id: addressId
            },
            data: dto
        });
        return {
            message: 'Address updated',
            data: updated
        };
    }
    async deleteAddress(userId, addressId) {
        const address = await this.prisma.address.findFirst({
            where: {
                id: addressId,
                userId
            }
        });
        if (!address) throw new _common.NotFoundException('Address not found');
        await this.prisma.address.delete({
            where: {
                id: addressId
            }
        });
        return {
            message: 'Address deleted'
        };
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
UsersService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], UsersService);

//# sourceMappingURL=users.service.js.map