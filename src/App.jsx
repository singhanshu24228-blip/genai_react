import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Markdown from "react-markdown";

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("dark");
  const messagesEndRef = useRef(null);
  const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const autoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };
  const streamText = async (fullText, callback) => {
    let current = "";
    for (let ch of fullText) {
      current += ch;
      callback(current);
      await new Promise((res) => setTimeout(res, 15)); // speed
    }
  };
  const generate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);

    const prompt = input;
    setInput("");

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const aiId = Date.now() + 1;
      setMessages((prev) => [
        ...prev,
        { id: aiId, type: "ai", content: "" },
      ]);

      await streamText(text, (partial) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId ? { ...m, content: partial } : m
          )
        );
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const copyText = (text) => {
    navigator.clipboard.writeText(text);
  };
  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      generate();
    }
  };
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className={`app ${theme}`}>
      <aside className="sidebar">
        <h2>⚡ Gemini Chat</h2>

        <button className="new-chat" onClick={() => setMessages([])}>
          ➕ New Chat
        </button>

        <button className="theme-btn" onClick={toggleTheme}>
          {theme === "dark" ? "🌞 Light Mode" : "🌙 Dark Mode"}
        </button>

        <h3>History</h3>
        {messages.length === 0 ? (
          <p>No chats yet</p>
        ) : (
          <div className="history-item">Current Chat</div>
        )}
      </aside>
      <main className="chat">
        <div className="messages">
          {messages.length === 0 && (
            <div className="welcome">
              <h1>Welcome 👋</h1>
              <p>Ask me anything!</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`msg ${msg.type}`}>
              <div className="bubble">
                <Markdown>{msg.content}</Markdown>
                {msg.type === "ai" && (
                  <button
                    className="copy-btn"
                    onClick={() => copyText(msg.content)}
                  >
                    📋 Copy
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg ai">
              <div className="bubble typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

    
        <div className="input-box">
          <textarea
            placeholder="Message Gemini..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize(e);
            }}
            onKeyDown={handleKey}
          ></textarea>

          <button className="send" onClick={generate}>
            ➤
          </button>
        </div>
      </main>
    </div>
  );
}

