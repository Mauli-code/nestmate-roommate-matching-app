const express = require('express');

class HealthController {
  getHealth() {
    return {
      status: 'ok',
      service: 'nestmate-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}

function createHealthRouter() {
  const router = express.Router();
  const controller = new HealthController();

  router.get('/', (req, res) => {
    res.json(controller.getHealth());
  });

  return router;
}

module.exports = { HealthController, createHealthRouter };
