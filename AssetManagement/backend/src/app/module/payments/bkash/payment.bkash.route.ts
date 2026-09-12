import express from "express";
import { UserRole } from "../../../../generated/prisma/enums";
import { auth } from "../../../middleware/checkAuth";
import { PaymentBkashController } from "./payment.bkash.controller";

const router = express.Router();

router.post(
  "/create/:purchaseId",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE),
  PaymentBkashController.createBkashPayment,
);

router.post(
  "/execute/:paymentId",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE),
  PaymentBkashController.executeBkashPayment,
);

export const PaymentBkashRoutes = router;