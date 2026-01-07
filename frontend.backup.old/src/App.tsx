import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, AlertCircle, Activity, Server, Shield } from 'lucide-react';

function App() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, failed: 0, ips: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/logs/latest');
      const data = res.data.logs || [];
      setLogs(data);
      
      const total = data.length;
      const failed = data.filter(l => l.event?.toLowerCase().includes('failed')).length;
      const ips = new Set(data.map(l => l.ip)).size;
      
      setStats({ total, failed, ips });
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('/api/logs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchData(); // Refresh data
      alert('✅ File uploaded successfully!');
    } catch (error) {
      alert('❌ Upload failed');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-12">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              CyberDefense SIEM
            </h1>
            <p className="text-xl text-gray-400 mt-2">Real-time threat intelligence platform</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-3 space-y-8">
          
          {/* Upload Card */}
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-10 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <div className="flex items-center space-x-4 mb-8">
              <Upload className="w-10 h-10 text-blue-400" />
              <h2 className="text-3xl font-bold">Upload Security Logs</h2>
            </div>
            <div className="border-4 border-dashed border-gray-700 rounded-3xl p-20 text-center group hover:border-blue-500 hover:bg-blue-500/5 transition-all duration-300 cursor-pointer">
              <input 
                type="file" 
                onChange={handleUpload} 
                accept=".csv,.json"
                className="hidden" 
                id="upload"
                disabled={uploading}
              />
              <label htmlFor="upload">
                <Upload className="w-24 h-24 mx-auto mb-8 text-gray-500 group-hover:text-blue-400 transition-colors" />
                <h3 className="text-2xl font-bold mb-2 text-gray-300 group-hover:text-white">Drop your log file here</h3>
                <p className="text-xl text-gray-500 mb-4">CSV or JSON format</p>
                <p className="text-blue-400 font-semibold text-lg">Click to browse</p>
              </label>
              {uploading && (
                <div className="mt-8 flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-400 font-medium">Processing...</span>
                </div>
              )}
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <Activity className="w-10 h-10 text-green-400" />
                <h2 className="text-3xl font-bold">Security Events</h2>
              </div>
              <span className="px-6 py-2 bg-green-500/20 text-green-400 rounded-full text-lg font-semibold">
                Live {logs.length} events
              </span>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-32">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-32">
                <AlertCircle className="w-24 h-24 text-gray-600 mx-auto mb-8" />
                <h3 className="text-2xl font-bold text-gray-400 mb-4">No security events</h3>
                <p className="text-xl text-gray-500">Upload a log file to start monitoring</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-gray-800/50">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-800/50 border-b border-gray-700">
                      <th className="text-left py-6 px-8 font-bold text-lg text-gray-200 w-64">Timestamp</th>
                      <th className="text-left py-6 px-8 font-bold text-lg text-gray-200">Source IP</th>
                      <th className="text-left py-6 px-8 font-bold text-lg text-gray-200">Event Type</th>
                      <th className="text-left py-6 px-8 font-bold text-lg text-gray-200">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 20).map((log, index) => (
                      <tr key={index} className="hover:bg-gray-800/50 transition-colors border-b border-gray-800/50">
                        <td className="py-6 px-8 font-mono text-gray-300">
                          {log.timestamp?.substring(0, 19) || 'N/A'}
                        </td>
                        <td className="py-6 px-8 font-mono bg-gray-800/50 px-6 py-3 rounded-xl text-blue-400 font-bold">
                          {log.ip || 'N/A'}
                        </td>
                        <td className="py-6 px-8">
                          <span className={`px-6 py-3 rounded-2xl font-bold text-sm ${
                            log.event?.toLowerCase().includes('failed') 
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                              : 'bg-green-500/20 text-green-400 border border-green-500/40'
                          }`}>
                            {log.event || 'unknown'}
                          </span>
                        </td>
                        <td className="py-6 px-8 text-gray-400 max-w-md truncate">
                          {log.message || 'Security event'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-8 shadow-2xl sticky top-8">
            <h3 className="text-2xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Live Metrics
            </h3>
            <div className="space-y-6">
              <div className="group p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide">Total Events</p>
                    <p className="text-4xl font-black text-white">{stats.total}</p>
                  </div>
                  <Server className="w-12 h-12 text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              
              <div className="group p-6 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide">Failed Logins</p>
                    <p className="text-4xl font-black text-red-400">{stats.failed}</p>
                  </div>
                  <AlertCircle className="w-12 h-12 text-red-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              
              <div className="group p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl hover:shadow-xl transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wide">Unique IPs</p>
                    <p className="text-4xl font-black text-green-400">{stats.ips}</p>
                  </div>
                  <Activity className="w-12 h-12 text-green-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Kibana Embed */}
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800/50 rounded-3xl p-6 shadow-2xl">
            <h4 className="text-xl font-bold mb-4 flex items-center space-x-3">
              <span>Kibana Analytics</span>
            </h4>
            <iframe 
              src="http://localhost:5601/app/discover" 
              className="w-full h-96 rounded-2xl border-4 border-gray-800/50"
              title="Kibana"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
