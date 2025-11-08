import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // for mobile
  const messagesEndRef = useRef(null);
  const user = "Ali";

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    const res = await fetch("http://127.0.0.1:8000/user_chats/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user }),
    });
    const data = await res.json();
    setChats(data.chats || []);
  };

  const startNewChat = async () => {
    const res = await fetch("http://127.0.0.1:8000/new_chat/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user }),
    });
    const data = await res.json();
    setCurrentChatId(data.chat_id);
    setMessages([]);
    fetchChats();
    if (window.innerWidth <= 768) setIsSidebarOpen(false); // hide sidebar on mobile
  };

  const openChat = async (chat) => {
    setCurrentChatId(chat.chat_id);
    const res = await fetch("http://127.0.0.1:8000/history/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat.chat_id }),
    });
    const data = await res.json();
    setMessages(data.history || []);
    if (window.innerWidth <= 768) setIsSidebarOpen(false); // hide sidebar on mobile
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentChatId) return;
    const msgText = input;
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: msgText }]);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: currentChatId, user, message: msgText }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "ai", text: data.ai_response }]);
      fetchChats();
    } catch {
      setMessages((prev) => [...prev, { sender: "ai", text: "⚠️ Server not responding" }]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-app d-flex">
      {isSidebarOpen && (
        <div className="sidebar bg-dark p-3">
          <h3 className="text-white text-center mb-4 fw-bold">Lyra</h3>
          <button onClick={startNewChat} className="btn btn-light w-100 mb-3">+ New Chat</button>
          <div className="chat-list">
            {chats.length > 0 ? (
              chats.map((chat, i) => (
                <div key={i} className="chat-item p-2 mb-2 text-light rounded"
                  onClick={() => openChat(chat)}
                  style={{ cursor: "pointer", backgroundColor: "#2d2d2d" }}>
                  💬 {chat.last || `Chat ${i + 1}`}
                </div>
              ))
            ) : (
              <p className="text-light small text-center">No chats yet</p>
            )}
          </div>
        </div>
      )}

      <div className="chat-window flex-grow-1 d-flex flex-column bg-light">
        {window.innerWidth <= 768 && (
          <button onClick={toggleSidebar} className="btn btn-secondary m-2">
            {isSidebarOpen ? "Close Chats" : "Open Chats"}
          </button>
        )}

        <div className="chat-body flex-grow-1 p-3 overflow-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`d-flex mb-2 ${msg.sender === "user" ? "justify-content-end" : "justify-content-start"}`}>
              <div className={`p-2 px-3 rounded-4 ${msg.sender === "user" ? "bg-primary text-white" : "bg-secondary text-white"}`}
                style={{ maxWidth: "70%" }}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>

        <div className="chat-input d-flex p-3 bg-white border-top">
          <textarea className="form-control me-2" rows="1" value={input}
            onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Type your message..." />
          <button className="btn btn-primary" onClick={sendMessage}>➤</button>
        </div>
      </div>
    </div>
  );
}

export default App;
