import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto, role: string = 'VENDOR') {
    const slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Category already exists');

    const isActive = role === 'ADMIN';
    const category = await this.prisma.category.create({ data: { ...dto, slug, isActive } });

    const message = isActive ? 'Category created successfully' : 'Category submitted for admin approval';
    return { message, data: category };
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: { children: { where: { isActive: true } } },
    });
    return { message: 'Categories fetched', data: categories };
  }

  async findAllAdmin() {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ isActive: 'asc' }, { createdAt: 'desc' }],
      include: { children: true },
    });
    return { message: 'All categories fetched', data: categories };
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: { where: { isActive: true } },
        products: {
          where: { isActive: true, approvalStatus: 'APPROVED', isPublished: true },
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, name: true, slug: true, images: true,
            price: true, comparePrice: true, averageRating: true, stock: true,
          },
        },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return { message: 'Category fetched', data: category };
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        products: { where: { isActive: true, approvalStatus: 'APPROVED' }, take: 10 },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return { message: 'Category fetched', data: category };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');

    const updated = await this.prisma.category.update({ where: { id }, data: dto });
    return { message: 'Category updated', data: updated };
  }

  async remove(id: string) {
    await this.prisma.category.update({ where: { id }, data: { isActive: false } });
    return { message: 'Category deactivated' };
  }
}
