import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { WithdrawalStatus } from 'src/common/enums/withdrawal-status.enum';

export class UpdateWithdrawalStatusDto {
  @ApiProperty({
    enum: WithdrawalStatus,
    description: 'New status for the withdrawal',
    required: true,
  })
  @IsEnum(WithdrawalStatus)
  status: WithdrawalStatus;

  @ApiProperty({
    description:
      'Observación (usa este campo para detallar aprobación o rechazo)',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  observation?: string;
}
