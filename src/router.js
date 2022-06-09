const router = require("express").Router();
const controller = require("./controller")

router
    .route('/transactions')
    .post(controller.updateTransaction)
    .get(controller.listTransaction)

router
    .route('/spend')
    .post(controller.updateSpend)


router
  .route('/balances')
  .get(controller.list)

  
  module.exports = router;
