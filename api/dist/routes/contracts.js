"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ContractController_1 = require("../controllers/ContractController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/template', auth_1.authenticateYouth, ContractController_1.ContractController.getContractTemplate);
router.post('/sign', auth_1.authenticateYouth, ContractController_1.ContractController.signContract);
router.get('/signed', auth_1.authenticateYouth, ContractController_1.ContractController.getSignedContract);
router.get('/all', auth_1.authenticateAdmin, ContractController_1.ContractController.getAllSignedContracts);
router.get('/statistics', auth_1.authenticateAdmin, ContractController_1.ContractController.getStatistics);
exports.default = router;
//# sourceMappingURL=contracts.js.map