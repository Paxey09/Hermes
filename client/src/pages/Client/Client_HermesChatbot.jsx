import { useMemo, useState } from 'react';
import openClaudeService from '../../services/openClaude';

function Client_HermesChatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Hi! I am Hermes. I can help with CRM, ERP, appointment booking, data analytics & market research, and email marketing.'
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
    <div className="Client-dashboard" style={{ maxWidth: '980px', margin: '0 auto' }}>
      <h1>Client Hermes Chatbot</h1>
      <p>Chat with Hermes for client support and guidance.</p>

      <div
        style={{
          border: '1px solid #d8d8d8',
          borderRadius: '10px',
          padding: '12px',
          height: '400px',
          overflowY: 'auto',
          background: '#fff',
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
                background: msg.role === 'user' ? '#0f172a' : '#f3f4f6',
                color: msg.role === 'user' ? '#fff' : '#111827'
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && <div>Hermes is thinking...</div>}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your question..."
          style={{
            flex: 1,
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            padding: '10px 12px'
          }}
        />
        <button type="submit" disabled={!canSend}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>

      {error && (
        <p style={{ color: '#b91c1c', marginTop: '10px' }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default Client_HermesChatbot;
