import { useMemo, useState } from 'react';
import Client_Layout from '../../Components/Client_Components/Client_Layout.jsx';
import openClaudeService from '../../../services/openClaude';
import '../../../styles/Admin_styles/Admin_Style.css';

function Client_HermesChatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Hi! I am Hermes. I can support you as a Sales Agent and Customer Service Representative (CSR), plus help with CRM, ERP, appointment booking, data analytics & market research, and email marketing.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

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
      { id: Date.now(), role: 'user', text: userText }
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
        { id: Date.now() + 1, role: 'assistant', text: getAssistantText(result) }
      ]);
    } catch (sendError) {
      console.error('Client chatbot error:', sendError);
      setError(sendError.message || 'Failed to get response.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Client_Layout title="Hermes Chatbot">
      <div className="admin-content">
        <div className="content-header">
          <h1>Client Hermes Chatbot</h1>
          <p>Chat with Hermes for client support and guidance.</p>
        </div>

        <div className="content-body">
          <div
            style={{
              border: '1px solid #1e2535',
              borderRadius: '12px',
              padding: '20px',
              height: '450px',
              overflowY: 'auto',
              background: '#0a0e1a',
              marginBottom: '16px'
            }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '12px'
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    whiteSpace: 'pre-wrap',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: msg.role === 'user' ? '#c9a84c' : '#1e2535',
                    color: msg.role === 'user' ? '#0a0e1a' : '#f5f0e8',
                    fontSize: '0.95rem',
                    lineHeight: '1.5'
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ color: '#c9a84c', padding: '12px 0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="typing-indicator">●</span>
                  <span className="typing-indicator" style={{ animationDelay: '0.2s' }}>●</span>
                  <span className="typing-indicator" style={{ animationDelay: '0.4s' }}>●</span>
                  <span>Hermes is thinking...</span>
                </span>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your question..."
              style={{
                flex: 1,
                borderRadius: '8px',
                border: '1px solid #1e2535',
                padding: '12px 16px',
                background: '#0a0e1a',
                color: '#f5f0e8',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={!canSend}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: !canSend ? '#1e2535' : '#c9a84c',
                color: !canSend ? '#6b7280' : '#0a0e1a',
                fontWeight: '500',
                cursor: !canSend ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>

          {error && (
            <p style={{ color: '#ef4444', marginTop: '12px', fontSize: '0.9rem' }}>
              {error}
            </p>
          )}
        </div>
      </div>

      <style>{`
        .typing-indicator {
          animation: typing-bounce 1.4s ease-in-out infinite;
        }
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </Client_Layout>
  );
}

export default Client_HermesChatbot;
