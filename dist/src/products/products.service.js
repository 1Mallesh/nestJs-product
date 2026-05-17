"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductsService", {
    enumerable: true,
    get: function() {
        return ProductsService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
const _notificationsservice = require("../notifications/notifications.service");
const _trackinggateway = require("../tracking/tracking.gateway");
const _client = require("@prisma/client");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let ProductsService = class ProductsService {
    async create(userId, dto) {
        const vendor = await this.prisma.vendor.findUnique({
            where: {
                userId
            }
        });
        if (!vendor) throw new _common.ForbiddenException('Vendor profile not found');
        if (vendor.approvalStatus !== 'APPROVED') {
            throw new _common.ForbiddenException('Vendor account not yet approved');
        }
        const category = await this.prisma.category.findUnique({
            where: {
                id: dto.categoryId
            }
        });
        if (!category) throw new _common.BadRequestException('Category not found');
        if (!category.isActive) throw new _common.BadRequestException('Category is inactive');
        const slug = `${dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;
        const product = await this.prisma.product.create({
            data: {
                ...dto,
                slug,
                vendorId: vendor.id,
                images: dto.images || [],
                tags: dto.tags || [],
                approvalStatus: 'PENDING',
                isPublished: false
            }
        });
        // Notify all admins via DB + socket
        const admins = await this.prisma.user.findMany({
            where: {
                role: 'ADMIN'
            }
        });
        await Promise.all(admins.map(async (admin)=>{
            const notif = await this.notifications.create(admin.id, 'New Product Pending Approval', `Vendor "${vendor.shopName}" submitted "${product.name}" for review.`, _client.NotificationType.GENERAL, {
                productId: product.id
            });
            this.trackingGateway.emitNotification(admin.id, notif);
        }));
        this.trackingGateway.server?.emit('product.pending', {
            productId: product.id,
            vendorId: vendor.id,
            name: product.name
        });
        return {
            success: true,
            message: 'Product submitted for approval',
            data: product
        };
    }
    async findAll(query) {
        const { page = 1, limit = 20, categoryId, search, minPrice, maxPrice } = query;
        const skip = (page - 1) * limit;
        const where = {
            isActive: true,
            approvalStatus: 'APPROVED',
            isPublished: true
        };
        if (categoryId) where.categoryId = categoryId;
        if (search) where.name = {
            contains: search,
            mode: 'insensitive'
        };
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price.gte = minPrice;
            if (maxPrice !== undefined) where.price.lte = maxPrice;
        }
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: {
                    category: {
                        select: {
                            name: true,
                            slug: true
                        }
                    },
                    vendor: {
                        select: {
                            shopName: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.product.count({
                where
            })
        ]);
        return {
            success: true,
            message: 'Products fetched',
            data: {
                products,
                total,
                page,
                limit
            }
        };
    }
    async getFeatured(page = 1, limit = 10) {
        const cacheKey = `featured_page_${page}_limit_${limit}`;
        const cached = this.featuredCache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
            return cached.data;
        }
        const skip = (page - 1) * limit;
        const where = {
            isActive: true,
            approvalStatus: 'APPROVED',
            isPublished: true,
            isFeatured: true
        };
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    images: true,
                    price: true,
                    comparePrice: true,
                    stock: true,
                    averageRating: true,
                    category: {
                        select: {
                            name: true,
                            slug: true
                        }
                    },
                    vendor: {
                        select: {
                            shopName: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.product.count({
                where
            })
        ]);
        const result = {
            success: true,
            message: 'Featured products fetched',
            data: {
                products: products.map((p)=>({
                        id: p.id,
                        name: p.name,
                        slug: p.slug,
                        image: p.images[0] || null,
                        price: p.price,
                        comparePrice: p.comparePrice,
                        stock: p.stock,
                        rating: p.averageRating,
                        category: p.category,
                        vendor: p.vendor
                    })),
                total,
                page,
                limit
            }
        };
        // Cache for 5 minutes (300000 ms)
        this.featuredCache.set(cacheKey, {
            data: result,
            expires: Date.now() + 300000
        });
        return result;
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: {
                id
            },
            include: {
                category: true,
                vendor: {
                    select: {
                        shopName: true,
                        shopLogo: true
                    }
                },
                variants: true,
                reviews: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                avatar: true
                            }
                        }
                    },
                    take: 10,
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });
        if (!product) throw new _common.NotFoundException('Product not found');
        return {
            success: true,
            message: 'Product fetched',
            data: product
        };
    }
    async update(userId, productId, dto) {
        const vendor = await this.prisma.vendor.findUnique({
            where: {
                userId
            }
        });
        if (!vendor) throw new _common.ForbiddenException('Vendor not found');
        const product = await this.prisma.product.findFirst({
            where: {
                id: productId,
                vendorId: vendor.id
            }
        });
        if (!product) throw new _common.NotFoundException('Product not found');
        const updated = await this.prisma.product.update({
            where: {
                id: productId
            },
            data: dto
        });
        return {
            success: true,
            message: 'Product updated',
            data: updated
        };
    }
    async remove(userId, productId) {
        const vendor = await this.prisma.vendor.findUnique({
            where: {
                userId
            }
        });
        if (!vendor) throw new _common.ForbiddenException('Vendor not found');
        const product = await this.prisma.product.findFirst({
            where: {
                id: productId,
                vendorId: vendor.id
            }
        });
        if (!product) throw new _common.NotFoundException('Product not found');
        await this.prisma.product.update({
            where: {
                id: productId
            },
            data: {
                isActive: false
            }
        });
        return {
            success: true,
            message: 'Product deactivated'
        };
    }
    async addVariant(userId, productId, dto) {
        const vendor = await this.prisma.vendor.findUnique({
            where: {
                userId
            }
        });
        if (!vendor) throw new _common.ForbiddenException('Vendor not found');
        const product = await this.prisma.product.findFirst({
            where: {
                id: productId,
                vendorId: vendor.id
            }
        });
        if (!product) throw new _common.NotFoundException('Product not found');
        const variant = await this.prisma.productVariant.create({
            data: {
                ...dto,
                productId
            }
        });
        return {
            success: true,
            message: 'Variant added',
            data: variant
        };
    }
    async getVendorProducts(userId, page = 1, limit = 10) {
        const vendor = await this.prisma.vendor.findUnique({
            where: {
                userId
            }
        });
        if (!vendor) throw new _common.ForbiddenException('Vendor not found');
        const skip = (page - 1) * limit;
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where: {
                    vendorId: vendor.id
                },
                include: {
                    category: {
                        select: {
                            name: true
                        }
                    },
                    variants: true
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.product.count({
                where: {
                    vendorId: vendor.id
                }
            })
        ]);
        return {
            success: true,
            message: 'Products fetched',
            data: {
                products,
                total,
                page,
                limit
            }
        };
    }
    constructor(prisma, notifications, trackingGateway){
        this.prisma = prisma;
        this.notifications = notifications;
        this.trackingGateway = trackingGateway;
        this.featuredCache = new Map();
    }
};
ProductsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _notificationsservice.NotificationsService === "undefined" ? Object : _notificationsservice.NotificationsService,
        typeof _trackinggateway.TrackingGateway === "undefined" ? Object : _trackinggateway.TrackingGateway
    ])
], ProductsService);

//# sourceMappingURL=products.service.js.map