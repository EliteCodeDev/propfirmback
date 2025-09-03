import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccount } from '../users/entities/user-account.entity';
import { CustomerOrder } from '../orders/entities/customer-order.entity';
import { Withdrawal } from '../withdrawals/entities/withdrawal.entity';
import { ChallengePlan } from '../challenge-templates/entities/challenge-plan.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(UserAccount)
    private userRepository: Repository<UserAccount>,
    @InjectRepository(CustomerOrder)
    private orderRepository: Repository<CustomerOrder>,
    @InjectRepository(Withdrawal)
    private withdrawalRepository: Repository<Withdrawal>,
    @InjectRepository(ChallengePlan)
    private challengePlanRepository: Repository<ChallengePlan>,
  ) {}

  async getStats() {
    try {
      // Get total counts
      const totalUsers = await this.userRepository.count();
      const totalOrders = await this.orderRepository.count();
      
      // Calculate total sales
      const salesResult = await this.orderRepository
        .createQueryBuilder('customerOrder')
        .select('SUM(CAST(customerOrder.total AS DECIMAL))', 'total')
        .where('customerOrder.orderStatus = :status', { status: 'completed' })
        .getRawOne();
      const totalSales = parseFloat(salesResult?.total || '0');
      
      // Get monthly data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const monthlyUsers = await this.userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :date', { date: thirtyDaysAgo })
        .getCount();
      
      const monthlyOrders = await this.orderRepository
        .createQueryBuilder('customerOrder')
        .where('customerOrder.createDateTime >= :date', { date: thirtyDaysAgo })
        .getCount();
      
      const monthlySalesResult = await this.orderRepository
        .createQueryBuilder('customerOrder')
        .select('SUM(CAST(customerOrder.total AS DECIMAL))', 'total')
        .where('customerOrder.createDateTime >= :date', { date: thirtyDaysAgo })
        .andWhere('customerOrder.orderStatus = :status', { status: 'completed' })
        .getRawOne();
      const monthlySales = parseFloat(monthlySalesResult?.total || '0');
      
      // Calculate withdrawals
      const withdrawableProfitsResult = await this.withdrawalRepository
        .createQueryBuilder('withdrawal')
        .select('SUM(CAST(withdrawal.amount AS DECIMAL))', 'total')
        .where('withdrawal.status = :status', { status: 'pending' })
        .getRawOne();
      const withdrawableProfits = parseFloat(withdrawableProfitsResult?.total || '0');
      
      const payoutsResult = await this.withdrawalRepository
        .createQueryBuilder('withdrawal')
        .select('SUM(CAST(withdrawal.amount AS DECIMAL))', 'total')
        .where('withdrawal.status = :status', { status: 'approved' })
        .getRawOne();
      const payouts = parseFloat(payoutsResult?.total || '0');
      
      // Calculate growth percentages (compare with previous month)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const previousMonthUsers = await this.userRepository
        .createQueryBuilder('user')
        .where('user.createdAt >= :startDate', { startDate: sixtyDaysAgo })
        .andWhere('user.createdAt < :endDate', { endDate: thirtyDaysAgo })
        .getCount();
      
      const previousMonthOrders = await this.orderRepository
        .createQueryBuilder('customerOrder')
        .where('customerOrder.createDateTime >= :startDate', { startDate: sixtyDaysAgo })
        .andWhere('customerOrder.createDateTime < :endDate', { endDate: thirtyDaysAgo })
        .getCount();
      
      const previousMonthSalesResult = await this.orderRepository
        .createQueryBuilder('customerOrder')
        .select('SUM(CAST(customerOrder.total AS DECIMAL))', 'total')
        .where('customerOrder.createDateTime >= :startDate', { startDate: sixtyDaysAgo })
        .andWhere('customerOrder.createDateTime < :endDate', { endDate: thirtyDaysAgo })
        .andWhere('customerOrder.orderStatus = :status', { status: 'completed' })
        .getRawOne();
      const previousMonthSales = parseFloat(previousMonthSalesResult?.total || '0');
      
      // Calculate growth percentages
      const userGrowthPercentage = previousMonthUsers > 0 
        ? ((monthlyUsers - previousMonthUsers) / previousMonthUsers) * 100 
        : 0;
      
      const orderGrowthPercentage = previousMonthOrders > 0 
        ? ((monthlyOrders - previousMonthOrders) / previousMonthOrders) * 100 
        : 0;
      
      const salesGrowthPercentage = previousMonthSales > 0 
        ? ((monthlySales - previousMonthSales) / previousMonthSales) * 100 
        : 0;
      
      return {
        totalUsers,
        totalOrders,
        totalSales,
        monthlyUsers,
        monthlyOrders,
        monthlySales,
        withdrawableProfits,
        payouts,
        userGrowth: {
          percentage: Math.abs(userGrowthPercentage),
          direction: userGrowthPercentage >= 0 ? 'up' : 'down'
        },
        orderGrowth: {
          percentage: Math.abs(orderGrowthPercentage),
          direction: orderGrowthPercentage >= 0 ? 'up' : 'down'
        },
        salesGrowth: {
          percentage: Math.abs(salesGrowthPercentage),
          direction: salesGrowthPercentage >= 0 ? 'up' : 'down'
        }
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  async getAnalytics() {
    try {
      // Get last 7 days data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
      });
      
      // User registrations per day
      const userRegistrations = await Promise.all(
        last7Days.map(async (date) => {
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);
          
          const count = await this.userRepository
            .createQueryBuilder('user')
            .where('user.createdAt >= :startDate', { startDate: date })
            .andWhere('user.createdAt < :endDate', { endDate: nextDay })
            .getCount();
          
          return {
            date: date.toISOString().split('T')[0],
            count
          };
        })
      );
      
      // Order volume per day
      const orderVolume = await Promise.all(
        last7Days.map(async (date) => {
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);
          
          const orders = await this.orderRepository
            .createQueryBuilder('customerOrder')
            .where('customerOrder.createDateTime >= :startDate', { startDate: date })
            .andWhere('customerOrder.createDateTime < :endDate', { endDate: nextDay })
            .getMany();
          
          const count = orders.length;
          const amount = orders.reduce((sum, order) => 
            sum + parseFloat(order.total?.toString() || '0'), 0
          );
          
          return {
            date: date.toISOString().split('T')[0],
            count,
            amount
          };
        })
      );
      
      // Withdrawal requests per day
      const withdrawalRequests = await Promise.all(
        last7Days.map(async (date) => {
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);
          
          const withdrawals = await this.withdrawalRepository
            .createQueryBuilder('withdrawal')
            .where('withdrawal.createdAt >= :startDate', { startDate: date })
            .andWhere('withdrawal.createdAt < :endDate', { endDate: nextDay })
            .getMany();
          
          const count = withdrawals.length;
          const amount = withdrawals.reduce((sum, withdrawal) => 
            sum + parseFloat(withdrawal.amount?.toString() || '0'), 0
          );
          
          return {
            date: date.toISOString().split('T')[0],
            count,
            amount
          };
        })
      );
      
      return {
        userRegistrations,
        orderVolume,
        withdrawalRequests
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard analytics: ${error.message}`);
    }
  }

  async getTopPlans() {
    try {
      // Get all challenge plans (simplified version without order relations)
      const topPlans = await this.challengePlanRepository
        .createQueryBuilder('plan')
        .select([
          'plan.planID as plan_id',
          'plan.name as plan_name',
          'plan.isActive as is_active'
        ])
        .where('plan.isActive = :isActive', { isActive: true })
        .limit(5)
        .getRawMany();
      
      return topPlans.map(plan => ({
        id: plan.plan_id,
        name: plan.plan_name || `Plan ${plan.plan_id}`,
        sales: Math.floor(Math.random() * 100), // Mock data for now
        revenue: Math.floor(Math.random() * 10000), // Mock data for now
        growth: Math.floor(Math.random() * 30) - 10 // Random growth for now
      }));
    } catch (error) {
      throw new Error(`Failed to get top plans: ${error.message}`);
    }
  }

  async getOverview() {
    try {
      const [stats, analytics, topPlans] = await Promise.all([
        this.getStats(),
        this.getAnalytics(),
        this.getTopPlans()
      ]);
      
      return {
        stats,
        analytics,
        topPlans
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard overview: ${error.message}`);
    }
  }
}