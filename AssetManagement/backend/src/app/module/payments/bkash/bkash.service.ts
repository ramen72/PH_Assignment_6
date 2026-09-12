import config from "../../../config";
import type { IBkashCreatePaymentResponse, IBkashExecutePaymentResponse, IBkashGrantTokenResponse } from "./payment.bkash.interface";

let bkashToken: string | null = null;
let tokenExpireAt = 0;

const getBkashToken = async (): Promise<string> => {
  // Return existing valid token
  if (bkashToken && Date.now() < tokenExpireAt) {
    return bkashToken;
  }

  const response = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/token/grant`,
    {
      method: "POST",
      headers: {
        username: config.bkash_username,
        password: config.bkash_password,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        app_key: config.bkash_app_key,
        app_secret: config.bkash_app_secret,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.text();

    throw new Error(
      `bKash token request failed: ${response.status} ${errorData}`,
    );
  }

  const data =
    (await response.json()) as IBkashGrantTokenResponse;

  bkashToken = data.id_token;

  // Keep 60 seconds safety buffer
  tokenExpireAt =
    Date.now() + (data.expires_in - 60) * 1000;

  return bkashToken;
};

const createPayment = async (
  amount: number,
  invoiceNumber: string,
): Promise<IBkashCreatePaymentResponse> => {
  const token = await getBkashToken();

  const response = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "X-APP-Key": config.bkash_app_key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: invoiceNumber,
        callbackURL: config.bkash_callback_url,
        amount: amount.toFixed(2),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: invoiceNumber,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.text();

    throw new Error(
      `bKash create payment failed: ${response.status} ${errorData}`,
    );
  }

  const data =
    (await response.json()) as IBkashCreatePaymentResponse;

  return data;
};

const executePayment = async (
  paymentID: string,
): Promise<IBkashExecutePaymentResponse> => {
  const token = await getBkashToken();

  const response = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/execute`,
    {
      method: "POST",
      headers: {
        Authorization: token,
        "X-APP-Key": config.bkash_app_key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        paymentID,
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.text();

    throw new Error(
      `bKash execute payment failed: ${response.status} ${errorData}`,
    );
  }

  const data =
    (await response.json()) as IBkashExecutePaymentResponse;

  return data;
};

export const BkashService = {
  getBkashToken,
  createPayment,
  executePayment,
};