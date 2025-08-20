import { UserAccount } from 'src/modules/users/entities';
import { CreateCompleteOrderDto } from '../dto/create-complete-order.dto';
import {
  ChallengeBalance,
  ChallengeRelation,
} from 'src/modules/challenge-templates/entities';
export type ServiceStatus = 'success' | 'error';

export interface ServiceResult<T> {
  status: ServiceStatus;
  message: string;
  data?: T;
  failedAt?:
    | 'user_lookup'
    | 'user_create'
    | 'email_send'
    | 'relation_fetch'
    | 'relation_balance_match'
    | 'smt_account_create'
    | 'broker_account_create'
    | 'challenge_create'
    | 'order_save';
  // Optional diagnostic details. Avoid leaking sensitive data.
  details?: any;
}
export interface wooOrderProduct {
  productID: number;
  variationID: number;
  name: string;
  price: number;
}
export interface createUserByOrderResponse {
  user: UserAccount;
  password: string;
}
export interface wooUserData {
  wooId?: number;
  email: string;
  name: string;
  billing: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    phone?: string;
  };
}
export interface wooCoupon {
  wooId: number;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
}
export interface createSmtApiChallengeData {
  user: UserAccount;
  createOrderDto: CreateCompleteOrderDto;
  balance: ChallengeBalance;
  leverage: string;
  ip?: string;
  url?: string;
  parentID?: string;
  platform: string;
  relation: ChallengeRelation;
}
