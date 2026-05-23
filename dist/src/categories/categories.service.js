"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CategoriesService", {
    enumerable: true,
    get: function() {
        return CategoriesService;
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
let CategoriesService = class CategoriesService {
    async create(dto, role = 'VENDOR') {
        const slug = dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const existing = await this.prisma.category.findUnique({
            where: {
                slug
            }
        });
        if (existing) throw new _common.ConflictException('Category already exists');
        const isActive = role === 'ADMIN';
        const category = await this.prisma.category.create({
            data: {
                ...dto,
                slug,
                isActive
            }
        });
        const message = isActive ? 'Category created successfully' : 'Category submitted for admin approval';
        return {
            message,
            data: category
        };
    }
    async findAll() {
        const categories = await this.prisma.category.findMany({
            where: {
                isActive: true,
                parentId: null
            },
            include: {
                children: {
                    where: {
                        isActive: true
                    }
                }
            }
        });
        return {
            message: 'Categories fetched',
            data: categories
        };
    }
    async findAllAdmin() {
        const categories = await this.prisma.category.findMany({
            orderBy: [
                {
                    isActive: 'asc'
                },
                {
                    createdAt: 'desc'
                }
            ],
            include: {
                children: true
            }
        });
        return {
            message: 'All categories fetched',
            data: categories
        };
    }
    async findBySlug(slug) {
        const category = await this.prisma.category.findUnique({
            where: {
                slug
            },
            include: {
                children: {
                    where: {
                        isActive: true
                    }
                },
                products: {
                    where: {
                        isActive: true,
                        approvalStatus: 'APPROVED',
                        isPublished: true
                    },
                    take: 20,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        images: true,
                        price: true,
                        comparePrice: true,
                        averageRating: true,
                        stock: true
                    }
                }
            }
        });
        if (!category) throw new _common.NotFoundException('Category not found');
        return {
            message: 'Category fetched',
            data: category
        };
    }
    async findOne(id) {
        const category = await this.prisma.category.findUnique({
            where: {
                id
            },
            include: {
                children: true,
                products: {
                    where: {
                        isActive: true,
                        approvalStatus: 'APPROVED'
                    },
                    take: 10
                }
            }
        });
        if (!category) throw new _common.NotFoundException('Category not found');
        return {
            message: 'Category fetched',
            data: category
        };
    }
    async update(id, dto) {
        const category = await this.prisma.category.findUnique({
            where: {
                id
            }
        });
        if (!category) throw new _common.NotFoundException('Category not found');
        const updated = await this.prisma.category.update({
            where: {
                id
            },
            data: dto
        });
        return {
            message: 'Category updated',
            data: updated
        };
    }
    async remove(id) {
        await this.prisma.category.update({
            where: {
                id
            },
            data: {
                isActive: false
            }
        });
        return {
            message: 'Category deactivated'
        };
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
CategoriesService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], CategoriesService);

//# sourceMappingURL=categories.service.js.map