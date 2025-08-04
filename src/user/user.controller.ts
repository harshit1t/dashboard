// src/user/user.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getAll() {
    return this.userService.getAllUsers();
  }

  @Post()
  create(@Body() body: { name: string; email: string; role: any }) {
    return this.userService.createUser(body.name, body.email, body.role);
  }
}
