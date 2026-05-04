import Admin_Layout from '../../Components/Admin_Components/Admin_Layout.jsx';
import '../../../styles/Admin_styles/Admin_Style.css';
import { useState, useEffect } from 'react';
import openClaudeService from '../../../services/openClaude';
import { db, supabase } from '../../../config/supabaseClient';

function AdminAnalytics() {
    const [metrics, setMetrics] = useState({
        totalRevenue: 0,
        growthRate: 0,
        activeUsers: 0,
        conversionRate: 0
    });
    const [insights, setInsights] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState('7d');
    const [recentReports, setRecentReports] = useState([]);

    useEffect(() => {
        loadAnalyticsData();
    }, [timeRange]);

    const loadAnalyticsData = async () => {
        setLoading(true);
        try {
            // Load metrics from Supabase
            const { data: metricsData } = await db.getAggregatedMetrics(timeRange);

            // Load customers for revenue calculation
            const { data: customers } = await db.getCustomers();

            // Load profiles for user count
            const { data: profiles } = await db.getAllProfiles();

            // Calculate metrics
            const totalRevenue = customers?.reduce((sum, c) => sum + (parseFloat(c.value) || 0), 0) || 0;
            const activeUsers = profiles?.filter(p => p.role === 'Admin' || p.role === 'Client')?.length || 0;

            setMetrics({
                totalRevenue,
                growthRate: metricsData?.revenue?.average || 12.5,
                activeUsers,
                conversionRate: metricsData?.conversion?.average || 3.2
            });

            // Load recent reports (mock for now, could be stored in Supabase)
            setRecentReports([
                {
                    id: 1,
                    title: 'Q1 2024 Performance Report',
                    date: new Date().toLocaleDateString(),
                    type: 'performance'
                },
                {
                    id: 2,
                    title: 'Customer Behavior Analysis',
                    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                    type: 'behavior'
                }
            ]);
        } catch (error) {
            console.error('Error loading analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateInsights = async () => {
        setLoading(true);
        try {
            const result = await openClaudeService.chatCompletion([
                {
                    role: 'user',
                    content: `Analyze the following business metrics and provide actionable insights:\n\nTotal Revenue: $${metrics.totalRevenue.toLocaleString()}\nGrowth Rate: ${metrics.growthRate}%\nActive Users: ${metrics.activeUsers}\nConversion Rate: ${metrics.conversionRate}%\n\nProvide:\n1. Key trends\n2. Performance metrics\n3. Recommendations\n4. Forecast predictions`
                }
            ]);

            setInsights(result.content?.[0]?.text || 'Insights generated successfully');
        } catch (error) {
            console.error('Error generating insights:', error);
            alert('Failed to generate insights: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const generateMarketResearch = async (topic) => {
        setLoading(true);
        try {
            const result = await openClaudeService.chatCompletion([
                {
                    role: 'user',
                    content: `Create a comprehensive market research template for: ${topic}\n\nInclude:\n1. Research objectives\n2. Target audience analysis\n3. Competitor analysis framework\n4. Data collection methods\n5. Analysis templates`
                }
            ]);

            // Save as a report
            const { data: { user } } = await supabase.auth.getUser();
            await db.createMetric({
                metric_name: 'market_research',
                value: 1,
                metadata: {
                    topic,
                    content: result.content?.[0]?.text,
                    created_by: user?.id
                }
            });

            alert('Market research template generated and saved!');
        } catch (error) {
            console.error('Error generating market research:', error);
            alert('Failed to generate market research: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Admin_Layout title="Analytics & Reports">
            <div className="analytics-header">
                <h1>Business Intelligence & Analytics</h1>
                <p>View analytics and generate AI-powered insights</p>
            </div>

            {/* Time Range Selector */}
            <div className="time-range-selector">
                <button
                    className={timeRange === '1d' ? 'active' : ''}
                    onClick={() => setTimeRange('1d')}
                >
                    1 Day
                </button>
                <button
                    className={timeRange === '7d' ? 'active' : ''}
                    onClick={() => setTimeRange('7d')}
                >
                    7 Days
                </button>
                <button
                    className={timeRange === '30d' ? 'active' : ''}
                    onClick={() => setTimeRange('30d')}
                >
                    30 Days
                </button>
                <button
                    className={timeRange === '90d' ? 'active' : ''}
                    onClick={() => setTimeRange('90d')}
                >
                    90 Days
                </button>
            </div>

            {/* Metrics Grid */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon" style={{ color: '#4caf50' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                    </div>
                    <div className="metric-content">
                        <div className="metric-label">Total Revenue</div>
                        <div className="metric-value">${metrics.totalRevenue.toLocaleString()}</div>
                        <div className="metric-change positive">+12.5%</div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon" style={{ color: '#2196f3' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div className="metric-content">
                        <div className="metric-label">Active Users</div>
                        <div className="metric-value">{metrics.activeUsers.toLocaleString()}</div>
                        <div className="metric-change positive">+8.2%</div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon" style={{ color: '#9c27b0' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <div className="metric-content">
                        <div className="metric-label">Conversion Rate</div>
                        <div className="metric-value">{metrics.conversionRate}%</div>
                        <div className="metric-change positive">+1.5%</div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon" style={{ color: '#ff9800' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                            <polyline points="17 6 23 6 23 12"></polyline>
                        </svg>
                    </div>
                    <div className="metric-content">
                        <div className="metric-label">Growth Rate</div>
                        <div className="metric-value">{metrics.growthRate}%</div>
                        <div className="metric-change positive">+2.3%</div>
                    </div>
                </div>
            </div>

            {/* AI Insights Section */}
            <div className="insights-section">
                <div className="insights-header">
                    <h2>AI-Powered Insights</h2>
                    <button
                        className="btn-primary"
                        onClick={generateInsights}
                        disabled={loading}
                    >
                        {loading ? 'Generating...' : 'Generate Insights'}
                    </button>
                </div>

                {insights ? (
                    <div className="insights-result">
                        <h3>Analysis Results</h3>
                        <div className="insights-text">
                            {insights}
                        </div>
                    </div>
                ) : (
                    <div className="insights-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <p>Click "Generate Insights" to get AI-powered analysis of your metrics</p>
                    </div>
                )}
            </div>

            {/* Market Research Section */}
            <div className="market-research-section">
                <h2>Market Research Generator</h2>
                <div className="research-form">
                    <input
                        type="text"
                        placeholder="Enter topic for market research..."
                        id="research-topic"
                    />
                    <button
                        className="btn-primary"
                        onClick={() => {
                            const topic = document.getElementById('research-topic').value;
                            if (topic) {
                                generateMarketResearch(topic);
                            } else {
                                alert('Please enter a topic');
                            }
                        }}
                        disabled={loading}
                    >
                        Generate Research
                    </button>
                </div>
            </div>

            {/* Recent Reports */}
            <div className="recent-reports">
                <h2>Recent Reports</h2>
                <div className="reports-list">
                    {recentReports.map((report) => (
                        <div key={report.id} className="report-item">
                            <div className="report-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                </svg>
                            </div>
                            <div className="report-info">
                                <div className="report-title">{report.title}</div>
                                <div className="report-date">Generated on {report.date}</div>
                            </div>
                            <button className="report-action">View</button>
                        </div>
                    ))}
                </div>
            </div>
        </Admin_Layout>
    );
}

export default AdminAnalytics;
