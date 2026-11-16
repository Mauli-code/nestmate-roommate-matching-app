const express = require('express');
const { createAuthMiddleware } = require('../auth/auth.guard');
const { ChatService } = require('./chat.service');

class ChatController {
  constructor(service = new ChatService()) {
    this.service = service;
  }

  async createConversation(otherUserId, request) {
    return this.service.getOrCreateConversation(request.user.sub, otherUserId);
  }

  async listConversations(request) {
    return this.service.listConversations(request.user.sub);
  }

  async sendMessage(conversationId, body, request) {
    return this.service.sendMessage(request.user.sub, conversationId, body);
  }

  async messages(conversationId, request) {
    return this.service.messages(request.user.sub, conversationId);
  }

  async markRead(conversationId, request) {
    return this.service.markRead(request.user.sub, conversationId);
  }
}

function createChatRouter(service = new ChatService(), authService) {
  const router = express.Router();
  const controller = new ChatController(service);
  const requireAuth = createAuthMiddleware(authService);

  router.use(requireAuth);

  router.post('/conversations/:otherUserId', async (req, res, next) => {
    try {
      const result = await controller.createConversation(req.params.otherUserId, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/conversations', async (req, res, next) => {
    try {
      const result = await controller.listConversations(req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/conversations/:conversationId/messages', async (req, res, next) => {
    try {
      const result = await controller.sendMessage(req.params.conversationId, req.body, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.get('/conversations/:conversationId/messages', async (req, res, next) => {
    try {
      const result = await controller.messages(req.params.conversationId, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  router.patch('/conversations/:conversationId/read', async (req, res, next) => {
    try {
      const result = await controller.markRead(req.params.conversationId, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { ChatController, createChatRouter };
