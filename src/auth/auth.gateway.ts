import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { TelegramClient } from 'telegram';
import { filter, firstValueFrom, Subject } from 'rxjs';
import { StringSession } from 'telegram/sessions';
import { Socket } from 'socket.io';
import { AuthSession } from '../auth-session/auth-session.interface';
import { RPCError } from 'telegram/errors';
import * as process from 'process';
import env from "../utils/env";

@WebSocketGateway()
export class AuthGateway implements OnGatewayConnection {
  sessions: AuthSession[] = [];
  @SubscribeMessage('phoneNumber')
  handlePhoneNumber(client: Socket, payload: string): void {
    this.removeSession(payload);
    this.sessions.push({
      phoneNumber: payload,
      phoneCode: new Subject(),
      password: new Subject(),
    });

    const telegram = new TelegramClient(
      new StringSession(''),
      Number(env('API_ID')),
      env('API_HASH'),
      {
        connectionRetries: 2,
      },
    );

    telegram
      .start({
        phoneNumber: payload,
        password: async () => {
          client.emit('status', { name: 'Enter password', code: 1 });
          return await firstValueFrom(this.findSession(payload).password);
        },
        phoneCode: async () => {
          client.emit('status', { name: 'Enter code', code: 0 });
          return await firstValueFrom(this.findSession(payload).phoneCode);
        },
        onError: (err: RPCError) => {
          client.emit('error', { code: err.code, message: err.errorMessage });
        },
      })
      .then((x) => {
        client.emit('loggedIn', { session: telegram.session.save() });
        this.removeSession(payload);
      })
      .catch((err: RPCError) => {
        client.emit('error', { code: err.code, message: err.errorMessage });
      });
  }
  @SubscribeMessage('phoneCode')
  handlePhoneCode(client: any, payload: any): void {
    this.findSession(payload.phoneNumber).phoneCode.next(payload.data);
  }

  @SubscribeMessage('password')
  handlePassword(client: any, payload: any): void {
    this.findSession(payload.phoneNumber).password.next(payload.data);
  }

  handleConnection(client: any, ...args: any[]): any {
    console.log('new connection');
  }

  findSession(phoneNumber: string): AuthSession {
    return this.sessions.find((item) => item.phoneNumber == phoneNumber);
  }
  removeSession(phoneNumber: string): void {
    this.sessions = this.sessions.filter(
      (item) => item.phoneNumber != phoneNumber,
    );
  }
}
