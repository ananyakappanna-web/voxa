let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // User registers their user ID to join their private notification & DM room
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // Real-time typing indicators
    socket.on('typing_start', ({ recipientId, senderUsername }) => {
      if (recipientId) {
        io.to(`user_${recipientId}`).emit('user_typing', { senderUsername });
      }
    });

    socket.on('typing_stop', ({ recipientId, senderUsername }) => {
      if (recipientId) {
        io.to(`user_${recipientId}`).emit('user_stopped_typing', { senderUsername });
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
}

function sendNotificationToUser(recipientId, notification) {
  if (ioInstance && recipientId) {
    ioInstance.to(`user_${recipientId}`).emit('new_notification', notification);
  }
}

function sendMessageToUser(recipientId, message) {
  if (ioInstance && recipientId) {
    ioInstance.to(`user_${recipientId}`).emit('new_message', message);
  }
}

module.exports = {
  initSocket,
  sendNotificationToUser,
  sendMessageToUser
};
