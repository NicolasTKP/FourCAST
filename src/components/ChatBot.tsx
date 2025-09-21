import React, { useState } from "react";
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

  // Your API endpoint - replace with your actual API URL
  const API_URL = process.env.REACT_APP_AI_AGENT_API || "";

  const sendMessage = async () => {
    const message = userInput.trim();
    if (!message || isLoading) return;

    // Add user message to display
    const newMessages: Message[] = [
      ...messages,
      { text: message, sender: "user" as const },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Add logging to debug the request
      const requestBody = {
        sessionId: sessionId,
        prompt: message,
      };

      console.log("Sending request:", requestBody);

      // Call backend API with the exact format from your curl example
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Note: If you need API key authentication in headers, add it here:
          // 'Authorization': 'Bearer YOUR_API_KEY',
          // 'x-api-key': 'YOUR_API_KEY'
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received response:", data);

      // Handle Lambda/API Gateway response format
      let parsedData = data;

      // If the response has a body field (Lambda/API Gateway format), parse it
      if (data.body && typeof data.body === "string") {
        try {
          parsedData = JSON.parse(data.body);
          console.log("Parsed response body:", parsedData);
        } catch (e) {
          console.error("Failed to parse response body:", e);
          parsedData = data;
        }
      }

      // Handle different possible response formats
      let botReply = "";
      if (parsedData.reply) {
        botReply = parsedData.reply;
      } else if (parsedData.response) {
        botReply = parsedData.response;
      } else if (parsedData.message) {
        botReply = parsedData.message;
      } else if (typeof parsedData === "string") {
        botReply = parsedData;
      } else {
        console.log("Received data structure:", data);
        console.log("Parsed data structure:", parsedData);
        botReply = "Received response but could not parse the message.";
      }

      // Log debug info if available
      if (parsedData.debug) {
        console.log("Debug info from Lambda:", parsedData.debug);
      }

      // Update session ID if returned by API
      const returnedSessionId = parsedData.sessionId || data.sessionId;
      if (returnedSessionId && returnedSessionId !== sessionId) {
        setSessionId(returnedSessionId);
      }

      // Add bot message to display
      setMessages([...newMessages, { text: botReply, sender: "bot" as const }]);

      // Update history
      setHistory([...history, { user: message, assistant: botReply }]);

      // Reset input
      setUserInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
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
