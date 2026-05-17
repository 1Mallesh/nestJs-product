import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { CreateProductDto, UpdateProductDto, CreateVariantDto } from './dto/product.dto';
import { NotificationType } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private trackingGateway: TrackingGateway,
  ) {}

  async create(userId: string, dto: CreateProductDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenException('Vendor profile not found');
    if (vendor.approvalStatus !== 'APPROVED') {
      throw new ForbiddenException('Vendor account not yet approved');
    }

    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException('Category not found');
    if (!category.isActive) throw new BadRequestException('Category is inactive');

    const slug = `${dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;

    const product = await this.prisma.product.create({
      data: {
        ...dto,
        slug,
        vendorId: vendor.id,
        images: dto.images || [],
        tags: dto.tags || [],
        approvalStatus: 'PENDING',
        isPublished: false,
      },
    });

    // Notify all admins via DB + socket
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
    await Promise.all(
      admins.map(async (admin) => {
        const notif = await this.notifications.create(
          admin.id,
          'New Product Pending Approval',
          `Vendor "${vendor.shopName}" submitted "${product.name}" for review.`,
          NotificationType.GENERAL,
          { productId: product.id },
        );
        this.trackingGateway.emitNotification(admin.id, notif);
      }),
    );

    this.trackingGateway.server?.emit('product.pending', {
      productId: product.id,
      vendorId: vendor.id,
      name: product.name,
    });

    return { success: true, message: 'Product submitted for approval', data: product };
  }

  async findAll(query: {
    page?: number; limit?: number; categoryId?: string; search?: string; minPrice?: number; maxPrice?: number;
  }) {
    const { page = 1, limit = 20, categoryId, search, minPrice, maxPrice } = query;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true, approvalStatus: 'APPROVED', isPublished: true };
    if (categoryId) where.categoryId = categoryId;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          vendor: { select: { shopName: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { success: true, message: 'Products fetched', data: { products, total, page, limit } };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        vendor: { select: { shopName: true, shopLogo: true } },
        variants: true,
        reviews: {
          include: { user: { select: { name: true, avatar: true } } },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return { success: true, message: 'Product fetched', data: product };
  }

  async update(userId: string, productId: string, dto: UpdateProductDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenException('Vendor not found');

    const product = await this.prisma.product.findFirst({
      where: { id: productId, vendorId: vendor.id },
    });
    if (!product) throw new NotFoundException('Product not found');

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: dto,
    });
    return { success: true, message: 'Product updated', data: updated };
  }

  async remove(userId: string, productId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenException('Vendor not found');

    const product = await this.prisma.product.findFirst({
      where: { id: productId, vendorId: vendor.id },
    });
    if (!product) throw new NotFoundException('Product not found');

    await this.prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
    return { success: true, message: 'Product deactivated' };
  }

  async addVariant(userId: string, productId: string, dto: CreateVariantDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenException('Vendor not found');

    const product = await this.prisma.product.findFirst({
      where: { id: productId, vendorId: vendor.id },
    });
    if (!product) throw new NotFoundException('Product not found');

    const variant = await this.prisma.productVariant.create({
      data: { ...dto, productId },
    });
    return { success: true, message: 'Variant added', data: variant };
  }

  async getVendorProducts(userId: string, page = 1, limit = 10) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new ForbiddenException('Vendor not found');

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { vendorId: vendor.id },
        include: { category: { select: { name: true } }, variants: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where: { vendorId: vendor.id } }),
    ]);

    return { success: true, message: 'Products fetched', data: { products, total, page, limit } };
  }
}
