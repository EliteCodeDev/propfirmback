import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateCompleteOrderDto } from './dto/create-complete-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard, GenericApiKeyGuard } from 'src/common/guards';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiKeyService, Public } from 'src/common/decorators';
@ApiTags('Orders')

// @UseGuards(GenericApiKeyGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new order' })
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Post('create-complete')
  @Public()
  // @UseGuards(ApiKeyOrAdminGuard)
  // @ApiKeyService('n8n')
  @ApiOperation({ summary: 'Create a complete order' })
  createCompleteOrder(@Body() createOrderDto: CreateCompleteOrderDto) {
    return this.ordersService.createCompleteOrder(createOrderDto);
  }

  @Get('get-all')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get all orders' })
  findAll(@Query() query: any) {
    return this.ordersService.findAll(query);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get current user orders' })
  findMyOrders(@Request() req, @Query() query: any) {
    return this.ordersService.findByUserId(req.user.userID, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update order' })
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete order' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
