import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEmail } from 'class-validator';

export class CreateUserDto {

    @ApiProperty({
        description: 'Login number for the user',
        example: 0,
        required: false
    })
    @IsNumber()
    @IsOptional()
    login?: number

    @ApiProperty({
        description: 'Group name for the user',
        example: 'string'
    })
    @IsString()
    @IsNotEmpty()
    group: string;

    @ApiProperty({
        description: 'Full name of the user',
        example: 'string'
    })
    @IsString()
    @IsNotEmpty()
    name: string

    @ApiProperty({
        description: 'Password for the user account',
        example: 'string'
    })
    @IsString()
    @IsNotEmpty()
    password: string

    @ApiProperty({
        description: 'Email address of the user',
        example: 'user@example.com'
    })
    @IsEmail()
    @IsString()
    @IsNotEmpty()
    email: string

    @ApiProperty({
        description: 'Phone number of the user',
        example: '+1234567890'
    })
    @IsString()
    @IsNotEmpty()
    phone: string

    @ApiProperty({
        description: 'Country where the user is located',
        example: 'United States'
    })
    @IsString()
    @IsNotEmpty()
    country: string

    @ApiProperty({
        description: 'City where the user is located',
        example: 'New York'
    })
    @IsNotEmpty()
    @IsString()
    city: string 

    @ApiProperty({
        description: 'State or province where the user is located',
        example: 'NY'
    })
    @IsNotEmpty()
    @IsString()
    state: string

    @ApiProperty({
        description: 'Zip code or postal code',
        example: '10001'
    })
    @IsNotEmpty()
    @IsString()
    zipcode: string

    @ApiProperty({
        description: 'Street address of the user',
        example: '123 Main Street'
    })
    @IsNotEmpty()
    @IsString()
    address: string

    @ApiProperty({
        description: 'Optional comment or notes',
        example: 'Additional information',
        required: false
    })
    @IsOptional()
    @IsString()
    comment?: string

    @ApiProperty({
        description: 'Leverage ratio for trading',
        example: 100
    })
    @IsNotEmpty()
    @IsNumber()
    leverage: number

    @ApiProperty({
        description: 'Enable status (1 for enabled, 0 for disabled)',
        example: 1
    })
    @IsNumber()
    @IsNotEmpty()
    enable: number

    @ApiProperty({
        description: 'Investor password for read-only access',
        example: 'investor123'
    })
    @IsString()
    @IsNotEmpty()
    investor_password: string
}