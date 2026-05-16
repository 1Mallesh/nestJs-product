"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CartService", {
    enumerable: true,
    get: function() {
        return CartService;
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
let CartService = class CartService {
    async getOrCreateCart(userId) {
        let cart = await this.prisma.cart.findUnique({
            where: {
                userId
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                images: true,
                                stock: true,
                                isActive: true
                            }
                        },
                        variant: true
                    }
                }
            }
        });
        if (!cart) {
            cart = await this.prisma.cart.create({
                data: {
                    userId
                },
                include: {
                    items: {
                        include: {
                            product: true,
                            variant: true
                        }
                    }
                }
            });
        }
        return cart;
    }
    async getCart(userId) {
        const cart = await this.getOrCreateCart(userId);
        const subtotal = cart.items.reduce((sum, item)=>sum + item.price * item.quantity, 0);
        return {
            message: 'Cart fetched',
            data: {
                ...cart,
                subtotal
            }
        };
    }
    async addToCart(userId, dto) {
        const product = await this.prisma.product.findUnique({
            where: {
                id: dto.productId
            }
        });
        if (!product || !product.isActive || product.approvalStatus !== 'APPROVED') {
            throw new _common.NotFoundException('Product not available');
        }
        if (product.stock < dto.quantity) {
            throw new _common.BadRequestException('Insufficient stock');
        }
        const cart = await this.getOrCreateCart(userId);
        const price = dto.variantId ? (await this.prisma.productVariant.findUnique({
            where: {
                id: dto.variantId
            }
        }))?.price || product.price : product.price;
        const existingItem = await this.prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId: dto.productId,
                variantId: dto.variantId || null
            }
        });
        if (existingItem) {
            const newQty = existingItem.quantity + dto.quantity;
            if (product.stock < newQty) throw new _common.BadRequestException('Insufficient stock');
            await this.prisma.cartItem.update({
                where: {
                    id: existingItem.id
                },
                data: {
                    quantity: newQty
                }
            });
        } else {
            await this.prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: dto.productId,
                    variantId: dto.variantId || null,
                    quantity: dto.quantity,
                    price
                }
            });
        }
        return this.getCart(userId);
    }
    async updateItem(userId, itemId, dto) {
        const cart = await this.prisma.cart.findUnique({
            where: {
                userId
            }
        });
        if (!cart) throw new _common.NotFoundException('Cart not found');
        const item = await this.prisma.cartItem.findFirst({
            where: {
                id: itemId,
                cartId: cart.id
            },
            include: {
                product: true
            }
        });
        if (!item) throw new _common.NotFoundException('Cart item not found');
        if (item.product.stock < dto.quantity) throw new _common.BadRequestException('Insufficient stock');
        await this.prisma.cartItem.update({
            where: {
                id: itemId
            },
            data: {
                quantity: dto.quantity
            }
        });
        return this.getCart(userId);
    }
    async removeItem(userId, itemId) {
        const cart = await this.prisma.cart.findUnique({
            where: {
                userId
            }
        });
        if (!cart) throw new _common.NotFoundException('Cart not found');
        const item = await this.prisma.cartItem.findFirst({
            where: {
                id: itemId,
                cartId: cart.id
            }
        });
        if (!item) throw new _common.NotFoundException('Cart item not found');
        await this.prisma.cartItem.delete({
            where: {
                id: itemId
            }
        });
        return {
            message: 'Item removed from cart'
        };
    }
    async clearCart(userId) {
        const cart = await this.prisma.cart.findUnique({
            where: {
                userId
            }
        });
        if (cart) {
            await this.prisma.cartItem.deleteMany({
                where: {
                    cartId: cart.id
                }
            });
        }
        return {
            message: 'Cart cleared'
        };
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
CartService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], CartService);

//# sourceMappingURL=cart.service.js.map