"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthService", {
    enumerable: true,
    get: function() {
        return AuthService;
    }
});
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
const _config = require("@nestjs/config");
const _bcryptjs = /*#__PURE__*/ _interop_require_wildcard(require("bcryptjs"));
const _prismaservice = require("../prisma/prisma.service");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let AuthService = class AuthService {
    async register(dto) {
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [
                    {
                        email: dto.email
                    },
                    {
                        phone: dto.phone
                    }
                ]
            }
        });
        if (existing) {
            throw new _common.ConflictException('Email or phone already registered');
        }
        const hashedPassword = await _bcryptjs.hash(dto.password, 12);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                password: hashedPassword,
                role: dto.role || 'CUSTOMER',
                otp,
                otpExpiresAt
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true
            }
        });
        // TODO: Send OTP via email/SMS using notification service
        return {
            message: `OTP sent to ${dto.email}. OTP: ${otp} (dev only)`,
            data: user
        };
    }
    async verifyOtp(dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });
        if (!user || user.otp !== dto.otp) {
            throw new _common.BadRequestException('Invalid OTP');
        }
        if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
            throw new _common.BadRequestException('OTP expired');
        }
        await this.prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                isEmailVerified: true,
                otp: null,
                otpExpiresAt: null
            }
        });
        return {
            message: 'Email verified successfully'
        };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });
        if (!user || !await _bcryptjs.compare(dto.password, user.password)) {
            throw new _common.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new _common.UnauthorizedException('Account is deactivated');
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                refreshToken: tokens.refreshToken
            }
        });
        return {
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                },
                ...tokens
            }
        };
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user || user.refreshToken !== refreshToken) {
            throw new _common.UnauthorizedException('Invalid refresh token');
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                refreshToken: tokens.refreshToken
            }
        });
        return {
            message: 'Tokens refreshed',
            data: tokens
        };
    }
    async logout(userId) {
        await this.prisma.user.update({
            where: {
                id: userId
            },
            data: {
                refreshToken: null
            }
        });
        return {
            message: 'Logged out successfully'
        };
    }
    async forgotPassword(dto) {
        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        });
        if (!user) throw new _common.NotFoundException('User not found');
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await this.prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                otp,
                otpExpiresAt
            }
        });
        // TODO: Send OTP via email
        return {
            message: `Password reset OTP sent. OTP: ${otp} (dev only)`
        };
    }
    async resetPassword(dto) {
        const user = await this.prisma.user.findFirst({
            where: {
                otp: dto.token
            }
        });
        if (!user) throw new _common.BadRequestException('Invalid or expired token');
        if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
            throw new _common.BadRequestException('Token expired');
        }
        const hashedPassword = await _bcryptjs.hash(dto.newPassword, 12);
        await this.prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                password: hashedPassword,
                otp: null,
                otpExpiresAt: null,
                refreshToken: null
            }
        });
        return {
            message: 'Password reset successfully'
        };
    }
    async generateTokens(userId, email, role) {
        const payload = {
            sub: userId,
            email,
            role
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_EXPIRES_IN')
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN')
            })
        ]);
        return {
            accessToken,
            refreshToken
        };
    }
    constructor(prisma, jwtService, configService){
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
};
AuthService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _jwt.JwtService === "undefined" ? Object : _jwt.JwtService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], AuthService);

//# sourceMappingURL=auth.service.js.map