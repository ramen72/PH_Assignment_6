import type { PaymentProvider, PaymentStatus } from "../../../../generated/prisma/enums";

export interface IBkashGrantTokenResponse {
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface IBkashCreatePaymentResponse {
  paymentID: string;
  createTime: string;
  orgCode: string;
  intent: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  merchantInvoiceNumber: string;
  bkashURL: string;
  callbackURL: string;
}

export interface IBkashExecutePaymentResponse {
  paymentID: string;
  createTime: string;
  updateTime: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  customerMsisdn?: string;
  verificationStatus?: string;
  statusCode: string;
  statusMessage?: string;
}

export interface ICreateBkashPaymentPayload {
  purchaseId: string;
}

export interface IExecuteBkashPaymentPayload {
  paymentID: string;
}

export interface ICreatePaymentRecord {
  userId: string;
  purchaseId: string;
  amount: number;
  currency?: string;
  provider: PaymentProvider;
  transactionId: string;
  paymentStatus?: PaymentStatus;
  paymentUrl?: string;
}