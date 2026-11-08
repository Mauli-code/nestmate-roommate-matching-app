const path = require('node:path');
const { Injectable, UnauthorizedException } = require('@nestjs/common');
const userRepository = require('../auth/user-repository');
const profileRepository = require('../matching/profile-repository');
const favoriteRepository = require('../favorites/favorites.repository');
const connectionRepository = require('../connection-requests/connection-requests.repository');
const bookingRepository = require('../booking-requests/booking-requests.repository');
const notificationRepository = require('../notifications/notifications.repository');
const chatRepository = require('../chat/chat.repository');

class DashboardService {
  constructor(
    users = userRepository,
    profiles = profileRepository,
    favorites = favoriteRepository,
    connections = connectionRepository,
    bookings = bookingRepository,
    notifications = notificationRepository,
    chats = chatRepository,
  ) {
    this.users = users;
    this.profiles = profiles;
    this.favorites = favorites;
    this.connections = connections;
    this.bookings = bookings;
    this.notifications = notifications;
    this.chats = chats;
  }

  async get(userId) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('User account was not found');

    const profile = await this.profiles.findProfile(userId);
    const receivedConnections = await this.connections.findReceived(userId);
    const sentConnections = await this.connections.findSent(userId);
    const receivedBookings = await this.bookings.findReceived(userId);
    const sentBookings = await this.bookings.findSent(userId);
    const notifications = await this.notifications.findByRecipient(userId);
    const favorites = await this.favorites.findByUser(userId);
    const conversations = await this.chats.findForUser(userId);

    const recentMessages = [];
    for (const conversation of conversations) {
      const messages = await this.chats.findMessages(conversation.id);
      const latest = messages[messages.length - 1];
      if (latest) {
        recentMessages.push({
          id: latest.id,
          conversationId: latest.conversationId,
          senderId: latest.senderId,
          content: latest.content,
          createdAt: latest.createdAt,
          read: latest.read,
        });
      }
    }

    const pendingConnections = [...receivedConnections, ...sentConnections]
      .filter((request) => request.status === 'pending').length;
    const pendingBookings = [...receivedBookings, ...sentBookings]
      .filter((request) => request.status === 'pending').length;

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        photoUrl: user.photoPath
          ? `/uploads/profile-photos/${path.basename(user.photoPath)}`
          : null,
      },
      profile: {
        exists: Boolean(profile),
        completion: this.profileCompletion(user, profile),
      },
      counts: {
        matches: profile ? (await this.profiles.findCandidates(userId)).length : 0,
        favorites: favorites.length,
        pendingConnectionRequests: pendingConnections,
        pendingBookingRequests: pendingBookings,
        unreadNotifications: notifications.filter((item) => !item.read).length,
        conversations: conversations.length,
      },
      recentMessages: recentMessages
        .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
        .slice(0, 3),
      recentActivity: notifications.slice(0, 5).map((notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt,
        read: notification.read,
      })),
    };
  }

  profileCompletion(user, profile) {
    const checks = [
      Boolean(user.fullName),
      Boolean(user.photoPath),
      Boolean(profile),
      Boolean(profile?.preferredArea),
      Boolean(profile?.budget),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }
}

Injectable()(DashboardService);

module.exports = { DashboardService };
