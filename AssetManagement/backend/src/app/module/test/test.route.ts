import { Router } from "express";
import { TestController } from "./testController";

const router = Router();

router.post("/zod", TestController.testOne);

export const TestRoutes = router;
