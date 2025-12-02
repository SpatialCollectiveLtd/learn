"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const StaffAuthController_1 = require("../controllers/StaffAuthController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/authenticate', StaffAuthController_1.StaffAuthController.authenticate);
router.get('/all', auth_1.authenticateAdmin, StaffAuthController_1.StaffAuthController.getAllStaff);
router.post('/register', auth_1.authenticateAdmin, StaffAuthController_1.StaffAuthController.registerStaff);
router.delete('/:staffId', auth_1.authenticateAdmin, StaffAuthController_1.StaffAuthController.deactivateStaff);
exports.default = router;
//# sourceMappingURL=staffAuth.js.map