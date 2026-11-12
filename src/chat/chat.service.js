const crypto = require('node:crypto');
const {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} = require('@nestjs/common');
const userRepository = require('../auth/user-repository');
const connectionRepository = require('../connection-requests/connection-requests.repository');
const bookingRepository = require('../booking-requests/booking-requests.repository');
const chatRepository = require('./chat.repository');

class ChatService {
  constructor(
    chats = chatRepository,
    connections = connectionRepository,
    bookings = bookingRepository,
    users = userRepository,
    notifications,
    moderation,
  ) {
    this.chats = chats;
    this.connections = connections;
    this.bookings = bookings;
    this.users = users;
    this.notifications = notifications;
    this.moderation = moderation;
  }

  async getOrCreateConversation(userId, otherUserId) {
    this.validateId(userId, 'userId');
    this.validateId(otherUserId, 'otherUserId');
    if (userId === otherUserId) {
      throw new BadRequestException('You cannot start a conversation with yourself');
    }
    await this.requireUser(userId);
    await this.requireUser(otherUserId);
    await this.requireInteractionAllowed(userId, otherUserId);
    await this.requireMessagingAccess(userId, otherUserId);

    const existing = await this.chats.findBetween(userId, otherUserId);
    const conversation = existing || await this.chats.create({
      id: crypto.randomUUID(),
      participantIds: [userId, otherUserId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { conversation: await this.presentConversation(conversation, userId) };
  }

  async listConversations(userId) {
    this.validateId(userId, 'userId');
    const conversations = await this.chats.findForUser(userId);
    const availableConversations = this.moderation
      ? (await Promise.all(conversations.map(async (conversation) => ({
        conversation,
        allowed: !await this.moderation.isBlockedBetween(
          userId,
          conversation.participantIds.find((id) => id !== userId),
        ),
      })))).filter((item) => item.allowed).map((item) => item.conversation)
      : conversations;
    return {
      conversations: await Promise.all(
        availableConversations
          .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
          .map((conversation) => this.presentConversation(conversation, userId)),
      ),
    };
  }

  async sendMessage(userId, conversationId, body) {
    this.validateId(userId, 'userId');
    const conversation = await this.requireConversation(conversationId);
    this.requireParticipant(conversation, userId);
    await this.requireInteractionAllowed(
      userId,
      conversation.participantIds.find((id) => id !== userId),
    );
    const receiverId = conversation.participantIds.find((id) => id !== userId);
    const content = this.validateContent(body);
    const now = new Date().toISOString();
    const message = await this.chats.saveMessage({
      id: crypto.randomUUID(),
      conversationId,
      senderId: userId,
      receiverId,
      content,
      read: false,
      createdAt: now,
      updatedAt: now,
    });
    await this.chats.create({ ...conversation, updatedAt: now });
    await this.notifications?.create(receiverId, {
      title: 'New chat message',
      message: 'You received a new message.',
      type: 'chat-message-received',
      relatedUserId: userId,
    });
    return { message: this.presentMessage(message, userId) };
  }

  async messages(userId, conversationId) {
    const conversation = await this.requireConversation(conversationId);
    this.requireParticipant(conversation, userId);
    await this.requireInteractionAllowed(
      userId,
      conversation.participantIds.find((id) => id !== userId),
    );
    return {
      conversation: await this.presentConversation(conversation, userId),
      messages: (await this.chats.findMessages(conversationId))
        .map((message) => this.presentMessage(message, userId)),
    };
  }

  async markRead(userId, conversationId) {
    const conversation = await this.requireConversation(conversationId);
    this.requireParticipant(conversation, userId);
    const markedCount = await this.chats.markRead(conversationId, userId);
    return { markedCount, message: 'Messages marked as read' };
  }

  async requireMessagingAccess(firstUserId, secondUserId) {
    const connection = await this.connections.findBetween?.(firstUserId, secondUserId);
    if (connection?.status === 'accepted') return;
    const sent = await this.bookings.findSent(firstUserId);
    const received = await this.bookings.findReceived(firstUserId);
    const relevantBooking = [...sent, ...received].find(
      (request) =>
        request.status === 'pending' || request.status === 'accepted',
    );
    if (relevantBooking &&
        ((relevantBooking.senderId === firstUserId && relevantBooking.ownerId === secondUserId) ||
         (relevantBooking.senderId === secondUserId && relevantBooking.ownerId === firstUserId))) {
      return;
    }

    throw new ForbiddenException(
      'Messaging is available after an accepted connection or relevant booking request',
    );
  }

  async requireInteractionAllowed(firstUserId, secondUserId) {
    if (this.moderation && await this.moderation.isBlockedBetween(firstUserId, secondUserId)) {
      throw new ForbiddenException('You cannot interact with this user');
    }
  }

  async requireConversation(id) {
    this.validateId(id, 'conversationId');
    const conversation = await this.chats.findById(id);
    if (!conversation) throw new NotFoundException('Conversation was not found');
    return conversation;
  }

  requireParticipant(conversation, userId) {
    if (!conversation.participantIds.includes(userId)) {
      throw new ForbiddenException('You do not have access to this conversation');
    }
  }

  async requireUser(id) {
    if (!(await this.users.findById(id))) {
      throw new NotFoundException('User was not found');
    }
  }

  async presentConversation(conversation, userId) {
    const otherUserId = conversation.participantIds.find((id) => id !== userId);
    const otherUser = await this.users.findById(otherUserId);
    const messages = await this.chats.findMessages(conversation.id);
    return {
      id: conversation.id,
      otherUser: {
        id: otherUserId,
        fullName: otherUser?.fullName || 'Roommate',
      },
      lastMessage: messages.length ? this.presentMessage(messages[messages.length - 1], userId) : null,
      unreadCount: messages.filter(
        (message) => message.receiverId === userId && !message.read,
      ).length,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  presentMessage(message, userId) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      read: message.read,
      isMine: message.senderId === userId,
      createdAt: message.createdAt,
    };
  }

  validateContent(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        typeof body.content !== 'string' || !body.content.trim()) {
      throw new BadRequestException('Message content is required');
    }
    const content = body.content.trim();
    if (content.length > 2000) {
      throw new BadRequestException('Message content must be 2000 characters or fewer');
    }
    return content;
  }

  validateId(value, name) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${name} is required`);
    }
  }
}

Injectable()(ChatService);

module.exports = { ChatService };
