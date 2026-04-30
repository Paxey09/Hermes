import { useEffect, useMemo, useRef, useState } from 'react';
import openClaudeService from '../../services/openClaude';
import '../../styles/HomepageSupportWidget.css';

const QUICK_TOPICS = [
  {
    id: 'about-service',
    label: 'What is Exponify?',
    prompt: 'Can you explain what Exponify is and what problems it solves for businesses?',
  },
  {
    id: 'features',
    label: 'Key Features',
    prompt: 'What are the main features and modules of Exponify? Tell me about Inbox, CRM, ERP, Analytics, Chatbot, and Social Ads.',
  },
  {
    id: 'benefits',
    label: 'Benefits',
    prompt: 'What are the key benefits of using Exponify for my business?',
  },
  {
    id: 'demo',
    label: 'Book Demo',
    prompt: 'How can I book a demo or get started with Exponify?',
  },
];

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'assistant',
    text: 'Hi! 👋 I\'m here to help you understand Exponify - your all-in-one business platform for managing inbox, customers, inventory, analytics, and AI-powered support across all channels. What would you like to know?',
  },
];

function HomepageSupportWidget() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isBookingMode, setIsBookingMode] = useState(false);
  const [bookingStep, setBookingStep] = useState(0);
  const [bookingData, setBookingData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    date: '',
    time: '',
    platform: 'Google Meet',
  });
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
        'claude-3-5-sonnet-20241022',
        {
          surface: 'homepage',
          channel: 'homepage',
          promptMode: 'full',
          temperature: 0.7,
          maxTokens: 1000,
          pageName: 'Exponify',
          businessType: 'All-in-one business solution',
          productServices: 'Exponify - unified platform with Inbox (unified messaging), CRM (customer management), ERP (inventory & stock), Analytics (data insights), AI Chatbot (24/7 auto-replies), and Social Ads (campaign optimization).',
          productServicePriceRanges: 'Custom enterprise quotes based on features and scale.',
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
    if (isBookingMode) {
      void handleBookingInput();
    } else {
      void sendMessage(input);
    }
  };

  const handleQuickTopic = (topic) => {
    setError('');
    if (topic.id === 'demo') {
      // Start booking tutorial mode
      setIsBookingMode(true);
      setBookingStep(0);
      setMessages([
        {
          id: Date.now(),
          role: 'assistant',
          text: "Great! I'll help you book a demo. Let me collect some information. What's your full name?",
        },
      ]);
    } else {
      void sendMessage(topic.prompt);
    }
  };

  const handleBookingInput = () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const steps = [
      { key: 'name', question: "What's your email address?" },
      { key: 'email', question: "What's your phone number?" },
      { key: 'phone', question: "What's your company name?" },
      { key: 'company', question: "What's your preferred date for the demo? (MM/DD/YYYY)" },
      { key: 'date', question: "What time works best for you?" },
      { key: 'time', question: "Which platform would you prefer? (Google Meet)" },
    ];

    if (bookingStep < steps.length) {
      const currentStep = steps[bookingStep];
      setBookingData((prev) => ({
        ...prev,
        [currentStep.key]: trimmed,
      }));

      const nextStep = bookingStep + 1;
      setInput('');

      if (nextStep < steps.length) {
        setMessages((current) => [
          ...current,
          { id: Date.now(), role: 'user', text: trimmed },
          { id: Date.now() + 1, role: 'assistant', text: steps[nextStep].question },
        ]);
        setBookingStep(nextStep);
      } else {
        // Booking complete
        const finalData = { ...bookingData, [currentStep.key]: trimmed };
        setBookingData(finalData);

        setMessages((current) => [
          ...current,
          { id: Date.now(), role: 'user', text: trimmed },
          {
            id: Date.now() + 1,
            role: 'assistant',
            text: `Perfect! 📅 I've collected your information:\n\n• Name: ${finalData.name}\n• Email: ${finalData.email}\n• Phone: ${finalData.phone}\n• Company: ${finalData.company}\n• Date: ${finalData.date}\n• Time: ${finalData.time}\n\nScroll down to the "Book a Demo" form and your info will be auto-filled. Click Submit to confirm your demo booking!`,
          },
        ]);

        // Auto-fill the form
        setTimeout(() => {
          const formInputs = {
            name: finalData.name,
            email: finalData.email,
            phone: finalData.phone,
            company: finalData.company,
            date: finalData.date,
            time: finalData.time,
            platform: finalData.platform,
          };

          window.dispatchEvent(
            new CustomEvent('autofillBookingForm', {
              detail: formInputs,
            })
          );

          // Scroll to form
          setTimeout(() => {
            const formSection = document.getElementById('booking');
            if (formSection) {
              formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 300);
        }, 100);

        setIsBookingMode(false);
      }
    }
  };

  return (
    <>
      {/* Floating Widget Button */}
      <button
        className="ep-floating-widget-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open support chat"
      >
        <div className="ep-floating-btn-logo" aria-hidden>
          <svg className="ep-robot-icon ep-robot-floating" width="40" height="40" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            {/* robot head (dark) */}
            <rect x="6" y="8" width="16" height="10" rx="3.2" fill="#0a0e1a" />
            {/* eyes (gold) */}
            <circle cx="10.5" cy="12" r="1.6" fill="#ffd974" />
            <circle cx="17.5" cy="12" r="1.6" fill="#ffd974" />
            {/* mouth/bar (gold) */}
            <rect x="11" y="15" width="6" height="1.8" rx="0.8" fill="#ffd974" />
            {/* antenna */}
            <line x1="14" y1="5" x2="14" y2="7.2" stroke="#0a0e1a" strokeWidth="1.3" strokeLinecap="round" />
            <circle cx="14" cy="4.2" r="1.2" fill="#0a0e1a" />
          </svg>
        </div>
      </button>

      {/* Floating Widget Panel */}
      <div className={`ep-floating-widget-container ${isOpen ? 'is-open' : ''}`}>
        <div className="ep-floating-widget-header">
          <div className="ep-header-left">
            <div className="ep-bot-avatar" aria-hidden>
              <svg className="ep-robot-icon ep-robot-avatar" width="44" height="44" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                {/* gold circle background */}
                <circle cx="14" cy="14" r="14" fill="#ffd974" />
                {/* robot head (dark) centered */}
                <rect x="6" y="8" width="16" height="10" rx="3.2" fill="#0a0e1a" />
                <circle cx="10.5" cy="12" r="1.6" fill="#ffd974" />
                <circle cx="17.5" cy="12" r="1.6" fill="#ffd974" />
                <rect x="11" y="15" width="6" height="1.8" rx="0.8" fill="#ffd974" />
                <line x1="14" y1="5" x2="14" y2="7.2" stroke="#0a0e1a" strokeWidth="1.3" strokeLinecap="round" />
                <circle cx="14" cy="4.2" r="1.2" fill="#0a0e1a" />
              </svg>
            </div>
            <div>
              <h3>Expony</h3>
              <p className="ep-status"><span className="ep-status-dot"/> Online · Typically replies instantly</p>
            </div>
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
          {QUICK_TOPICS.slice(0, 2).map((topic) => (
            <button
              key={topic.id}
              type="button"
              className="ep-floating-topic-chip"
              onClick={() => handleQuickTopic(topic)}
              disabled={loading}
            >
              <span className="chip-icon">💡</span>
              {topic.label}
            </button>
          ))}

          <div className="ep-quick-cta-row">
            <button
              type="button"
              className="ep-floating-topic-chip primary"
              onClick={() => handleQuickTopic(QUICK_TOPICS.find(t => t.id === 'demo'))}
            >
              📅 Book a free demo
            </button>

            <button
              type="button"
              className="ep-floating-topic-chip outline"
              onClick={() => handleQuickTopic(QUICK_TOPICS.find(t => t.id === 'features'))}
            >
              What does Expony do?
            </button>
          </div>
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
          {/* Dynamic input based on booking step */}
          {isBookingMode ? (
            <input
              type={bookingStep === 4 ? 'date' : bookingStep === 5 ? 'time' : 'text'}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                bookingStep === 4 ? 'Select a date (MM/DD/YYYY)' :
                bookingStep === 5 ? 'Select a time' :
                'Enter your information...'
              }
            />
          ) : (
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about features, pricing, demo..."
            />
          )}
          <button type="submit" className="ep-floating-widget-send" disabled={!canSend}>
            {isBookingMode ? 'Next' : 'Ask'}
          </button>
        </form>

        {error && <p className="ep-floating-widget-error">{error}</p>}
      </div>
    </>
  );
}

export default HomepageSupportWidget;