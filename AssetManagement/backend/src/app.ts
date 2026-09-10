import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { TestRoutes } from "./app/module/test/test.route";
// import { UserRoutes } from "./app/module/user/user.route";
import { AssetRoutes } from "./app/module/asset/asset.route";
import { AssetCategoryRoutes } from "./app/module/category/category.route";
import { VendorRoutes } from "./app/module/vendor/vendor.route";
import { AssetPurchaseRoutes } from "./app/module/assetPurchase/assetPurchase.route";

const app: Application = express();

app.use(
	cors({
		origin: config.frontend_url,
		credentials: true,
	}),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

// Model Routes
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/assets", AssetRoutes);
app.use("/api/v1/assetCategories", AssetCategoryRoutes);
app.use("/api/v1/vendors", VendorRoutes);
app.use("/api/v1/assetPurchases", AssetPurchaseRoutes);

// Test Routes
app.use("/", TestRoutes);

// Basic routes
app.get("/", async (req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Welcome to PH Healthcare System Backend",
	});
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
