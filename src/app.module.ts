import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGateway } from './auth/auth.gateway';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, AuthGateway],
})
export class AppModule {}
