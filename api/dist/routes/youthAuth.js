"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const YouthAuthController_1 = require("../controllers/YouthAuthController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/authenticate', YouthAuthController_1.YouthAuthController.authenticate);
router.get('/profile', auth_1.authenticateYouth, YouthAuthController_1.YouthAuthController.getProfile);
router.get('/verify', auth_1.authenticateYouth, YouthAuthController_1.YouthAuthController.verifyToken);
exports.default = router;
//# sourceMappingURL=youthAuth.js.map