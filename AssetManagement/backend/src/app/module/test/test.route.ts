import { Router } from "express";
import { TestController } from "./testController";

const router = Router();

router.post("/zod", TestController.testOne);
router.get("/testTwo", TestController.testTwo);
router.get("/testThree", TestController.testThree);
router.get("/testFour", TestController.testFour);
router.post("/testFive", TestController.testFive);

export const TestRoutes = router;
