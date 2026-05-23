"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ContentService", {
    enumerable: true,
    get: function() {
        return ContentService;
    }
});
const _common = require("@nestjs/common");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let ContentService = class ContentService {
    getSettings() {
        return {
            success: true,
            message: 'Settings fetched',
            data: {
                siteName: 'MyShop',
                currency: 'INR',
                currencySymbol: '₹',
                freeShippingThreshold: 500,
                supportEmail: 'support@myshop.com',
                supportPhone: '+91-9999999999',
                socialLinks: {
                    facebook: '',
                    instagram: '',
                    twitter: ''
                }
            }
        };
    }
    getBanners() {
        return {
            success: true,
            message: 'Banners fetched',
            data: [
                {
                    id: '1',
                    title: 'Summer Sale',
                    subtitle: 'Up to 50% off on selected items',
                    image: '/banners/summer-sale.jpg',
                    ctaText: 'Shop Now',
                    ctaLink: '/products?sale=true',
                    isActive: true
                },
                {
                    id: '2',
                    title: 'New Arrivals',
                    subtitle: 'Discover the latest trends',
                    image: '/banners/new-arrivals.jpg',
                    ctaText: 'Explore',
                    ctaLink: '/products?sortBy=newest',
                    isActive: true
                }
            ]
        };
    }
    getOffers() {
        return {
            success: true,
            message: 'Offers fetched',
            data: [
                {
                    id: '1',
                    title: 'First Order',
                    description: '10% off on your first order',
                    code: 'FIRST10',
                    discountType: 'PERCENTAGE',
                    discountValue: 10,
                    isActive: true
                },
                {
                    id: '2',
                    title: 'Free Shipping',
                    description: 'Free shipping on orders above ₹500',
                    code: null,
                    discountType: 'FREE_SHIPPING',
                    discountValue: 0,
                    minOrderValue: 500,
                    isActive: true
                }
            ]
        };
    }
    getTrustBadges() {
        return {
            success: true,
            message: 'Trust badges fetched',
            data: [
                {
                    id: '1',
                    icon: 'shield-check',
                    title: 'Secure Payment',
                    description: '100% secure transactions'
                },
                {
                    id: '2',
                    icon: 'truck',
                    title: 'Fast Delivery',
                    description: 'Delivered within 3-5 days'
                },
                {
                    id: '3',
                    icon: 'refresh',
                    title: 'Easy Returns',
                    description: '7-day hassle-free returns'
                },
                {
                    id: '4',
                    icon: 'headphones',
                    title: '24/7 Support',
                    description: 'We are here to help'
                }
            ]
        };
    }
};
ContentService = _ts_decorate([
    (0, _common.Injectable)()
], ContentService);

//# sourceMappingURL=content.service.js.map