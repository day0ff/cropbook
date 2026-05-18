import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { SchemasService } from './schemas.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import type { TaskType } from '@cropbook/shared/types';

@Controller('books')
export class SchemasController {
  constructor(private readonly schemas: SchemasService) {}

  @Get(':bookName/schemas/:mask')
  async getSchemas(
    @Param('bookName') bookName: string,
    @Param('mask') mask: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    items: TaskType[];
    total: number;
    page: number;
    limit: number;
  }> {
    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    return this.schemas.getSchemas(bookName, mask, p, l);
  }

  @Post(':bookName/schemas/:mask/tasks')
  async createTask(
    @Param('bookName') bookName: string,
    @Param('mask') mask: string,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskType> {
    return this.schemas.createTask(bookName, mask, dto as any);
  }

  @Get(':bookName/schemas/:mask/tasks/:orderNumber')
  async getTask(
    @Param('bookName') bookName: string,
    @Param('mask') mask: string,
    @Param('orderNumber', ParseIntPipe) orderNumber: number,
  ): Promise<TaskType> {
    const task = await this.schemas.getTask(bookName, mask, orderNumber);
    if (!task) {
      throw new BadRequestException('Task not found');
    }
    return task;
  }

  @Put(':bookName/schemas/:mask/tasks/:orderNumber')
  async updateTask(
    @Param('bookName') bookName: string,
    @Param('mask') mask: string,
    @Param('orderNumber', ParseIntPipe) orderNumber: number,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskType> {
    try {
      return this.schemas.updateTask(bookName, mask, orderNumber, dto as any);
    } catch (err) {
      // @ts-ignore
      throw new BadRequestException(err?.message ?? 'Update failed');
    }
  }

  @Delete(':bookName/schemas/:mask/tasks/:orderNumber')
  async deleteTask(
    @Param('bookName') bookName: string,
    @Param('mask') mask: string,
    @Param('orderNumber', ParseIntPipe) orderNumber: number,
  ): Promise<{ success: boolean }> {
    try {
      await this.schemas.deleteTask(bookName, mask, orderNumber);
      return { success: true };
    } catch (err) {
      // @ts-ignore
      throw new BadRequestException(err?.message ?? 'Delete failed');
    }
  }
}
