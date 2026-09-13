import { Router } from "express";
import { TestController } from "./testController";

const router = Router();

router.post("/zod", TestController.testOne);
router.post("/bkashToken", TestController.bkashTokenController);

export const TestRoutes = router;
