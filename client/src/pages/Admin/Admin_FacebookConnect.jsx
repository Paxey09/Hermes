import { useEffect, useState } from 'react';
import Admin_Layout from '../Components/Admin_Components/Admin_Layout.jsx';
import facebookIntegrationService from '../../services/facebookIntegration';
import '../../styles/Admin_styles/Admin_Style.css';

function Admin_FacebookConnect() {
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPageId, setUpdatingPageId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    pageName: '',
    businessType: '',
    generatedToken: '',
  });

  const connectedPages = Array.isArray(status?.connectedPages) ? status.connectedPages : [];

  const loadStatus = async () => {
    try {
      setLoadingStatus(true);
      setError('');
      const data = await facebookIntegrationService.getStatus();
      setStatus(data);
      setForm((current) => ({
        ...current,
        pageName: data.pageName || current.pageName,
        businessType: data.businessType || current.businessType,
      }));
    } catch (loadError) {
      setError(loadError.message || 'Failed to load Facebook integration status.');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const generateToken = () => {
    const token = facebookIntegrationService.createToken('fbpage');
    setForm((current) => ({ ...current, generatedToken: token }));
    setSuccess('Generated token created.');
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = await facebookIntegrationService.connectPage({
        pageName: form.pageName,
        businessType: form.businessType,
        pageAccessToken: form.generatedToken,
        verifyToken: status?.verifyToken || facebookIntegrationService.getStoredTestToken(status || {}),
        accessMode: status?.accessMode || 'enable',
      });
      setStatus(data);
      setSuccess('Facebook Page connection saved successfully.');
      setForm((current) => ({
        ...current,
        generatedToken: '',
      }));
    } catch (saveError) {
      setError(saveError.message || 'Failed to save Facebook Page connection.');
    } finally {
      setSaving(false);
    }
  };

  const webhookUrl = status?.webhookUrl || (typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/facebook` : '');
  const testToken = status?.verifyToken || facebookIntegrationService.getStoredTestToken(status || {});
  const generatedTokenValue = form.generatedToken || status?.pageAccessTokenMasked || '••••••••';

  const toReadableMode = (mode) => (String(mode || '').toLowerCase() === 'disable' ? 'Disable' : 'Enable');

  const toggleAccessMode = async (page) => {
    const pageId = page?.pageId;
    if (!pageId) {
      setError('Missing page id. Cannot update access mode.');
      return;
    }

    const currentMode = String(page?.accessMode || 'enable').toLowerCase() === 'disable' ? 'disable' : 'enable';
    const nextMode = currentMode === 'disable' ? 'enable' : 'disable';

    setUpdatingPageId(String(pageId));
    setError('');
    setSuccess('');

    try {
      const data = await facebookIntegrationService.updateAccessMode(pageId, nextMode);
      setStatus(data);
      setSuccess(`Access mode updated to ${toReadableMode(nextMode)} for ${page.pageName || `Page ${pageId}`}.`);
    } catch (modeError) {
      setError(modeError.message || 'Failed to update access mode.');
    } finally {
      setUpdatingPageId('');
    }
  };

  const copyToClipboard = async (value) => {
    if (!value || value === '••••••••') return;

    try {
      await navigator.clipboard.writeText(value);
      setSuccess('Copied to clipboard.');
    } catch {
      setError('Copy failed.');
    }
  };

  return (
    <Admin_Layout title="Connect Facebook Page">
      <div className="fb-connect-page">
        <div className="fb-connect-header">
          <h2>Facebook Page Integration</h2>
          <p>Use your webhook URL and test token here, then add a page with only its name and generated token.</p>
        </div>

        <div className="fb-connect-status-card">
          <div className="fb-status-row">
            <span className="fb-status-label">Connection Status</span>
            <span className={`fb-status-badge ${status?.connected ? 'connected' : 'disconnected'}`}>
              {status?.connected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
          <div className="fb-status-grid">
            <div>
              <strong>Webhook URL:</strong> {webhookUrl || '-'}
            </div>
            <div>
              <strong>Test Token:</strong> {testToken}
            </div>
            <div>
              <strong>Page Name:</strong> {status?.pageName || 'Not set'}
            </div>
            <div>
              <strong>Business Type:</strong> {status?.businessType || 'Not set'}
            </div>
            <div>
              <strong>Tokens:</strong> {status?.hasPageAccessToken ? 'Configured' : 'Missing'} / {status?.hasVerifyToken ? 'Test token set' : 'Test token missing'}
            </div>
            <div>
              <strong>Access Mode:</strong> {toReadableMode(status?.accessMode)}
            </div>
          </div>
          {status?.note && <p className="fb-status-note">{status.note}</p>}
          <div className="fb-connect-actions">
            <button className="fb-btn-secondary" type="button" onClick={loadStatus} disabled={loadingStatus}>
              {loadingStatus ? 'Checking...' : 'Refresh Status'}
            </button>
            <button className="fb-btn-secondary" type="button" onClick={() => copyToClipboard(webhookUrl)}>
              Copy Webhook URL
            </button>
            <button className="fb-btn-secondary" type="button" onClick={() => copyToClipboard(testToken)}>
              Copy Test Token
            </button>
          </div>
        </div>

        <div className="fb-connected-pages-card">
          <div className="fb-connected-header">
            <div>
              <h3>Connected Pages</h3>
              <p>Show all Facebook Pages linked to Hermes.</p>
            </div>
            <span className={`fb-status-badge ${status?.connected ? 'connected' : 'disconnected'}`}>
              {status?.connected ? `${status?.connectedCount || connectedPages.length || 0} Connected` : 'No Pages Connected'}
            </span>
          </div>

          {connectedPages.length > 0 ? (
            <div className="fb-connected-list">
              {connectedPages.map((page, index) => (
                <div className="fb-page-row" key={`${page.pageId || page.pageName || 'page'}-${index}`}>
                  <div className="fb-page-avatar">{(page.pageName || 'H').charAt(0).toUpperCase()}</div>
                  <div className="fb-page-main">
                    <div className="fb-page-name">{page.pageName || 'Connected Facebook Page'}</div>
                    <div className="fb-page-id">{page.pageId ? `Page ID: ${page.pageId}` : webhookUrl}</div>
                    <div className="fb-page-id">{page.businessType ? `Business Type: ${page.businessType}` : 'Business Type: Not set'}</div>
                  </div>
                  <div className="fb-page-subscription">
                    <span className="fb-page-column-label">Webhook Subscription</span>
                    <span>{status?.subscription || 'messages and messaging_postbacks'}</span>
                  </div>
                  <div className="fb-page-token">
                    <span className="fb-page-column-label">Stored Token</span>
                    <div className="fb-token-actions">
                      <span className="fb-token-value">{page.pageAccessTokenMasked || '••••••••'}</span>
                    </div>
                  </div>
                  <div className="fb-page-access">
                    <span className="fb-page-column-label">Access Mode</span>
                    <div className="fb-token-actions">
                      <span className={`fb-status-badge ${String(page.accessMode || '').toLowerCase() === 'disable' ? 'disconnected' : 'connected'}`}>
                        {toReadableMode(page.accessMode)}
                      </span>
                      <button
                        type="button"
                        className="fb-btn-secondary"
                        onClick={() => toggleAccessMode(page)}
                        disabled={updatingPageId === String(page.pageId)}
                      >
                        {updatingPageId === String(page.pageId)
                          ? 'Updating...'
                          : String(page.accessMode || '').toLowerCase() === 'disable'
                          ? 'Enable Access'
                          : 'Disable Access'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="fb-empty-state">
              <p>No Facebook Page is connected yet.</p>
              <span>Connect one below to see it listed here.</span>
            </div>
          )}
        </div>

        <form className="fb-connect-form" onSubmit={onSubmit}>
          <div className="fb-form-grid">
            <label>
              <span>Facebook Page Name</span>
              <input
                type="text"
                name="pageName"
                value={form.pageName}
                onChange={onChange}
                placeholder="Hermes Official"
                required
              />
            </label>

            <label>
              <span>Business Type</span>
              <input
                type="text"
                name="businessType"
                value={form.businessType}
                onChange={onChange}
                placeholder="Solar Energy, Retail, Real Estate"
                required
              />
            </label>

            <label>
              <span>Generated Token</span>
              <input
                type="password"
                name="generatedToken"
                value={form.generatedToken}
                onChange={onChange}
                placeholder="Token from Meta page"
                required
              />
            </label>
          </div>

          <div className="fb-connect-actions">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Connecting...' : 'Add Facebook Page'}
            </button>
          </div>
        </form>

        <div className="fb-helper-panel">
          <div className="fb-helper-item">
            <span className="fb-page-column-label">Webhook URL</span>
            <div className="fb-helper-row">
              <span>{webhookUrl}</span>
              <button type="button" className="fb-token-btn" onClick={() => copyToClipboard(webhookUrl)}>
                Copy
              </button>
            </div>
          </div>
          <div className="fb-helper-item">
            <span className="fb-page-column-label">Test Token</span>
            <div className="fb-helper-row">
              <span>{testToken}</span>
              <button type="button" className="fb-token-btn" onClick={() => copyToClipboard(testToken)}>
                Copy
              </button>
            </div>
          </div>
        </div>

        {error && <p className="fb-feedback error">{error}</p>}
        {success && <p className="fb-feedback success">{success}</p>}
      </div>
    </Admin_Layout>
  );
}

export default Admin_FacebookConnect;
