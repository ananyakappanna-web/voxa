import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Send,
  ArrowLeft,
  Search,
  Plus,
  BadgeCheck,
  X,
  Loader2
} from 'lucide-react';
import { formatDistanceToNowStrict, format } from 'date-fns';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';

export function Messages() {
  const { user: currentUser } = useAuth();
  const { incomingMessage, typingUsers, sendTypingStart, sendTypingStop } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeUserId = searchParams.get('user');

  const [conversations, setConversations] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function loadConversations() {
      try {
        const res = await api.messages.getConversations();
        if (isMounted) {
          setConversations(res.conversations || []);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        if (isMounted) setIsLoadingConvs(false);
      }
    }

    loadConversations();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeUserId) {
      setActiveChatUser(null);
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoadingMessages(true);

    async function loadChat() {
      try {
        const res = await api.messages.getHistory(activeUserId);
        if (isMounted) {
          setActiveChatUser(res.otherUser);
          setMessages(res.messages || []);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    }

    loadChat();
    return () => {
      isMounted = false;
    };
  }, [activeUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!incomingMessage) return;

    if (activeChatUser && incomingMessage.senderId === activeChatUser.id) {
      setMessages((prev) => [...prev, { ...incomingMessage, isMine: false }]);
      api.messages.markRead(activeChatUser.id).catch(() => {});
    }

    setConversations((prev) => {
      const existing = prev.find((c) => c.user.id === incomingMessage.senderId);
      if (existing) {
        return [
          {
            ...existing,
            lastMessage: incomingMessage.content,
            lastMessageTime: incomingMessage.createdAt,
            unreadCount: activeChatUser?.id === incomingMessage.senderId ? 0 : (existing.unreadCount || 0) + 1
          },
          ...prev.filter((c) => c.user.id !== incomingMessage.senderId)
        ];
      }
      return prev;
    });
  }, [incomingMessage]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!messageText.trim() && !imageUrl) || !activeUserId) return;

    const contentToSend = messageText.trim();
    const imageToSend = imageUrl.trim();

    setMessageText('');
    setImageUrl('');
    sendTypingStop(activeUserId);

    try {
      const res = await api.messages.send(parseInt(activeUserId, 10), contentToSend, imageToSend);
      setMessages((prev) => [...prev, res.data]);

      setConversations((prev) => {
        const updated = prev.filter((c) => c.user.id !== parseInt(activeUserId, 10));
        return [
          {
            user: activeChatUser,
            lastMessage: contentToSend || 'Sent an attachment',
            lastMessageTime: new Date().toISOString(),
            lastSenderId: currentUser.id,
            unreadCount: 0
          },
          ...updated
        ];
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    if (!activeUserId) return;

    sendTypingStart(activeUserId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop(activeUserId);
    }, 2000);
  };

  const handleUserSearch = async (q) => {
    setUserSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const res = await api.users.search(q.trim());
      setSearchResults(res.users.filter((u) => u.id !== currentUser?.id));
    } catch (err) {
      console.error('Search users error:', err);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const startChatWithUser = (targetUser) => {
    setShowNewChatModal(false);
    setUserSearchQuery('');
    setSearchResults([]);
    setSearchParams({ user: targetUser.id });
  };

  const isOtherUserTyping = activeChatUser && typingUsers[activeChatUser.username];

  return (
    <div className="w-full flex h-[calc(100vh-60px)] sm:h-screen overflow-hidden">
      {/* Left Pane: Conversations List */}
      <div
        className={`${
          activeUserId ? 'hidden md:flex' : 'flex'
        } flex-col w-full md:w-80 lg:w-96 border-r border-[#D4A574]/15 h-full bg-[#0D0709]/60 backdrop-blur-xl`}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#D4A574]/15 flex items-center justify-between sticky top-0 bg-[#0D0709]/95 backdrop-blur-md z-10">
          <h1 className="font-serif font-bold text-lg text-[#F5EDE8] tracking-wide">Messages</h1>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-2 rounded-full hover:bg-[#D4A574]/10 text-[#D4A574] transition"
            title="New message"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Conversations Stream */}
        <div className="overflow-y-auto flex-1 divide-y divide-[#D4A574]/10">
          {isLoadingConvs ? (
            <div className="p-8 text-center text-xs text-[#A8888D]">Loading dialogues...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-[#A8888D] space-y-3">
              <p className="font-serif text-sm font-bold text-[#F5EDE8]">Private Communication</p>
              <p className="text-xs">
                Direct messages are end-to-end synchronized dialogues on Voxa.
              </p>
              <Button size="sm" onClick={() => setShowNewChatModal(true)}>
                Start Dialogue
              </Button>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = activeUserId === String(conv.user.id);
              return (
                <div
                  key={conv.user.id}
                  onClick={() => setSearchParams({ user: conv.user.id })}
                  className={`p-3.5 flex items-center gap-3 hover:bg-[#D4A574]/5 transition cursor-pointer ${
                    isSelected ? 'bg-[#5C1A2B]/20 border-r-2 border-[#D4A574]' : ''
                  }`}
                >
                  <Avatar src={conv.user.avatarUrl} alt={conv.user.displayName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-sm text-[#F5EDE8] truncate flex items-center gap-1">
                        {conv.user.displayName}
                        {conv.user.isVerified && (
                          <BadgeCheck className="w-3.5 h-3.5 text-[#D4A574] fill-[#D4A574] shrink-0" />
                        )}
                      </span>
                      {conv.lastMessageTime && (
                        <span className="text-[10px] text-[#A8888D] font-mono">
                          {formatDistanceToNowStrict(new Date(conv.lastMessageTime), {
                            addSuffix: false
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-[#A8888D] truncate pr-2">
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-gradient-to-r from-[#D4A574] to-[#C97B8A] text-[#0D0709] text-[9px] font-black rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: Active Chat Conversation */}
      <div
        className={`${
          activeUserId ? 'flex' : 'hidden md:flex'
        } flex-col flex-1 h-full bg-[#0D0709]/80 relative backdrop-blur-xl`}
      >
        {activeChatUser ? (
          <>
            {/* Chat Top Header */}
            <div className="p-3.5 border-b border-[#D4A574]/15 flex items-center justify-between sticky top-0 bg-[#0D0709]/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSearchParams({})}
                  className="md:hidden p-1 text-[#A8888D] hover:text-[#F5EDE8]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div
                  onClick={() => navigate(`/profile/${activeChatUser.username}`)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Avatar
                    src={activeChatUser.avatarUrl}
                    alt={activeChatUser.displayName}
                    size="sm"
                  />
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#F5EDE8] flex items-center gap-1">
                      {activeChatUser.displayName}
                      {activeChatUser.isVerified && (
                        <BadgeCheck className="w-3.5 h-3.5 text-[#D4A574] fill-[#D4A574] inline-block" />
                      )}
                    </h3>
                    <p className="text-[11px] text-[#A8888D]">
                      {isOtherUserTyping ? (
                        <span className="text-[#D4A574] font-semibold animate-pulse">
                          Composing...
                        </span>
                      ) : (
                        `@${activeChatUser.username}`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {/* User Bio Header in Chat */}
              <div className="text-center py-6 border-b border-[#D4A574]/15 space-y-2 mb-4">
                <Avatar
                  src={activeChatUser.avatarUrl}
                  alt={activeChatUser.displayName}
                  size="xl"
                  className="mx-auto"
                />
                <h4 className="font-serif font-bold text-base text-[#F5EDE8]">{activeChatUser.displayName}</h4>
                <p className="text-xs text-[#A8888D]">@{activeChatUser.username}</p>
                {activeChatUser.bio && (
                  <p className="text-xs text-[#F5EDE8]/75 max-w-xs mx-auto leading-relaxed">{activeChatUser.bio}</p>
                )}
              </div>

              {isLoadingMessages ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#D4A574]" />
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-sm break-words shadow-sm ${
                        m.isMine
                          ? 'btn-metallic text-[#0D0709] rounded-br-none font-medium'
                          : 'bg-[#160B0F] text-[#F5EDE8] border border-[#D4A574]/20 rounded-bl-none'
                      }`}
                    >
                      {m.imageUrl && (
                        <img
                          src={m.imageUrl}
                          alt="Attachment"
                          className="max-h-60 rounded-xl mb-2 object-cover border border-[#D4A574]/20"
                        />
                      )}
                      <p>{m.content}</p>
                    </div>
                    <span className="text-[10px] text-[#A8888D] font-mono mt-1 px-1">
                      {format(new Date(m.createdAt), 'h:mm a')}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3.5 border-t border-[#D4A574]/15 bg-[#14080C]/90 flex items-center gap-2.5"
            >
              <input
                type="text"
                value={messageText}
                onChange={handleInputChange}
                placeholder="Compose a private message..."
                className="flex-1 bg-[#160B0F] text-[#F5EDE8] placeholder-[#A8888D] px-4 py-2.5 rounded-full border border-[#D4A574]/20 focus:border-[#D4A574] focus:outline-none text-sm"
              />
              <button
                type="submit"
                disabled={!messageText.trim() && !imageUrl}
                className="p-2.5 rounded-full btn-metallic disabled:opacity-40 transition shadow-md"
              >
                <Send className="w-4 h-4 text-[#0D0709]" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#A8888D] space-y-3">
            <h3 className="font-serif text-2xl font-bold text-[#F5EDE8]">Select a conversation</h3>
            <p className="text-xs max-w-xs leading-relaxed">
              Choose from your active dialogues or begin a new private communication.
            </p>
            <Button size="md" onClick={() => setShowNewChatModal(true)}>
              New Dialogue
            </Button>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0709]/85 backdrop-blur-xl">
          <div
            className="w-full max-w-md bg-[#14080C] border border-[#D4A574]/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#D4A574]/15 flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-[#F5EDE8]">New Dialogue</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-full text-[#A8888D] hover:text-[#F5EDE8]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 border-b border-[#D4A574]/15">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8888D]" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="Search members..."
                  autoFocus
                  className="w-full bg-[#160B0F] text-[#F5EDE8] placeholder-[#A8888D] pl-9 pr-4 py-2 rounded-full border border-[#D4A574]/20 focus:border-[#D4A574] focus:outline-none text-xs"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-[#D4A574]/10">
              {isSearchingUsers ? (
                <div className="p-4 text-center text-xs text-[#A8888D]">Searching members...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#A8888D]">
                  {userSearchQuery ? 'No members found' : 'Type a name or @username to search'}
                </div>
              ) : (
                searchResults.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => startChatWithUser(u)}
                    className="p-3.5 flex items-center gap-3 hover:bg-[#D4A574]/5 transition cursor-pointer"
                  >
                    <Avatar src={u.avatar_url} alt={u.display_name} size="md" />
                    <div className="min-w-0">
                      <p className="font-serif font-bold text-sm text-[#F5EDE8] truncate">{u.display_name}</p>
                      <p className="text-xs text-[#A8888D] truncate">@{u.username}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
