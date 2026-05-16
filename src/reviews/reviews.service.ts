import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const hasOrdered = await this.prisma.orderItem.findFirst({
      where: {
        productId: dto.productId,
        order: { userId, paymentStatus: 'PAID' },
        status: 'DELIVERED',
      },
    });

    if (!hasOrdered) {
      throw new BadRequestException('You can only review products you have purchased and received');
    }

    const existing = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });
    if (existing) throw new BadRequestException('You have already reviewed this product');

    const review = await this.prisma.$transaction(async (tx: any) => {
      const newReview = await tx.review.create({
        data: { ...dto, userId, images: dto.images || [], isVerified: true },
      });

      const reviews = await tx.review.findMany({
        where: { productId: dto.productId },
        select: { rating: true },
      });

      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await tx.product.update({
        where: { id: dto.productId },
        data: { averageRating: avgRating, reviewCount: reviews.length },
      });

      return newReview;
    });

    return { message: 'Review submitted', data: review };
  }

  async getProductReviews(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId },
        include: { user: { select: { name: true, avatar: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where: { productId } }),
    ]);
    return { message: 'Reviews fetched', data: { reviews, total, page, limit } };
  }

  async deleteReview(userId: string, reviewId: string) {
    const review = await this.prisma.review.findFirst({ where: { id: reviewId, userId } });
    if (!review) throw new NotFoundException('Review not found');

    await this.prisma.review.delete({ where: { id: reviewId } });

    const reviews = await this.prisma.review.findMany({
      where: { productId: review.productId },
      select: { rating: true },
    });
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    await this.prisma.product.update({
      where: { id: review.productId },
      data: { averageRating: avgRating, reviewCount: reviews.length },
    });

    return { message: 'Review deleted' };
  }
}
