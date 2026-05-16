"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting seed...');
    const adminPassword = await bcrypt.hash('Admin@123456', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@ecommerce.com' },
        update: {},
        create: {
            name: 'Super Admin',
            email: 'admin@ecommerce.com',
            phone: '9999999999',
            password: adminPassword,
            role: 'ADMIN',
            isEmailVerified: true,
            isPhoneVerified: true,
        },
    });
    const vendorPassword = await bcrypt.hash('Vendor@123456', 12);
    const vendorUser = await prisma.user.upsert({
        where: { email: 'vendor@ecommerce.com' },
        update: {},
        create: {
            name: 'Test Vendor',
            email: 'vendor@ecommerce.com',
            phone: '9888888888',
            password: vendorPassword,
            role: 'VENDOR',
            isEmailVerified: true,
        },
    });
    await prisma.vendor.upsert({
        where: { userId: vendorUser.id },
        update: {},
        create: {
            userId: vendorUser.id,
            shopName: 'Tech Gadgets Store',
            shopDescription: 'Best gadgets at affordable prices',
            gstNumber: '29ABCDE1234F1Z5',
            panNumber: 'ABCDE1234F',
            aadhaarNumber: '123456789012',
            bankAccountNumber: '1234567890',
            bankIfscCode: 'SBIN0001234',
            bankAccountName: 'Test Vendor',
            approvalStatus: 'APPROVED',
            commissionRate: 10,
        },
    });
    const customerPassword = await bcrypt.hash('Customer@123456', 12);
    const customer = await prisma.user.upsert({
        where: { email: 'customer@ecommerce.com' },
        update: {},
        create: {
            name: 'Test Customer',
            email: 'customer@ecommerce.com',
            phone: '9777777777',
            password: customerPassword,
            role: 'CUSTOMER',
            isEmailVerified: true,
        },
    });
    const deliveryPassword = await bcrypt.hash('Delivery@123456', 12);
    const deliveryUser = await prisma.user.upsert({
        where: { email: 'delivery@ecommerce.com' },
        update: {},
        create: {
            name: 'Test Delivery Boy',
            email: 'delivery@ecommerce.com',
            phone: '9666666666',
            password: deliveryPassword,
            role: 'DELIVERY_BOY',
            isEmailVerified: true,
        },
    });
    await prisma.deliveryBoy.upsert({
        where: { userId: deliveryUser.id },
        update: {},
        create: {
            userId: deliveryUser.id,
            aadhaarNumber: '987654321098',
            panNumber: 'XYZAB1234C',
            drivingLicense: 'KA01234567890',
            vehicleType: 'BIKE',
            vehicleNumber: 'KA01AB1234',
            bankAccountNumber: '9876543210',
            bankIfscCode: 'HDFC0001234',
            bankAccountName: 'Test Delivery Boy',
            approvalStatus: 'APPROVED',
        },
    });
    const electronics = await prisma.category.upsert({
        where: { slug: 'electronics' },
        update: {},
        create: {
            name: 'Electronics',
            slug: 'electronics',
            description: 'Electronic gadgets and devices',
        },
    });
    const fashion = await prisma.category.upsert({
        where: { slug: 'fashion' },
        update: {},
        create: {
            name: 'Fashion',
            slug: 'fashion',
            description: 'Clothing, footwear and accessories',
        },
    });
    await prisma.category.upsert({
        where: { slug: 'smartphones' },
        update: {},
        create: {
            name: 'Smartphones',
            slug: 'smartphones',
            description: 'Latest smartphones',
            parentId: electronics.id,
        },
    });
    await prisma.coupon.upsert({
        where: { code: 'WELCOME10' },
        update: {},
        create: {
            code: 'WELCOME10',
            description: '10% off on first order',
            discountType: 'PERCENTAGE',
            discountValue: 10,
            minOrderAmount: 500,
            maxDiscount: 200,
            usageLimit: 1000,
            isActive: true,
        },
    });
    await prisma.banner.create({
        data: {
            title: 'Welcome to E-Commerce',
            image: 'https://example.com/banner.jpg',
            link: '/products',
            isActive: true,
            sortOrder: 1,
        },
    });
    console.log('✅ Seed completed!');
    console.log('\nTest Credentials:');
    console.log('Admin:    admin@ecommerce.com    / Admin@123456');
    console.log('Vendor:   vendor@ecommerce.com   / Vendor@123456');
    console.log('Customer: customer@ecommerce.com / Customer@123456');
    console.log('Delivery: delivery@ecommerce.com / Delivery@123456');
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=seed.js.map