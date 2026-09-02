import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [socket, setSocket] = useState(null);
  const [incomingMessage, setIncomingMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    const newSocket = io('/', {
      transports: ['websocket', 'polling']
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join', user.id);
    });

    // Real-time Notification Listener
    newSocket.on('new_notification', (notif) => {
      // Increment unread count in AuthContext
      updateUser({ unreadNotifications: (user.unreadNotifications || 0) + 1 });

      let title = 'New Notification';
      let message = '';
      if (notif.type === 'LIKE') {
        title = `@${notif.actor_username} liked your Vox`;
        message = notif.post_content || 'Liked your post';
      } else if (notif.type === 'REPOST') {
        title = `@${notif.actor_username} reposted your Vox`;
        message = notif.post_content || 'Reposted your post';
      } else if (notif.type === 'REPLY') {
        title = `@${notif.actor_username} replied to your Vox`;
        message = notif.post_content || 'Sent a reply';
      } else if (notif.type === 'FOLLOW') {
        title = `@${notif.actor_username} followed you`;
        message = 'Started following your updates';
      }

      showToast({
        title,
        message,
        type: notif.type,
        avatar: notif.actor_avatar_url,
        link: notif.post_id ? `/vox/${notif.post_id}` : `/profile/${notif.actor_username}`
      });
    });

    // Real-time Message Listener
    newSocket.on('new_message', (msg) => {
      setIncomingMessage(msg);
      updateUser({ unreadMessages: (user.unreadMessages || 0) + 1 });

      // If not currently on the active message route, show toast
      showToast({
        title: `Message from @${msg.sender?.username || 'User'}`,
        message: msg.content || 'Sent an attachment',
        type: 'message',
        avatar: msg.sender?.avatarUrl,
        link: `/messages?user=${msg.senderId}`
      });
    });

    // Typing indicators
    newSocket.on('user_typing', ({ senderUsername }) => {
      setTypingUsers((prev) => ({ ...prev, [senderUsername]: true }));
    });

    newSocket.on('user_stopped_typing', ({ senderUsername }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[senderUsername];
        return next;
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]);

  const sendTypingStart = (recipientId) => {
    if (socket && user && recipientId) {
      socket.emit('typing_start', { recipientId, senderUsername: user.username });
    }
  };

  const sendTypingStop = (recipientId) => {
    if (socket && user && recipientId) {
      socket.emit('typing_stop', { recipientId, senderUsername: user.username });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        incomingMessage,
        typingUsers,
        sendTypingStart,
        sendTypingStop
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
