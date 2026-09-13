import httpStatus from 'http-status';
import { Prisma } from '../../../../generated/prisma/client';
import { PaymentProvider, PaymentStatus } from '../../../../generated/prisma/enums';
import { prisma } from "../../../lib/prisma";
import { AppError } from "../../../utils/AppError";
import { BkashService } from './bkash.service';

const createBkashPaymentService = async (
  purchaseId: string,
  userId: string,
) => {
  const purchase = await prisma.assetPurchase.findUnique({
    where: {
      id: purchaseId,
    },
    include: {
      asset: true,
      vendor: true,
    },
  });

  if (!purchase) {
    throw new AppError(httpStatus.NOT_FOUND, "Asset purchase not found");
  }

  if (purchase.createdById !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not allowed to pay for this purchase",
    );
  }

  if (purchase.paymentStatus === PaymentStatus.PAID) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "This purchase has already been paid",
    );
  }

  // Check existing pending payment
  const existingPayment = await prisma.payment.findFirst({
    where: {
      purchaseId,
      userId,
      paymentStatus: PaymentStatus.PENDING,
      provider: PaymentProvider.BKASH,
    },
  });

  if (existingPayment?.paymentUrl) {
    return {
      paymentId: existingPayment.id,
      paymentUrl: existingPayment.paymentUrl,
      transactionId: existingPayment.transactionId,
      amount: existingPayment.amount,
    };
  }

  const bkashResponse = await BkashService.createPayment(
    Number(purchase.totalAmount),
    purchase.invoiceNumber,
  );

  if (!bkashResponse.paymentID) {
    throw new AppError(
      400,
      "Failed to create bKash payment",
    );
  }

  const payment = await prisma.payment.create({
    data: {
      userId,
      purchaseId,

      amount: new Prisma.Decimal(purchase.totalAmount),

      currency: "BDT",

      provider: PaymentProvider.BKASH,

      transactionId: bkashResponse.paymentID,

      paymentStatus: PaymentStatus.PENDING,

      paymentUrl: bkashResponse.bkashURL,
    },
  });

  return {
    paymentId: payment.id,
    paymentUrl: payment.paymentUrl,
    transactionId: payment.transactionId,
    amount: payment.amount,
  };
};

const executeBkashPayment = async (
  paymentId: string,
  userId: string,
) => {
  // Find payment
  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
    include: {
      purchase: true,
    },
  });

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  // Check ownership
  if (payment.userId !== userId) {
    throw new AppError(
      403,
      "You are not allowed to execute this payment",
    );
  }

  // Already paid
  if (payment.paymentStatus === PaymentStatus.PAID) {
    return payment;
  }

  const paymentID = payment.transactionId;

  const bkashResponse =
    await BkashService.executePayment(paymentID);

  if (
    bkashResponse.transactionStatus !== "Completed"
  ) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        paymentStatus: PaymentStatus.FAILED,
      },
    });

    throw new AppError(
      400,
      "bKash payment was not completed",
    );
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const updatedPayment =
        await tx.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            transactionId: bkashResponse.trxID,

            paymentStatus: PaymentStatus.PAID,

            paidAt: new Date(),
          },
        });

      await tx.assetPurchase.update({
        where: {
          id: payment.purchaseId,
        },
        data: {
          paymentStatus: PaymentStatus.PAID,
        },
      });

      return updatedPayment;
    },
  );

  return result;
};

export const PaymentBkashService = {
  createBkashPaymentService,
  executeBkashPayment,
};