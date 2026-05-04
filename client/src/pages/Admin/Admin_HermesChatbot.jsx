import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient.js';
import Admin_Layout from '../Components/Admin_Components/Admin_Layout.jsx';
import '../../styles/Admin_styles/Admin_Style.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Admin_HermesChatbot() {
  const [activeTab, setActiveTab] = useState('chatbot');
  const [fbStatus, setFbStatus] = useState(null);
  const [fbLoading, setFbLoading] = useState(false);
  const [fbError, setFbError] = useState('');
  const [fbSuccess, setFbSuccess] = useState('');

  // FB Page form state
  const [fbForm, setFbForm] = useState({
    pageId: '',
    pageName: '',
    pageAccessToken: '',
    verifyToken: '',
    appSecret: '',
    accessMode: 'enable',
    businessType: '',
    productServices: '',
    productServicePriceRanges: '',
    websiteLink: '',
    shoppeLink: '',
    lazadaLink: '',
    tiktokLink: '',
  });

  // Chatbot test state
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      text: 'Hi! I am Hermes. I can support you as a Sales Agent and Customer Service Representative (CSR), plus help with CRM, ERP, appointment booking, data analytics & market research, and email marketing.'
    }
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchFbStatus();
  }, []);

  useEffect(() => {
    if (fbError || fbSuccess) {
      const timer = setTimeout(() => {
        setFbError('');
        setFbSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [fbError, fbSuccess]);

  const fetchFbStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/webhooks/facebook/admin/status`);
      if (response.ok) {
        const data = await response.json();
        setFbStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch FB status:', error);
    }
  };

  const handleFbConnect = async (e) => {
    e.preventDefault();
    setFbLoading(true);
    setFbError('');
    setFbSuccess('');

    try {
      const response = await fetch(`${API_URL}/webhooks/facebook/admin/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fbForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect Facebook page');
      }

      setFbStatus(data);
      setFbSuccess('Facebook page connected successfully!');
      setFbForm(prev => ({
        ...prev,
        pageAccessToken: '',
        verifyToken: '',
        appSecret: '',
      }));
    } catch (error) {
      setFbError(error.message);
    } finally {
      setFbLoading(false);
    }
  };

  const handleAccessModeChange = async (pageId, mode) => {
    setFbLoading(true);
    try {
      const response = await fetch(`${API_URL}/webhooks/facebook/admin/access-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId, accessMode: mode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update access mode');
      }

      setFbStatus(data);
      setFbSuccess(`Access mode updated to ${mode}`);
    } catch (error) {
      setFbError(error.message);
    } finally {
      setFbLoading(false);
    }
  };

  const handleTestChat = async (e) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const userText = input.trim();
    const nextMessages = [...messages, { id: Date.now(), role: 'user', text: userText }];
    setMessages(nextMessages);
    setInput('');
    setChatLoading(true);

    try {
      const response = await fetch(`${API_URL}/openclaude/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role, content: m.text })),
          model: 'claude-3-sonnet-20240229',
          options: { maxTokens: 500, temperature: 0.6 }
        }),
      });

      const data = await response.json();
      let replyText = 'No response';

      if (Array.isArray(data.content) && data.content.length > 0) {
        const textPart = data.content.find(p => p?.type === 'text');
        if (textPart?.text) replyText = textPart.text;
      } else if (typeof data.message === 'string') {
        replyText = data.message;
      } else if (typeof data.text === 'string') {
        replyText = data.text;
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: replyText }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: 'Error: ' + error.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  const renderChatbotTab = () => (
    <div className="admin-section">
      <div className="content-header">
        <h2>Test Hermes Chatbot</h2>
        <p>Test the AI chatbot responses before deploying.</p>
      </div>

      <div
        style={{
          border: '1px solid #1e2535',
          borderRadius: '12px',
          padding: '20px',
          height: '400px',
          overflowY: 'auto',
          background: '#0a0e1a',
          marginBottom: '16px',
          marginTop: '20px'
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
        {chatLoading && (
          <div style={{ color: '#c9a84c', padding: '12px' }}>Hermes is thinking...</div>
        )}
      </div>

      <form onSubmit={handleTestChat} style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
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
          disabled={!input.trim() || chatLoading}
          className="admin-btn-primary"
        >
          {chatLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );

  const renderFacebookTab = () => (
    <div className="admin-section">
      <div className="content-header">
        <h2>Facebook Page Integration</h2>
        <p>Connect your Facebook page to enable Messenger chatbot.</p>
      </div>

      {fbError && (
        <div className="admin-alert admin-alert-error" style={{ marginBottom: '16px' }}>
          {fbError}
        </div>
      )}

      {fbSuccess && (
        <div className="admin-alert admin-alert-success" style={{ marginBottom: '16px' }}>
          {fbSuccess}
        </div>
      )}

      {/* Status Card */}
      {fbStatus && (
        <div style={{
          background: '#1e2535',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid #2d3748'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#c9a84c', fontSize: '1.1rem' }}>
            Connection Status
          </h3>
          <div style={{ display: 'grid', gap: '12px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#9ca3af' }}>Connected:</span>
              <span style={{ color: fbStatus.connected ? '#10b981' : '#ef4444' }}>
                {fbStatus.connected ? 'Yes' : 'No'}
              </span>
            </div>
            {fbStatus.pageName && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Page Name:</span>
                <span style={{ color: '#f5f0e8' }}>{fbStatus.pageName}</span>
              </div>
            )}
            {fbStatus.pageId && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Page ID:</span>
                <span style={{ color: '#f5f0e8' }}>{fbStatus.pageId}</span>
              </div>
            )}
            {fbStatus.accessMode && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af' }}>Chatbot Mode:</span>
                <span style={{ color: fbStatus.accessMode === 'enable' ? '#10b981' : '#ef4444' }}>
                  {fbStatus.accessMode === 'enable' ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            )}
            {fbStatus.webhookUrl && (
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ color: '#9ca3af' }}>Webhook URL:</span>
                <code style={{ color: '#c9a84c', fontSize: '0.8rem', background: '#0a0e1a', padding: '4px 8px', borderRadius: '4px' }}>
                  {fbStatus.webhookUrl}
                </code>
              </div>
            )}
          </div>

          {/* Access Mode Toggle */}
          {fbStatus.connected && fbStatus.pageId && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #2d3748' }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#f5f0e8', fontSize: '0.95rem' }}>
                Quick Actions
              </h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleAccessModeChange(fbStatus.pageId, fbStatus.accessMode === 'enable' ? 'disable' : 'enable')}
                  disabled={fbLoading}
                  className="admin-btn-secondary"
                  style={{
                    background: fbStatus.accessMode === 'enable' ? '#ef4444' : '#10b981',
                    fontSize: '0.85rem',
                    padding: '8px 16px'
                  }}
                >
                  {fbStatus.accessMode === 'enable' ? 'Disable Chatbot' : 'Enable Chatbot'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connected Pages */}
      {fbStatus?.connectedPages && fbStatus.connectedPages.length > 0 && (
        <div style={{
          background: '#1e2535',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid #2d3748'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#c9a84c', fontSize: '1.1rem' }}>
            Connected Pages ({fbStatus.connectedCount})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {fbStatus.connectedPages.map((page, idx) => (
              <div key={idx} style={{
                background: '#0a0e1a',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #2d3748'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#f5f0e8', fontWeight: '500' }}>{page.pageName || 'Unnamed Page'}</span>
                  <span style={{
                    color: page.accessMode === 'enable' ? '#10b981' : '#ef4444',
                    fontSize: '0.8rem',
                    background: page.accessMode === 'enable' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    {page.accessMode === 'enable' ? 'Active' : 'Paused'}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                  ID: {page.pageId}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection Form */}
      <form onSubmit={handleFbConnect} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ margin: '0', color: '#c9a84c', fontSize: '1.1rem' }}>
          {fbStatus?.connected ? 'Add/Update Page' : 'Connect Facebook Page'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.9rem', marginBottom: '6px' }}>
              Page ID *
            </label>
            <input
              type="text"
              value={fbForm.pageId}
              onChange={(e) => setFbForm({ ...fbForm, pageId: e.target.value })}
              placeholder="123456789"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #2d3748',
                background: '#0a0e1a',
                color: '#f5f0e8',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.9rem', marginBottom: '6px' }}>
              Page Name
            </label>
            <input
              type="text"
              value={fbForm.pageName}
              onChange={(e) => setFbForm({ ...fbForm, pageName: e.target.value })}
              placeholder="Your Page Name"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #2d3748',
                background: '#0a0e1a',
                color: '#f5f0e8',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.9rem', marginBottom: '6px' }}>
              Page Access Token *
            </label>
            <input
              type="password"
              value={fbForm.pageAccessToken}
              onChange={(e) => setFbForm({ ...fbForm, pageAccessToken: e.target.value })}
              placeholder="EAA..."
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #2d3748',
                background: '#0a0e1a',
                color: '#f5f0e8',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.9rem', marginBottom: '6px' }}>
              Verify Token *
            </label>
            <input
              type="text"
              value={fbForm.verifyToken}
              onChange={(e) => setFbForm({ ...fbForm, verifyToken: e.target.value })}
              placeholder="your_verify_token"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #2d3748',
                background: '#0a0e1a',
                color: '#f5f0e8',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.9rem', marginBottom: '6px' }}>
              App Secret (optional)
            </label>
            <input
              type="password"
              value={fbForm.appSecret}
              onChange={(e) => setFbForm({ ...fbForm, appSecret: e.target.value })}
              placeholder="For webhook verification"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #2d3748',
                background: '#0a0e1a',
                color: '#f5f0e8',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.9rem', marginBottom: '6px' }}>
              Access Mode
            </label>
            <select
              value={fbForm.accessMode}
              onChange={(e) => setFbForm({ ...fbForm, accessMode: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #2d3748',
                background: '#0a0e1a',
                color: '#f5f0e8',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <option value="enable">Enabled</option>
              <option value="disable">Disabled</option>
            </select>
          </div>
        </div>

        <h4 style={{ margin: '8px 0 0 0', color: '#9ca3af', fontSize: '1rem' }}>
          Business Information (for AI context)
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.9rem', marginBottom: '6px' }}>
              Business Type
            </label>
            <input
              type="text"
              value={fbForm.businessType}
              onChange={(e) => setFbForm({ ...fbForm, businessType: e.target.value })}
              placeholder="e.g., Digital Marketing Agency"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #2d3748',
                background: '#0a0e1a',
                color: '#f5f0e8',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.9rem', marginBottom: '6px' }}>
              Website Link
            </label>
            <input
              type="url"
              value={fbForm.websiteLink}
              onChange={(e) => setFbForm({ ...fbForm, websiteLink: e.target.value })}
              placeholder="https://yourwebsite.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #2d3748',
                background: '#0a0e1a',
                color: '#f5f0e8',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.9rem', marginBottom: '6px' }}>
              Shopee Link
            </label>
            <input
              type="url"
              value={fbForm.shoppeLink}
              onChange={(e) => setFbForm({ ...fbForm, shoppeLink: e.target.value })}
              placeholder="https://shopee.ph/..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #2d3748',
                background: '#0a0e1a',
                color: '#f5f0e8',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.9rem', marginBottom: '6px' }}>
              Lazada Link
            </label>
            <input
              type="url"
              value={fbForm.lazadaLink}
              onChange={(e) => setFbForm({ ...fbForm, lazadaLink: e.target.value })}
              placeholder="https://lazada.com.ph/..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #2d3748',
                background: '#0a0e1a',
                color: '#f5f0e8',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.9rem', marginBottom: '6px' }}>
              TikTok Shop Link
            </label>
            <input
              type="url"
              value={fbForm.tiktokLink}
              onChange={(e) => setFbForm({ ...fbForm, tiktokLink: e.target.value })}
              placeholder="https://tiktok.com/..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #2d3748',
                background: '#0a0e1a',
                color: '#f5f0e8',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.9rem', marginBottom: '6px' }}>
            Product/Services Description
          </label>
          <textarea
            value={fbForm.productServices}
            onChange={(e) => setFbForm({ ...fbForm, productServices: e.target.value })}
            placeholder="Describe your products or services..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #2d3748',
              background: '#0a0e1a',
              color: '#f5f0e8',
              fontSize: '0.9rem',
              resize: 'vertical',
              minHeight: '80px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', color: '#9ca3af', fontSize: '0.9rem', marginBottom: '6px' }}>
            Price Ranges
          </label>
          <input
            type="text"
            value={fbForm.productServicePriceRanges}
            onChange={(e) => setFbForm({ ...fbForm, productServicePriceRanges: e.target.value })}
            placeholder="e.g., CRM: ₱5,000-₱15,000/month, ERP: ₱10,000-₱30,000/month"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #2d3748',
              background: '#0a0e1a',
              color: '#f5f0e8',
              fontSize: '0.9rem'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={fbLoading}
          className="admin-btn-primary"
          style={{ alignSelf: 'flex-start', marginTop: '8px' }}
        >
          {fbLoading ? 'Connecting...' : (fbStatus?.connected ? 'Update Connection' : 'Connect Facebook Page')}
        </button>
      </form>

      {/* Instructions */}
      <div style={{
        background: 'rgba(201, 168, 76, 0.1)',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '32px',
        border: '1px solid rgba(201, 168, 76, 0.2)'
      }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#c9a84c', fontSize: '1rem' }}>
          Setup Instructions
        </h4>
        <ol style={{ margin: '0', paddingLeft: '20px', color: '#9ca3af', fontSize: '0.9rem', lineHeight: '1.8' }}>
          <li>Create a Facebook App at <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: '#c9a84c' }}>developers.facebook.com</a></li>
          <li>Add Messenger product to your app</li>
          <li>Generate a Page Access Token from the Messenger settings</li>
          <li>Set your Verify Token (any random string you choose)</li>
          <li>Configure the webhook URL in Facebook: <code style={{ background: '#0a0e1a', padding: '2px 6px', borderRadius: '4px' }}>{fbStatus?.webhookUrl || `${API_URL}/webhooks/facebook`}</code></li>
          <li>Subscribe to <code style={{ background: '#0a0e1a', padding: '2px 6px', borderRadius: '4px' }}>messages</code> webhook event</li>
          <li>Add your business information above for better AI responses</li>
        </ol>
      </div>
    </div>
  );

  return (
    <Admin_Layout defaultModule="Hermes Chatbot">
      <div className="admin-content">
        <div className="content-header">
          <h1>Hermes Chatbot</h1>
          <p>Manage AI chatbot for homepage and Facebook Messenger.</p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid #1e2535',
          paddingBottom: '16px'
        }}>
          <button
            onClick={() => setActiveTab('chatbot')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'chatbot' ? '#c9a84c' : '#1e2535',
              color: activeTab === 'chatbot' ? '#0a0e1a' : '#9ca3af',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Test Chatbot
          </button>
          <button
            onClick={() => setActiveTab('facebook')}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'facebook' ? '#c9a84c' : '#1e2535',
              color: activeTab === 'facebook' ? '#0a0e1a' : '#9ca3af',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Facebook Integration
          </button>
        </div>

        {activeTab === 'chatbot' ? renderChatbotTab() : renderFacebookTab()}
      </div>
    </Admin_Layout>
  );
}

export default Admin_HermesChatbot;