import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import zonesRouter from "./zones";
import ordersRouter from "./orders";
import favoritesRouter from "./favorites";
import settingsRouter from "./settings";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(zonesRouter);
router.use(ordersRouter);
router.use(favoritesRouter);
router.use(settingsRouter);
router.use(adminRouter);

export default router;
