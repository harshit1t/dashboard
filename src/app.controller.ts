import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('cats')
  findAll(): string {
    return 'This action returns all cats';
  }

  @Get('user')
  getAllUser(@Req() req): object {
    const email = req.clerkUser?.email;
    return this.appService.getAllUser(email);
  }
}
