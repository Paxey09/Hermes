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
    <section className="ep-section ep-home-support-section" id="support">
      <div className="ep-section-inner ep-home-support-inner">
        <div className="ep-home-support-copy">
          <p className="ep-section-eyebrow">Customer Support</p>
          <h2 className="ep-section-title">
            Ask anything <span className="ep-gold">without signing in</span>
          </h2>
          <p className="ep-section-sub">
            Visitors can type a question and get an instant chatbot reply about service details,
            pricing, booking shortcuts, and company information.
          </p>

          <div className="ep-home-support-topics">
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic.id}
                type="button"
                className="ep-home-topic-chip"
                onClick={() => handleQuickTopic(topic)}
                disabled={loading}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>

        <div className="ep-home-support-card">
          <div className="ep-home-support-card-head">
            <div>
              <h3>Customer Support</h3>
              <p>We typically reply in minutes</p>
            </div>
            <span className={`ep-home-support-status ${loading ? 'is-typing' : ''}`}>
              {loading ? 'Typing...' : 'Online'}
            </span>
          </div>

          <div className="ep-home-support-chat">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`ep-home-support-bubble ${message.role === 'user' ? 'user' : 'assistant'}`}
              >
                {message.text}
              </div>
            ))}

            {loading && (
              <div className="ep-home-support-bubble assistant ep-home-typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="ep-home-support-form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your question..."
            />
            <button type="submit" className="ep-home-support-send" disabled={!canSend}>
              Ask
            </button>
          </form>

          {error && <p className="ep-home-support-error">{error}</p>}
        </div>
      </div>
    </section>
  );
}

export default HomepageSupportWidget;