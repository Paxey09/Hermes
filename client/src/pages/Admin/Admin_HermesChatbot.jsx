import { useMemo, useState } from 'react';
import Admin_Layout from '../Components/Admin_Components/Admin_Layout.jsx';
import openClaudeService from '../../services/openClaude';
import '../../styles/Admin_styles/Admin_Style.css';

function Admin_HermesChatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Hello Admin. Ask me about CRM, ERP, analytics, or operations.'
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
      {
        id: Date.now(),
        role: 'user',
        text: userText
      }
    ];

    setMessages(nextMessages);
    setInput('');
    setError('');
    setLoading(true);

    try {
      const result = await openClaudeService.chatCompletion(
        nextMessages.map((msg) => ({ role: msg.role, content: msg.text })),
        'claude-3-sonnet-20240229',
        { maxTokens: 700, temperature: 0.6 }
      );

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: getAssistantText(result)
        }
      ]);
    } catch (sendError) {
      console.error('Chatbot error:', sendError);
      setError(sendError.message || 'Failed to get response.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Admin_Layout title="Hermes Chatbot">
      <div className="card" style={{ maxWidth: '980px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '8px' }}>Hermes Chatbot</h2>
        <p style={{ marginTop: 0, opacity: 0.8 }}>
          AI assistant for business operations and admin workflows.
        </p>

        <div
          style={{
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px',
            padding: '14px',
            height: '420px',
            overflowY: 'auto',
            background: 'rgba(0,0,0,0.15)',
            marginBottom: '12px'
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '10px'
              }}
            >
              <div
                style={{
                  maxWidth: '78%',
                  whiteSpace: 'pre-wrap',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: msg.role === 'user' ? '#c9a84c' : 'rgba(255,255,255,0.1)',
                  color: msg.role === 'user' ? '#111' : '#fff'
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ opacity: 0.8, fontSize: '14px' }}>Hermes is thinking...</div>
          )}
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask Hermes anything..."
            style={{
              flex: 1,
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff'
            }}
          />
          <button type="submit" disabled={!canSend} className="btn-primary">
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>

        {error && (
          <p style={{ color: '#ff8a80', marginTop: '10px', marginBottom: 0 }}>
            {error}
          </p>
        )}
      </div>
    </Admin_Layout>
  );
}

export default Admin_HermesChatbot;