"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ReviewsService", {
    enumerable: true,
    get: function() {
        return ReviewsService;
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
let ReviewsService = class ReviewsService {
    async create(userId, dto) {
        const hasOrdered = await this.prisma.orderItem.findFirst({
            where: {
                productId: dto.productId,
                order: {
                    userId,
                    paymentStatus: 'PAID'
                },
                status: 'DELIVERED'
            }
        });
        if (!hasOrdered) {
            throw new _common.BadRequestException('You can only review products you have purchased and received');
        }
        const existing = await this.prisma.review.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId: dto.productId
                }
            }
        });
        if (existing) throw new _common.BadRequestException('You have already reviewed this product');
        const review = await this.prisma.$transaction(async (tx)=>{
            const newReview = await tx.review.create({
                data: {
                    ...dto,
                    userId,
                    images: dto.images || [],
                    isVerified: true
                }
            });
            const reviews = await tx.review.findMany({
                where: {
                    productId: dto.productId
                },
                select: {
                    rating: true
                }
            });
            const avgRating = reviews.reduce((sum, r)=>sum + r.rating, 0) / reviews.length;
            await tx.product.update({
                where: {
                    id: dto.productId
                },
                data: {
                    averageRating: avgRating,
                    reviewCount: reviews.length
                }
            });
            return newReview;
        });
        return {
            message: 'Review submitted',
            data: review
        };
    }
    async getProductReviews(productId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            this.prisma.review.findMany({
                where: {
                    productId
                },
                include: {
                    user: {
                        select: {
                            name: true,
                            avatar: true
                        }
                    }
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.review.count({
                where: {
                    productId
                }
            })
        ]);
        return {
            message: 'Reviews fetched',
            data: {
                reviews,
                total,
                page,
                limit
            }
        };
    }
    async deleteReview(userId, reviewId) {
        const review = await this.prisma.review.findFirst({
            where: {
                id: reviewId,
                userId
            }
        });
        if (!review) throw new _common.NotFoundException('Review not found');
        await this.prisma.review.delete({
            where: {
                id: reviewId
            }
        });
        const reviews = await this.prisma.review.findMany({
            where: {
                productId: review.productId
            },
            select: {
                rating: true
            }
        });
        const avgRating = reviews.length > 0 ? reviews.reduce((sum, r)=>sum + r.rating, 0) / reviews.length : 0;
        await this.prisma.product.update({
            where: {
                id: review.productId
            },
            data: {
                averageRating: avgRating,
                reviewCount: reviews.length
            }
        });
        return {
            message: 'Review deleted'
        };
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
ReviewsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], ReviewsService);

//# sourceMappingURL=reviews.service.js.map