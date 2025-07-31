import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto<T> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data?: T;

  @ApiProperty()
  errors?: any;

  constructor(success: boolean, message: string, data?: T, errors?: any) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.errors = errors;
  }
}

export class PaginatedResponseDto<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.meta = {
      total,
      page,
      lastPage: Math.ceil(total / limit),
      limit,
    };
  }
}