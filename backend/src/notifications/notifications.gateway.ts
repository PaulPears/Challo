import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: false,
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');

  afterInit(server: Server) {
    this.logger.log('Initialized!');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendRideUpdate(rideId: string, status: string, ride: any) {
    this.logger.log(`Emitting ride update for ${rideId}: ${status}`);
    this.server.emit(`ride-${rideId}`, { status, ride });
  }

  sendNewRideToDriver(driverUserId: string, ride: any) {
    const eventName = `new-ride-driver-${driverUserId}`;
    this.logger.log(`Emitting targeted ride to ${driverUserId} on ${eventName}`);
    this.server.emit(eventName, ride);
  }

  sendNewRideToAll(ride: any) {
    this.logger.log(`Emitting broadcast ride: ${ride.id}`);
    this.server.emit('new-ride', ride);
  }

  sendDriverLocation(driverId: string, location: { latitude: number; longitude: number }, rideId?: string) {
    // Broadcast generally for the driver
    this.server.emit(`driver-location-${driverId}`, location);

    // If a specific ride is ongoing, broadcast to that ride's channel
    if (rideId) {
      this.server.emit(`ride-location-${rideId}`, location);
    }
  }

  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }
}

