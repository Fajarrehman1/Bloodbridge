import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io }      from 'socket.io-client';
import './Chat.css';

const BACKEND = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:8000';
let socket    = null;

const Chat = () => {
  const { user }       = useAuth();
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const [inbox,      setInbox]      = useState([]);
  const [messages,   setMessages]   = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [text,       setText]       = useState('');
  const [typing,     setTyping]     = useState(false);
  const [online,     setOnline]     = useState([]);
  const [loading,    setLoading]    = useState(true);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const typingRef = useRef(null);

  const token = JSON.parse(
    localStorage.getItem('bloodbridge_user')
  )?.token;

  const apiFetch = async (url, opts = {}) => {
    const res = await fetch(`${BACKEND}/api${url}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${token}`,
        ...(opts.headers || {})
      }
    });
    return res.json();
  };

  // ── Socket Init ──────────────────────────────────────────
  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    socket = io(BACKEND, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      socket.emit('user_online', user._id);
    });

    socket.on('online_users', setOnline);

    socket.on('receive_message', (msg) => {
      setMessages(prev => {
        const dup = prev.some(m =>
          String(m._id) === String(msg._id) ||
          (m.content === msg.content &&
           Math.abs(new Date(m.createdAt) - new Date(msg.createdAt)) < 2000)
        );
        if (dup) return prev;
        return [...prev, msg];
      });
      // Refresh inbox to update preview
      loadInbox();
    });

    socket.on('user_typing',      () => setTyping(true));
    socket.on('user_stop_typing', () => setTyping(false));

    loadInbox();

    return () => { socket?.disconnect(); socket = null; };
  }, [user]);

