import { useEffect, useMemo, useRef, useState } from 'react';
import openClaudeService from '../../services/openClaude';
import '../../styles/HomepageSupportWidget.css';

const QUICK_TOPICS = [
  {
    id: 'about-service',
    label: 'About Service',
    prompt: 'Tell me about your service and what you can help with.',
  },
  {
    id: 'pricing',
    label: 'Pricing',
    prompt: 'What are your pricing options or packages?',
  },
  {
    id: 'booking',
    label: 'Booking Shortcut',
    prompt: 'How can I book a demo or consultation quickly?',
  },
  {
    id: 'company',
    label: 'Company Details',
    prompt: 'Can you tell me more about your company details and background?',
  },
];

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'assistant',
    text: 'Hi! I can answer questions about our service, pricing, booking, and company details. Type your question below or tap a topic to start.',
  },
];

function HomepageSupportWidget() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

  const sendMessage = async (userText) => {
    const trimmed = userText.trim();
    if (!trimmed || loading) return;

    const nextMessages = [
      ...messages,
      { id: Date.now(), role: 'user', text: trimmed },
    ];

    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const result = await openClaudeService.chatCompletion(
        nextMessages.map((msg) => ({ role: msg.role, content: msg.text })),
        'llama-3.3-70b-versatile',
        {
          surface: 'homepage',
          channel: 'homepage',
          promptMode: 'lite',
          temperature: 0.35,
          maxTokens: 240,
          pageName: 'ExponifyPH',
          businessType: 'Digital services',
          productServices: 'About our service, pricing, booking shortcuts, and company details.',
          productServicePriceRanges: 'Custom quote depending on the package and project scope.',
          websiteLink: typeof window !== 'undefined' ? window.location.origin : '',
        }
      );

      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: 'assistant', text: getAssistantText(result) },
      ]);
    } catch (sendError) {
      console.error('Homepage support widget error:', sendError);
      setError(sendError.message || 'Failed to get response.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleQuickTopic = (topic) => {
    setError('');
    void sendMessage(topic.prompt);
  };

  return (
    <>
      {/* Floating Widget Button */}
      <button
        className="ep-floating-widget-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open support chat"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>

      {/* Floating Widget Panel */}
      <div className={`ep-floating-widget-container ${isOpen ? 'is-open' : ''}`}>
        <div className="ep-floating-widget-header">
          <div>
            <h3>Customer Support</h3>
            <p>We typically reply in minutes</p>
          </div>
          <button
            className="ep-floating-widget-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close support chat"
          >
            ✕
          </button>
        </div>

        <div className="ep-floating-widget-quick-topics">
          {QUICK_TOPICS.map((topic) => (
            <button
              key={topic.id}
              type="button"
              className="ep-floating-topic-chip"
              onClick={() => handleQuickTopic(topic)}
              disabled={loading}
            >
              {topic.label}
            </button>
          ))}
        </div>

        <div className="ep-floating-widget-chat">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`ep-floating-widget-bubble ${message.role === 'user' ? 'user' : 'assistant'}`}
            >
              {message.text}
            </div>
          ))}

          {loading && (
            <div className="ep-floating-widget-bubble assistant ep-floating-typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form className="ep-floating-widget-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type your question..."
          />
          <button type="submit" className="ep-floating-widget-send" disabled={!canSend}>
            Ask
          </button>
        </form>

        {error && <p className="ep-floating-widget-error">{error}</p>}
      </div>
    </>
  );
}

export default HomepageSupportWidget;