import { useState, useRef, useEffect, useMemo } from 'react';
import openClaudeService from '../../services/openClaude';

function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Hi! I am Hermes. I can support you as a Sales Agent and Customer Service Representative (CSR), plus help with CRM, ERP, appointment booking, data analytics & market research, and email marketing.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const getAssistantText = (result) => {
    if (!result) return 'No response returned.';

    if (Array.isArray(result.content) && result.content.length > 0) {
      const textPart = result.content.find((part) => part?.type === 'text');
      if (textPart?.text) return textPart.text;
    }

    if (typeof result.message === 'string') return result.message;
    if (typeof result.text === 'string') return result.text;

    return 'Response received, but no text content was found.';
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!canSend) return;

    const userText = input.trim();
    const nextMessages = [
      ...messages,
      { id: Date.now(), role: 'user', text: userText },
    ];

    setMessages(nextMessages);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const result = await openClaudeService.chatCompletion(
        nextMessages.map((msg) => ({ role: msg.role, content: msg.text })),
        'claude-3-sonnet-20240229',
        { maxTokens: 500, temperature: 0.6 }
      );

      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: 'assistant', text: getAssistantText(result) },
      ]);
    } catch (sendError) {
      console.error('Chatbot error:', sendError);
      setError(sendError.message || 'Failed to get response.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="ep-chatbot-widget">
      {/* Toggle Button */}
      <button
        className={`ep-chatbot-toggle ${isOpen ? 'ep-chatbot-toggle--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span className="ep-chatbot-badge">AI</span>
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="ep-chatbot-window">
          {/* Header */}
          <div className="ep-chatbot-header">
            <div className="ep-chatbot-header-info">
              <div className="ep-chatbot-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div className="ep-chatbot-title">
                <h4>Hermes AI</h4>
                <span className="ep-chatbot-status">
                  <span className="ep-chatbot-status-dot"></span>
                  Online
                </span>
              </div>
            </div>
            <button
              className="ep-chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="ep-chatbot-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ep-chatbot-message ep-chatbot-message--${msg.role}`}
              >
                {msg.role === 'assistant' && (
                  <div className="ep-chatbot-message-avatar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                )}
                <div className="ep-chatbot-message-content">
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="ep-chatbot-message ep-chatbot-message--assistant">
                <div className="ep-chatbot-message-avatar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <div className="ep-chatbot-message-content ep-chatbot-message--typing">
                  <span className="ep-chatbot-typing-dot"></span>
                  <span className="ep-chatbot-typing-dot"></span>
                  <span className="ep-chatbot-typing-dot"></span>
                </div>
              </div>
            )}

            {error && (
              <div className="ep-chatbot-error">
                <p>{error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="ep-chatbot-input" onSubmit={handleSend}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!canSend}
              className={canSend ? 'ep-chatbot-send--active' : ''}
              aria-label="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ChatbotWidget;
