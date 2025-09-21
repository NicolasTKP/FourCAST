import React, { useEffect, useState } from "react";
import "./Chatbot.css";

interface Message {
  text: string;
  sender: "user" | "bot";
}

interface HistoryItem {
  user: string;
  assistant: string;
}

const Chatbot = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>("demo-1"); // Initialize session ID
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const DEFAULT_PROMPT =
    "According all the data, what is the top 5 actions I can perform to improve my store performance. Reply me in numbered list, each number in a new line. Starting with 'This is the five high value insights'.";

  // Your API endpoint - replace with your actual API URL
  const API_URL = process.env.REACT_APP_AI_AGENT_API || "";

  const sendMessage = async (
    customMessage?: string,
    showUser: boolean = true
  ) => {
    const message = (customMessage ?? userInput).trim();
    if (!message || isLoading) return;

    let newMessages: Message[] = [...messages];
    if (showUser) {
      newMessages = [
        ...newMessages,
        { text: message, sender: "user" as const },
      ];
      setMessages(newMessages);
    }

    setIsLoading(true);
    try {
      const requestBody = {
        sessionId: sessionId,
        prompt: message,
      };

      console.log("Sending request:", requestBody);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let parsedData = data;

      if (data.body && typeof data.body === "string") {
        try {
          parsedData = JSON.parse(data.body);
        } catch (e) {
          parsedData = data;
        }
      }

      let botReply = "";
      if (parsedData.reply) botReply = parsedData.reply;
      else if (parsedData.response) botReply = parsedData.response;
      else if (parsedData.message) botReply = parsedData.message;
      else if (typeof parsedData === "string") botReply = parsedData;
      else botReply = "Received response but could not parse the message.";

      const returnedSessionId = parsedData.sessionId || data.sessionId;
      if (returnedSessionId && returnedSessionId !== sessionId) {
        setSessionId(returnedSessionId);
      }

      // Always show the bot reply
      setMessages([...newMessages, { text: botReply, sender: "bot" as const }]);

      setHistory([...history, { user: message, assistant: botReply }]);
      setUserInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages([
        ...newMessages,
        {
          text: "Sorry, something went wrong. Please try again.",
          sender: "bot" as const,
        },
      ]);
      setUserInput("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setHistory([]);
    // Generate new session ID
    setSessionId(`demo-${Date.now()}`);
  };

  const changeSessionId = (newSessionId: string) => {
    setSessionId(newSessionId);
  };

  useEffect(() => {
    sendMessage(DEFAULT_PROMPT, false); // 👈 false = don’t render user msg
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="chatbot-container">
      <header className="chatbot-header">
        <div className="header-title">
          FourCAST AI Analytiker — Powered by Amazon Bedrock
        </div>
        <div className="header-controls">
          <div className="session-control">
            <label htmlFor="session-input">Session ID:</label>
            <input
              id="session-input"
              type="text"
              value={sessionId}
              onChange={(e) => changeSessionId(e.target.value)}
              className="session-input"
              placeholder="Enter session ID"
            />
          </div>
          <button
            onClick={clearChat}
            className="clear-button"
            disabled={isLoading}
          >
            Clear Chat
          </button>
        </div>
      </header>

      <div className="chat-box">
        {messages.length === 0 && (
          <div className="welcome-message">
            Welcome to FourCAST AI Analytiker! Start a conversation by typing
            your message below.
            <br />
            <small>Current Session: {sessionId}</small>
          </div>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            <div className="message-content">{message.text}</div>
            {message.sender === "user" && (
              <div className="message-meta">You</div>
            )}
            {message.sender === "bot" && (
              <div className="message-meta">AI Assistant</div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="message bot loading">
            <div className="message-content">
              <span className="typing-indicator">AI is thinking...</span>
            </div>
            <div className="message-meta">AI Assistant</div>
          </div>
        )}
      </div>

      <footer className="chatbot-footer">
        <div className="input-container">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              isLoading ? "AI is responding..." : "Type your message..."
            }
            className="user-input"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            className="send-button"
            disabled={isLoading || !userInput.trim()}
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
        <div className="footer-info">
          <small>
            Session: {sessionId} | Messages: {messages.length}
          </small>
        </div>
      </footer>
    </div>
  );
};

export default Chatbot;
