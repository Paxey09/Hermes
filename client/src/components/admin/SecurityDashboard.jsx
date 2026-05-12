import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress } from './ui';
import { Shield, AlertTriangle, CheckCircle, Eye, Lock, Database, Activity, Settings, Brain } from 'lucide-react';
import { aiModules } from '../../services/ai';

export default function SecurityDashboard() {
  const [securityStatus, setSecurityStatus] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [sensitivityReport, setSensitivityReport] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      // Load security status
      const health = await aiModules.healthCheck();
      setSecurityStatus(health);

      // Load audit logs
      const logs = await aiModules.getSecurityAuditLogs(20);
      setAuditLogs(logs);

      // Generate sensitivity report
      const report = await generateSensitivityReport();
      setSensitivityReport(report);
    } catch (error) {
      console.error('Error loading security data:', error);
    }
  };

  const generateSensitivityReport = async () => {
    // Mock data for sensitivity analysis
    const testData = {
      recentOperations: [
        { module: 'deals', operation: 'analysis', dataPoints: 150 },
        { module: 'contacts', operation: 'analysis', dataPoints: 200 },
        { module: 'revenue', operation: 'forecasting', dataPoints: 50 }
      ],
      sensitiveFields: ['email', 'phone', 'clientName', 'financialData'],
      dataClassifications: {
        high: 25,    // Contains PII or client data
        medium: 45,  // Business data requiring masking
        low: 130     // Internal operational data
      }
    };

    return await aiModules.getDataSensitivityReport(testData, {
      module: 'security',
      operation: 'compliance-check'
    });
  };

  const runSecurityScan = async () => {
    setIsScanning(true);
    try {
      const scanResults = await performSecurityScan();
      setSecurityStatus(prev => ({
        ...prev,
        lastScan: scanResults,
        scanTime: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Security scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const performSecurityScan = async () => {
    // Simulate security scan results
    return {
      vulnerabilities: [
        {
          id: 1,
          severity: 'medium',
          category: 'data-exposure',
          description: 'Potential client data exposure in external AI calls',
          recommendation: 'Enable strict data protection mode',
          affectedModules: ['deals', 'contacts']
        },
        {
          id: 2,
          severity: 'low',
          category: 'audit-trail',
          description: 'Incomplete audit logging for some operations',
          recommendation: 'Review audit configuration',
          affectedModules: ['reports']
        }
      ],
      complianceScore: 85,
      threatsBlocked: 12,
      dataProtection: 'enabled'
    };
  };

  const clearAuditLogs = async () => {
    try {
      await aiModules.clearSecurityAuditLogs();
      setAuditLogs([]);
    } catch (error) {
      console.error('Failed to clear audit logs:', error);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'text-[var(--accent-gold)] bg-yellow-100 border-yellow-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return colors[severity] || 'bg-gray-100 text-gray-700';
  };

  const getOverallStatus = () => {
    if (!securityStatus) return 'checking';
    if (securityStatus.overall === 'healthy') return 'secure';
    if (securityStatus.overall === 'degraded') return 'warning';
    return 'error';
  };

  const getStatusColor = () => {
    const status = getOverallStatus();
    const colors = {
      secure: 'text-green-600',
      warning: 'text-yellow-600',
      error: 'text-red-600',
      checking: 'text-blue-600'
    };
    return colors[status] || 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Security Dashboard</h1>
          <p className="text-gray-600">Monitor and manage AI data protection and compliance</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={runSecurityScan}
            disabled={isScanning}
            className="flex items-center gap-2"
          >
            {isScanning ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Security Scan
              </>
            )}
          </Button>
          <Button variant="outline" onClick={loadSecurityData}>
            <Settings className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Security Status */}
      <Card className={`border-2 ${getOverallStatus() === 'secure' ? 'border-green-200 bg-green-50' : getOverallStatus() === 'warning' ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${getOverallStatus() === 'secure' ? 'bg-green-500' : getOverallStatus() === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} />
              <div>
                <h3 className={`text-lg font-semibold ${getStatusColor()}`}>
                  {getOverallStatus().charAt(0).toUpperCase() + getOverallStatus().slice(1)}
                </h3>
                <p className="text-sm text-gray-600">
                  {securityStatus?.security?.dataProtection ? 'Data Protection: Enabled' : 'Data Protection: Disabled'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={getOverallStatus() === 'secure' ? 'bg-green-100 text-green-700' : getOverallStatus() === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}>
                {securityStatus?.security?.routing === 'secure' ? 'Secure Routing' : 'Standard Routing'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sensitivity Analysis */}
      {sensitivityReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              Data Sensitivity Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Data Classification */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 mb-3">Data Classification</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">High Sensitivity</span>
                    <Badge className="bg-red-100 text-red-700">
                      {sensitivityReport.sensitivity?.dataClassifications?.high || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Medium Sensitivity</span>
                    <Badge className="bg-yellow-100 text-yellow-700">
                      {sensitivityReport.sensitivity?.dataClassifications?.medium || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Low Sensitivity</span>
                    <Badge className="bg-green-100 text-green-700">
                      {sensitivityReport.sensitivity?.dataClassifications?.low || 0}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* AI Provider Usage */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 mb-3">AI Provider Usage</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Groq (External)</span>
                    <span className="text-sm font-medium">75%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Local AI</span>
                    <span className="text-sm font-medium">25%</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-sm text-gray-600 mb-1">Data Protection</div>
                  <Progress value={85} className="h-2" />
                </div>
              </div>

              {/* Compliance Status */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 mb-3">Compliance Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">GDPR</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Data Residency</span>
                    <span className="text-sm font-medium">Internal</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Audit Trail</span>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-600" />
              Recent AI Activity Logs
            </div>
            <Button variant="outline" size="sm" onClick={clearAuditLogs}>
              Clear Logs
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length > 0 ? (
            <div className="space-y-3">
              {auditLogs.map((log, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Brain className={`w-4 h-4 ${log.aiProvider === 'groq' ? 'text-purple-600' : 'text-blue-600'}`} />
                      <span className="font-medium text-sm">{log.module}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        log.sensitivityLevel === 'high' ? 'bg-red-100 text-red-700' :
                        log.sensitivityLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }>
                        {log.sensitivityLevel}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Operation:</span> {log.operation}
                    {log.reason && (
                      <span className="ml-2">
                        <span className="font-medium">Reason:</span> {log.reason}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Eye className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No AI activity logs available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      {sensitivityReport?.recommendations && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-blue-600" />
              Security Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sensitivityReport.recommendations.map((rec, index) => (
                <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(rec.priority)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{rec.action}</h4>
                    <Badge className={
                      rec.priority === 'critical' ? 'bg-red-100 text-red-700' :
                      rec.priority === 'high' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-yellow-100 text-yellow-700'
                    }>
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700">{rec.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
