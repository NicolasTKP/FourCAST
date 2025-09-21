import React, { useState } from 'react';
import './Chatbot.css';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

interface HistoryItem {
  user: string;
  assistant: string;
}

const Chatbot = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = async () => {
    const message = userInput.trim();
    if (!message) return;

    // Add user message to display
    const newMessages: Message[] = [...messages, { text: message, sender: 'user' as const }];
    setMessages(newMessages);

    try {
      // Call backend API
      const response = await fetch('https://your-api-id.execute-api.us-east-1.amazonaws.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      });

      const data = await response.json();
      const botReply = data.response;

      // Add bot message to display
      setMessages([...newMessages, { text: botReply, sender: 'bot' as const }]);

      // Update history
      setHistory([...history, { user: message, assistant: botReply }]);

      // Reset input
      setUserInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      setMessages([...newMessages, { text: 'Sorry, something went wrong. Please try again.', sender: 'bot' as const }]);
      setUserInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="chatbot-container">
      <header className="chatbot-header">
        FourCAST AI Analytiker — Powered by Amazon Bedrock
      </header>

      <div className="chat-box">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.sender}`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <footer className="chatbot-footer">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="user-input"
        />
        <button onClick={sendMessage} className="send-button">
          Send
        </button>
      </footer>
    </div>
  );
};

export default Chatbot;