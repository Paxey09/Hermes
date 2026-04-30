import { useEffect, useState } from 'react';
import Admin_Layout from '../Components/Admin_Components/Admin_Layout.jsx';
import facebookIntegrationService from '../../services/facebookIntegration';
import '../../styles/Admin_styles/Admin_Style.css';

const PRICE_RANGE_OPTIONS = [
  '',
  'None',
  'Below ₱500',
  '₱500 - ₱1,999',
  '₱2,000 - ₱4,999',
  '₱5,000 - ₱9,999',
  '₱10,000 and above',
  'Custom / Varies',
];

function Admin_FacebookConnect() {
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [updatingPageId, setUpdatingPageId] = useState('');
  const [editingPageId, setEditingPageId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    pageId: '',
    pageName: '',
    businessType: '',
    productServices: '',
    productServicePriceRanges: '',
    websiteLink: '',
    shoppeLink: '',
    lazadaLink: '',
    tiktokLink: '',
    generatedToken: '',
  });

  const [editForm, setEditForm] = useState({
    pageName: '',
    businessType: '',
    productServices: '',
    productServicePriceRanges: '',
    websiteLink: '',
    shoppeLink: '',
    lazadaLink: '',
    tiktokLink: '',
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
        pageId: data.pageId || current.pageId,
        pageName: data.pageName || current.pageName,
        businessType: data.businessType || current.businessType,
        productServices: data.productServices || current.productServices,
        productServicePriceRanges: data.productServicePriceRanges || current.productServicePriceRanges,
        websiteLink: data.websiteLink || current.websiteLink,
        shoppeLink: data.shoppeLink || current.shoppeLink,
        lazadaLink: data.lazadaLink || current.lazadaLink,
        tiktokLink: data.tiktokLink || current.tiktokLink,
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

  const onEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((current) => ({ ...current, [name]: value }));
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
        pageId: form.pageId,
        pageName: form.pageName,
        businessType: form.businessType,
        productServices: form.productServices,
        productServicePriceRanges: form.productServicePriceRanges,
        websiteLink: form.websiteLink,
        shoppeLink: form.shoppeLink,
        lazadaLink: form.lazadaLink,
        tiktokLink: form.tiktokLink,
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

  const toReadableMode = (mode) => (String(mode || '').toLowerCase() === 'disable' ? 'Disable' : 'Enable');
  const displayValue = (value, fallback = 'Not set') => (value ? value : fallback);

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

  const openEditDetails = (page) => {
    const pageId = page?.pageId ? String(page.pageId) : '';
    if (!pageId) {
      setError('Missing page id. Cannot edit details.');
      return;
    }

    setEditingPageId(pageId);
    setEditForm({
      pageName: page?.pageName || '',
      businessType: page?.businessType || '',
      productServices: page?.productServices || '',
      productServicePriceRanges: page?.productServicePriceRanges || '',
      websiteLink: page?.websiteLink || '',
      shoppeLink: page?.shoppeLink || '',
      lazadaLink: page?.lazadaLink || '',
      tiktokLink: page?.tiktokLink || '',
    });
    setError('');
    setSuccess('');
  };

  const cancelEditDetails = () => {
    setEditingPageId('');
    setEditForm({
      pageName: '',
      businessType: '',
      productServices: '',
      productServicePriceRanges: '',
      websiteLink: '',
      shoppeLink: '',
      lazadaLink: '',
      tiktokLink: '',
    });
  };

  const saveEditDetails = async (event) => {
    event.preventDefault();
    if (!editingPageId) {
      setError('Missing page id. Cannot save changes.');
      return;
    }

    setSavingEdit(true);
    setError('');
    setSuccess('');

    try {
      const data = await facebookIntegrationService.updatePageDetails(editingPageId, {
        pageName: editForm.pageName,
        businessType: editForm.businessType,
        productServices: editForm.productServices,
        productServicePriceRanges: editForm.productServicePriceRanges,
        websiteLink: editForm.websiteLink,
        shoppeLink: editForm.shoppeLink,
        lazadaLink: editForm.lazadaLink,
        tiktokLink: editForm.tiktokLink,
      });

      setStatus(data);
      setSuccess(`Updated details for page ${editingPageId}.`);
      cancelEditDetails();
    } catch (saveError) {
      setError(saveError.message || 'Failed to update page details.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <Admin_Layout title="Connect Facebook Page">
      <div className="fb-connect-page">
        <div className="fb-connect-header">
          <h2>Facebook Page Integration</h2>
          <p>Use your webhook URL and test token here, then add each page with its Page ID, name, business type, and generated token.</p>
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
                  <div className="fb-page-top">
                    <div className="fb-page-avatar">{(page.pageName || 'H').charAt(0).toUpperCase()}</div>
                    <div className="fb-page-main">
                      <div className="fb-page-name">{page.pageName || 'Connected Facebook Page'}</div>
                      <div className="fb-page-id">{page.pageId ? `Page ID: ${page.pageId}` : webhookUrl}</div>
                    </div>
                    <div className="fb-page-access-actions">
                      <span className={`fb-status-badge ${String(page.accessMode || '').toLowerCase() === 'disable' ? 'disconnected' : 'connected'}`}>
                        {toReadableMode(page.accessMode)}
                      </span>
                      <button
                        type="button"
                        className="fb-btn-secondary"
                        onClick={() => openEditDetails(page)}
                        disabled={savingEdit}
                      >
                        {editingPageId === String(page.pageId) ? 'Editing...' : 'Edit Details'}
                      </button>
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

                  <div className="fb-page-details-grid">
                    <div className="fb-page-detail-item">
                      <span className="fb-page-column-label">Business Type</span>
                      <span>{displayValue(page.businessType)}</span>
                    </div>
                    <div className="fb-page-detail-item">
                      <span className="fb-page-column-label">Product/Services</span>
                      <span>{displayValue(page.productServices)}</span>
                    </div>
                    <div className="fb-page-detail-item">
                      <span className="fb-page-column-label">Price Range</span>
                      <span>{displayValue(page.productServicePriceRanges)}</span>
                    </div>
                    <div className="fb-page-detail-item">
                      <span className="fb-page-column-label">Website</span>
                      <span>{displayValue(page.websiteLink)}</span>
                    </div>
                    <div className="fb-page-detail-item">
                      <span className="fb-page-column-label">Shopee</span>
                      <span>{displayValue(page.shoppeLink)}</span>
                    </div>
                    <div className="fb-page-detail-item">
                      <span className="fb-page-column-label">Lazada</span>
                      <span>{displayValue(page.lazadaLink)}</span>
                    </div>
                    <div className="fb-page-detail-item">
                      <span className="fb-page-column-label">TikTok Shop</span>
                      <span>{displayValue(page.tiktokLink)}</span>
                    </div>
                    <div className="fb-page-detail-item">
                      <span className="fb-page-column-label">Webhook Subscription</span>
                      <span>{status?.subscription || 'messages and messaging_postbacks'}</span>
                    </div>
                    <div className="fb-page-detail-item">
                      <span className="fb-page-column-label">Stored Token</span>
                      <span className="fb-token-value">{page.pageAccessTokenMasked || '••••••••'}</span>
                    </div>
                  </div>

                  {editingPageId === String(page.pageId) && (
                    <form className="fb-inline-edit-form" onSubmit={saveEditDetails}>
                      <div className="fb-inline-edit-header">
                        <h4>Edit Page Details</h4>
                        <p>Update business info and links for Page ID: {editingPageId}</p>
                      </div>

                      <div className="fb-form-grid">
                        <label>
                          <span>Facebook Page Name</span>
                          <input
                            type="text"
                            name="pageName"
                            value={editForm.pageName}
                            onChange={onEditChange}
                            placeholder="Hermes Official"
                          />
                        </label>

                        <label>
                          <span>Business Type</span>
                          <input
                            type="text"
                            name="businessType"
                            value={editForm.businessType}
                            onChange={onEditChange}
                            placeholder="Solar Energy, Retail, Real Estate"
                          />
                        </label>

                        <label>
                          <span>Product/Services</span>
                          <input
                            type="text"
                            name="productServices"
                            value={editForm.productServices}
                            onChange={onEditChange}
                            placeholder="Solar Panel, Installation, Maintenance"
                          />
                        </label>

                        <label>
                          <span>Price Range</span>
                          <select
                            name="productServicePriceRanges"
                            value={editForm.productServicePriceRanges}
                            onChange={onEditChange}
                          >
                            {PRICE_RANGE_OPTIONS.map((option) => (
                              <option key={option || 'none'} value={option}>
                                {option || 'Select price range'}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          <span>Website Link</span>
                          <input
                            type="url"
                            name="websiteLink"
                            value={editForm.websiteLink}
                            onChange={onEditChange}
                            placeholder="https://yourwebsite.com"
                          />
                        </label>

                        <label>
                          <span>Shopee Link</span>
                          <input
                            type="url"
                            name="shoppeLink"
                            value={editForm.shoppeLink}
                            onChange={onEditChange}
                            placeholder="https://shopee.ph/your-shop"
                          />
                        </label>

                        <label>
                          <span>Lazada Link</span>
                          <input
                            type="url"
                            name="lazadaLink"
                            value={editForm.lazadaLink}
                            onChange={onEditChange}
                            placeholder="https://www.lazada.com.ph/shop/your-shop"
                          />
                        </label>

                        <label>
                          <span>TikTok Shop Link</span>
                          <input
                            type="url"
                            name="tiktokLink"
                            value={editForm.tiktokLink}
                            onChange={onEditChange}
                            placeholder="https://shop.tiktok.com/your-shop"
                          />
                        </label>
                      </div>

                      <div className="fb-connect-actions fb-inline-edit-actions">
                        <button className="fb-btn-secondary" type="button" onClick={cancelEditDetails} disabled={savingEdit}>
                          Cancel
                        </button>
                        <button className="btn-primary" type="submit" disabled={savingEdit}>
                          {savingEdit ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  )}
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
              <span>Facebook Page ID</span>
              <input
                type="text"
                name="pageId"
                value={form.pageId}
                onChange={onChange}
                placeholder="102428222282366"
                required
              />
            </label>

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
              <span>Product/Services</span>
              <input
                type="text"
                name="productServices"
                value={form.productServices}
                onChange={onChange}
                placeholder="Solar Panel, Installation, Maintenance"
              />
            </label>

            <label>
              <span>Price Range</span>
              <select
                name="productServicePriceRanges"
                value={form.productServicePriceRanges}
                onChange={onChange}
              >
                {PRICE_RANGE_OPTIONS.map((option) => (
                  <option key={option || 'none'} value={option}>
                    {option || 'Select price range'}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Website Link</span>
              <input
                type="url"
                name="websiteLink"
                value={form.websiteLink}
                onChange={onChange}
                placeholder="https://yourwebsite.com"
              />
            </label>

            <label>
              <span>Shopee Link</span>
              <input
                type="url"
                name="shoppeLink"
                value={form.shoppeLink}
                onChange={onChange}
                placeholder="https://shopee.ph/your-shop"
              />
            </label>

            <label>
              <span>Lazada Link</span>
              <input
                type="url"
                name="lazadaLink"
                value={form.lazadaLink}
                onChange={onChange}
                placeholder="https://www.lazada.com.ph/shop/your-shop"
              />
            </label>

            <label>
              <span>TikTok Shop Link</span>
              <input
                type="url"
                name="tiktokLink"
                value={form.tiktokLink}
                onChange={onChange}
                placeholder="https://shop.tiktok.com/your-shop"
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
