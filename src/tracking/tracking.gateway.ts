import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/tracking',
})
export class TrackingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const raw: string =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization || '';

      if (!raw) {
        client.disconnect();
        return;
      }

      // Strip "Bearer " prefix if present — frontend sends both formats
      const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.role = payload.role;
      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-order-room')
  handleJoinOrderRoom(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`order:${data.orderId}`);
    this.logger.log(`Client ${client.id} joined room order:${data.orderId}`);
    return { event: 'joined', data: { room: `order:${data.orderId}` } };
  }

  @SubscribeMessage('leave-order-room')
  handleLeaveOrderRoom(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`order:${data.orderId}`);
    return { event: 'left', data: { room: `order:${data.orderId}` } };
  }

  emitLocationUpdate(orderId: string, location: {
    latitude: number;
    longitude: number;
    deliveryBoyId: string;
    timestamp: Date;
  }) {
    this.server.to(`order:${orderId}`).emit('location-update', location);
  }

  emitOrderStatusUpdate(orderId: string, status: string) {
    this.server.to(`order:${orderId}`).emit('order-status-update', { orderId, status, timestamp: new Date() });
    // Also emit to the global admin room
    this.server.emit('admin-order-update', { orderId, status, timestamp: new Date() });
  }

  /** Delivery boy broadcasts their GPS directly via socket (no REST call needed) */
  @SubscribeMessage('delivery-location')
  handleDeliveryLocation(
    @MessageBody() data: { orderId: string; latitude: number; longitude: number },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data.orderId || !data.latitude || !data.longitude) return;
    this.emitLocationUpdate(data.orderId, {
      latitude: data.latitude,
      longitude: data.longitude,
      deliveryBoyId: client.data.userId ?? 'unknown',
      timestamp: new Date(),
    });
  }

  emitNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  @SubscribeMessage('join-user-room')
  handleJoinUserRoom(@ConnectedSocket() client: Socket) {
    if (client.data.userId) {
      client.join(`user:${client.data.userId}`);
      return { event: 'joined', data: { room: `user:${client.data.userId}` } };
    }
  }
}