useEffect(() => {
  const uid   = searchParams.get('userId');
  const uname = searchParams.get('name');
  const uphone= searchParams.get('phone');

  if (uid && uid !== 'undefined' && uid !== 'null') {
    const other = {
      _id:   uid,
      name:  uname  ? decodeURIComponent(uname)  : 'User',
      phone: uphone ? decodeURIComponent(uphone) : ''
    };
    // Open conversation AND refresh inbox
    openConvo(other);
    loadInbox();
  }
}, [searchParams]);

  // ── Scroll ───────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // ── Load Inbox ───────────────────────────────────────────
  const loadInbox = async () => {
    try {
      const data = await apiFetch('/chat/inbox');
      setInbox(Array.isArray(data) ? data : []);
    } catch (e) {
      setInbox([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Open Conversation ────────────────────────────────────
  const openConvo = async (other) => {
    if (!other?._id) return;
    setActiveUser(other);
    setMessages([]);
    setTyping(false);
    setText('');

    try {
      const data = await apiFetch(`/chat/${other._id}`);
      setMessages(Array.isArray(data) ? data : []);
      await apiFetch(`/chat/${other._id}/read`, { method: 'PUT' });
    } catch (e) {
      setMessages([]);
    }
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // ── Send ─────────────────────────────────────────────────
  const send = () => {
    const content = text.trim();
    if (!content || !activeUser || !socket) return;

    socket.emit('send_message', {
      senderId:   user._id,
      receiverId: activeUser._id,
      content
    });

    setMessages(prev => [...prev, {
      _id:       `l_${Date.now()}`,
      sender:    user._id,
      receiver:  activeUser._id,
      content,
      createdAt: new Date().toISOString()
    }]);

    socket.emit('stop_typing', {
      senderId: user._id, receiverId: activeUser._id
    });

    setText('');
    inputRef.current?.focus();
    setTimeout(loadInbox, 500);
  };

  const onType = (e) => {
    setText(e.target.value);
    if (socket && activeUser) {
      socket.emit('typing', { senderId: user._id, receiverId: activeUser._id });
      clearTimeout(typingRef.current);
      typingRef.current = setTimeout(() => {
        socket?.emit('stop_typing', { senderId: user._id, receiverId: activeUser._id });
      }, 1500);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ── Helpers ──────────────────────────────────────────────
  const getOther = (msg) => {
    const sid = msg.sender?._id || msg.sender;
    return String(sid) === String(user._id) ? msg.receiver : msg.sender;
  };

  const isMine = (msg) => {
    const sid = msg.sender?._id || msg.sender;
    return String(sid) === String(user._id);
  };

  const isOnline = (id) => online.includes(String(id));

  const ftime = (d) => !d ? '' : new Date(d).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit'
  });

  const fdate = (d) => {
    if (!d) return '';
    const dt   = new Date(d);
    const now  = new Date();
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    if (dt.toDateString() === now.toDateString())  return 'Today';
    if (dt.toDateString() === yest.toDateString()) return 'Yesterday';
    return dt.toLocaleDateString();
  };

  const grouped = () => {
    const out = []; let cur = null;
    messages.forEach((msg, i) => {
      const dl = fdate(msg.createdAt);
      if (dl !== cur) { out.push({ t: 'date', label: dl, k: `d${i}` }); cur = dl; }
      out.push({ t: 'msg', msg, k: msg._id || i });
    });
    return out;
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="fb-wrap">

      {/* ═══ SIDEBAR ═══ */}
      <div className="fb-side">

        {/* Header */}
        <div className="fb-side-hd">
          <button className="fb-back" onClick={() => navigate(-1)}>←</button>
          <div>
            <div className="fb-side-title">Chats</div>
            <div className="fb-online-ct">{online.length} online</div>
          </div>
        </div>

        {/* Search bar */}
        <div className="fb-search-wrap">
          <input
            className="fb-search"
            placeholder="🔍 Search conversations..."
            readOnly
          />
        </div>

        {/* Inbox list */}
        <div className="fb-inbox">
          {loading ? (
            <div className="fb-center">
              <div className="fb-spin"></div>
            </div>
          ) : inbox.length === 0 ? (
            <div className="fb-center">
              <div style={{ fontSize: 48 }}>💬</div>
              <p className="fb-empty-t">No conversations yet</p>
              <p className="fb-empty-s">
                Accept a blood request to start chatting
              </p>
            </div>
          ) : (
            inbox.map((msg, i) => {
              const other  = getOther(msg);
              if (!other) return null;
              const oid    = String(other?._id || other);
              const oname  = other?.name || 'User';
              const active = String(activeUser?._id) === oid;
              const preview= msg.content
                ? (isMine(msg) ? `You: ${msg.content}` : msg.content)
                : 'Tap to chat';

              return (
                <div
                  key={i}
                  className={`fb-convo ${active ? 'fb-convo-active' : ''}`}
                  onClick={() => openConvo(
                    typeof other === 'object'
                      ? other
                      : { _id: oid, name: 'User' }
                  )}
                >
                  {/* Test: manually open chat by user ID */}
{process.env.NODE_ENV === 'development' && (
  <div className="fb-test-box">
    <p className="fb-test-title">🧪 Start Chat (Dev)</p>
    <input
      id="test-uid"
      className="fb-test-input"
      placeholder="Paste User ID here..."
    />
    <input
      id="test-uname"
      className="fb-test-input"
      placeholder="Name..."
    />
    <button
      className="fb-test-btn"
      onClick={() => {
        const uid   = document.getElementById('test-uid').value.trim();
        const uname = document.getElementById('test-uname').value.trim();
        if (uid) {
          openConvo({ _id: uid, name: uname || 'User', phone: '' });
        }
      }}
    >
      Open Chat
    </button>
  </div>
)}
                  {/* Avatar */}
                  <div className="fb-av-wrap">
                    <div className="fb-av">{oname.charAt(0).toUpperCase()}</div>
                    {isOnline(oid) && <div className="fb-green"></div>}
                  </div>
                  {/* Info */}
                  <div className="fb-convo-info">
                    <div className="fb-convo-top">
                      <span className="fb-convo-name">{oname}</span>
                      <span className="fb-convo-ts">{ftime(msg.createdAt)}</span>
                    </div>
                    <div className="fb-convo-prev">{preview.substring(0, 40)}{preview.length > 40 ? '…' : ''}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div className="fb-main">
        {!activeUser ? (

          /* Placeholder */
          <div className="fb-placeholder">
            <div style={{ fontSize: 80 }}>💬</div>
            <h3>Your Messages</h3>
            <p>Send and receive messages with blood donors and receivers.</p>
            <p className="fb-ph-hint">
              Accept a blood request, then click "💬 Chat" to start a conversation.
            </p>
          </div>

        ) : (

          /* Active conversation */
          <div className="fb-conv">

            {/* Conv header */}
            <div className="fb-conv-hd">
              <button className="fb-conv-back" onClick={() => setActiveUser(null)}>←</button>
              <div className="fb-av-wrap">
                <div className="fb-av fb-av-md">{activeUser.name?.charAt(0)?.toUpperCase()}</div>
                {isOnline(activeUser._id) && <div className="fb-green"></div>}
              </div>
              <div className="fb-conv-info">
                <div className="fb-conv-name">{activeUser.name}</div>
                <div className={`fb-conv-status ${isOnline(activeUser._id) ? 'on' : 'off'}`}>
                  {isOnline(activeUser._id) ? 'Active now' : 'Offline'}
                </div>
              </div>
              <div className="fb-conv-actions">
                {activeUser.phone && (
                  <a href={`tel:${activeUser.phone}`} className="fb-action-btn" title="Call">
                    📞
                  </a>
                )}
                <button className="fb-action-btn" title="Info">ℹ️</button>
              </div>
            </div>

            {/* Messages */}
            <div className="fb-msgs">
              {messages.length === 0 ? (
                <div className="fb-msgs-empty">
                  <div className="fb-av fb-av-xl">{activeUser.name?.charAt(0)?.toUpperCase()}</div>
                  <p className="fb-msgs-name">{activeUser.name}</p>
                  <p className="fb-msgs-hint">
                    This is the beginning of your conversation about blood donation.
                  </p>
                  <p className="fb-msgs-sub">Say hello! 👋</p>
                </div>
              ) : (
                grouped().map(item => {
                  if (item.t === 'date') {
                    return (
                      <div key={item.k} className="fb-date-div">
                        <span>{item.label}</span>
                      </div>
                    );
                  }
                  const msg  = item.msg;
                  const mine = isMine(msg);
                  return (
                    <div key={item.k} className={`fb-msg-row ${mine ? 'fb-mine' : 'fb-theirs'}`}>
                      {!mine && (
                        <div className="fb-msg-av">
                          {activeUser.name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div className="fb-msg-col">
                        <div className={`fb-bubble ${mine ? 'fb-b-mine' : 'fb-b-theirs'}`}>
                          {msg.content}
                        </div>
                        <div className={`fb-ts ${mine ? 'fb-ts-mine' : 'fb-ts-theirs'}`}>
                          {ftime(msg.createdAt)}
                          {mine && <span className="fb-tick"> ✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {typing && (
                <div className="fb-msg-row fb-theirs">
                  <div className="fb-msg-av">
                    {activeUser.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="fb-bubble fb-b-theirs fb-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="fb-input-bar">
              <div className="fb-input-wrap">
                <input
                  ref={inputRef}
                  className="fb-input"
                  value={text}
                  onChange={onType}
                  onKeyDown={onKey}
                  placeholder="Aa"
                  autoFocus
                />
              </div>
              <button
                className={`fb-send ${text.trim() ? 'fb-send-on' : ''}`}
                onClick={send}
                disabled={!text.trim()}
              >
                ➤
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;