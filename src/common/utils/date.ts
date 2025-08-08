import * as moment from 'moment';

export class DateUtil {
  static formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
    return moment(date).format(format);
  }

  static addDays(date: Date, days: number): Date {
    return moment(date).add(days, 'days').toDate();
  }

  static subtractDays(date: Date, days: number): Date {
    return moment(date).subtract(days, 'days').toDate();
  }

  static isAfter(date1: Date, date2: Date): boolean {
    return moment(date1).isAfter(date2);
  }

  static isBefore(date1: Date, date2: Date): boolean {
    return moment(date1).isBefore(date2);
  }

  static getDifferenceInDays(date1: Date, date2: Date): number {
    return moment(date1).diff(moment(date2), 'days');
  }
}