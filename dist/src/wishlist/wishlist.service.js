"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "WishlistService", {
    enumerable: true,
    get: function() {
        return WishlistService;
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
let WishlistService = class WishlistService {
    async getWishlist(userId) {
        const items = await this.prisma.wishlist.findMany({
            where: {
                userId
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        images: true,
                        averageRating: true,
                        stock: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return {
            message: 'Wishlist fetched',
            data: items
        };
    }
    async toggle(userId, productId) {
        const product = await this.prisma.product.findUnique({
            where: {
                id: productId
            }
        });
        if (!product) throw new _common.NotFoundException('Product not found');
        const existing = await this.prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId
                }
            }
        });
        if (existing) {
            await this.prisma.wishlist.delete({
                where: {
                    id: existing.id
                }
            });
            return {
                message: 'Removed from wishlist'
            };
        }
        await this.prisma.wishlist.create({
            data: {
                userId,
                productId
            }
        });
        return {
            message: 'Added to wishlist'
        };
    }
    async remove(userId, productId) {
        await this.prisma.wishlist.deleteMany({
            where: {
                userId,
                productId
            }
        });
        return {
            message: 'Removed from wishlist'
        };
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
WishlistService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], WishlistService);

//# sourceMappingURL=wishlist.service.js.map