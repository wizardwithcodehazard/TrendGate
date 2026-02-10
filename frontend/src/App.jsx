import { useState, useEffect, useCallback } from 'react';
import {
  Rocket, TrendingUp, TrendingDown, Search, BarChart3, Zap, Shield,
  AlertTriangle, CheckCircle, Activity, PieChart as PieIcon, RefreshCw,
  ChevronDown, Upload, Image, X, Sparkles, ArrowUpRight, ArrowDownRight,
  Brain, Target, Clock, Users, FileImage, Hash, MessageSquare
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';
import api from './api/client';
import './index.css';

// --- API CLIENT UPDATE ---
const apiClient = {
  ...api,
  analyzePost: async (formData) => {
    const response = await fetch('/api/campaign/analyze-post', {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error('Post analysis failed');
    return response.json();
  },
  explainMetrics: async (data) => {
    const response = await fetch('/api/trends/explain-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Metric explanation failed');
    return response.json();
  }
};

// --- POST UPLOAD COMPONENT ---
function PostUpload({ onAnalysis, loading }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
    }
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('platform', platform);
    if (caption) formData.append('caption', caption);
    if (hashtags) formData.append('hashtags', hashtags);

    onAnalysis(formData);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      {!preview ? (
        <div
          className={`dropzone ${dragActive ? 'active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          <Upload className="w-12 h-12 mx-auto text-neutral-500 mb-4" />
          <p className="text-neutral-400 mb-2">Drag & drop your post image</p>
          <p className="text-neutral-600 text-sm">or click to browse</p>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover rounded-xl border border-neutral-800"
          />
          <button
            onClick={clearFile}
            className="absolute top-3 right-3 p-2 bg-black/80 rounded-full hover:bg-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Caption & Hashtags */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-2">Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Enter your post caption..."
            rows={2}
            className="input resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-2">Hashtags</label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#fashion, #style"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-2">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="input"
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="twitter">X (Twitter)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleSubmit}
        disabled={!file || loading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Analyze Post with AI
          </>
        )}
      </button>
    </div>
  );
}

// --- POST ANALYSIS RESULT ---
function PostAnalysisResult({ result }) {
  if (!result) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Scores Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="metric-card">
          <div className="metric-value">{result.visual_score || 0}</div>
          <div className="metric-label">Visual Score</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{result.engagement_score || 0}</div>
          <div className="metric-label">Engagement Score</div>
        </div>
      </div>

      {/* Content Analysis */}
      <div className="glass p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileImage className="w-5 h-5 text-neutral-400" />
          <h3 className="font-semibold">Content Analysis</h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-400">Content Type</span>
            <span className="capitalize">{result.content_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Engagement Prediction</span>
            <span className={`badge ${result.predicted_engagement === 'high' ? 'badge-success' :
              result.predicted_engagement === 'medium' ? 'badge-warning' : 'badge-danger'
              }`}>
              {result.predicted_engagement}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Viral Potential</span>
            <span>{((result.viral_potential || 0) * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-4">
        {result.strengths?.length > 0 && (
          <div className="glass p-5">
            <h4 className="text-sm font-medium text-neutral-400 mb-3">Strengths</h4>
            <ul className="space-y-2">
              {result.strengths.slice(0, 3).map((s, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.improvements?.length > 0 && (
          <div className="glass p-5">
            <h4 className="text-sm font-medium text-neutral-400 mb-3">Improvements</h4>
            <ul className="space-y-2">
              {result.improvements.slice(0, 3).map((s, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <ArrowUpRight className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Hashtag Suggestions */}
      {result.hashtag_suggestions?.length > 0 && (
        <div className="glass p-5">
          <h4 className="text-sm font-medium text-neutral-400 mb-3 flex items-center gap-2">
            <Hash className="w-4 h-4" />
            Suggested Hashtags
          </h4>
          <div className="flex flex-wrap gap-2">
            {result.hashtag_suggestions.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-neutral-800 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- CAMPAIGN FORM ---
function CampaignForm({ onSubmit, onDeepSubmit, loading, deepLoading }) {
  const [formData, setFormData] = useState({
    topic: '',
    hashtags: '',
    platform: 'instagram',
    campaign_aim: '',
    target_audience: '',
    planned_duration_days: 30,
    additional_context: ''
  });
  const [deepMode, setDeepMode] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      hashtags: formData.hashtags.split(',').map(h => h.trim()).filter(h => h)
    };
    if (deepMode) {
      onDeepSubmit(data);
    } else {
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-neutral-400 mb-2">Campaign Topic</label>
        <input
          type="text"
          required
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          placeholder="e.g., Summer Fashion Collection 2025"
          className="input"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400 mb-2">Hashtags</label>
        <input
          type="text"
          required
          value={formData.hashtags}
          onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
          placeholder="#SummerVibes, #OOTD, #Fashion2025"
          className="input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-2">Platform</label>
          <select
            value={formData.platform}
            onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
            className="input"
          >
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="twitter">X (Twitter)</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-neutral-400 mb-2">Duration</label>
          <input
            type="number"
            min="7"
            max="365"
            value={formData.planned_duration_days}
            onChange={(e) => setFormData({ ...formData, planned_duration_days: parseInt(e.target.value) })}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-neutral-400 mb-2">Campaign Aim</label>
        <input
          type="text"
          required
          value={formData.campaign_aim}
          onChange={(e) => setFormData({ ...formData, campaign_aim: e.target.value })}
          placeholder="e.g., Increase brand awareness"
          className="input"
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400 mb-2">Target Audience</label>
        <input
          type="text"
          required
          value={formData.target_audience}
          onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
          placeholder="e.g., 18-25 females interested in fashion"
          className="input"
        />
      </div>

      {/* Deep Analysis Toggle */}
      <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-400" />
          <div>
            <div className="font-medium text-sm">Deep Market Research</div>
            <div className="text-xs text-neutral-500">Uses Serper to search real market data</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDeepMode(!deepMode)}
          className={`w-12 h-6 rounded-full transition-colors relative ${deepMode ? 'bg-blue-500' : 'bg-neutral-700'}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${deepMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      <button
        type="submit"
        disabled={loading || deepLoading}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading || deepLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            {deepLoading ? 'Deep Analyzing...' : 'Analyzing...'}
          </>
        ) : (
          <>
            {deepMode ? <Search className="w-5 h-5" /> : <Rocket className="w-5 h-5" />}
            {deepMode ? 'Deep Analyze with Serper' : 'Analyze Campaign'}
          </>
        )}
      </button>
    </form>
  );
}

// --- DEEP ANALYSIS RESULTS ---
function DeepAnalysisResults({ results }) {
  if (!results) return null;

  const aiInsights = results.ai_insights || {};

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Viability Score */}
      <div className="glass p-6">
        <ViabilityScore score={results.viability_score || aiInsights.viability_score || 50} />
      </div>

      {/* AI Summary */}
      {aiInsights.summary && (
        <div className="glass p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            AI Summary
          </h3>
          <p className="text-neutral-300 text-sm leading-relaxed">{aiInsights.summary}</p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="metric-card">
          <div className="metric-value capitalize text-lg">{aiInsights.market_status || '—'}</div>
          <div className="metric-label">Market Status</div>
        </div>
        <div className="metric-card">
          <div className={`metric-value capitalize text-lg ${aiInsights.timing_verdict === 'optimal' ? 'text-green-500' :
            aiInsights.timing_verdict === 'risky' ? 'text-yellow-500' :
              aiInsights.timing_verdict === 'avoid' ? 'text-red-500' : ''
            }`}>
            {aiInsights.timing_verdict || '—'}
          </div>
          <div className="metric-label">Timing</div>
        </div>
        <div className="metric-card">
          <div className={`metric-value capitalize text-lg ${results.risk_analysis?.risk_level === 'high' ? 'text-red-500' :
            results.risk_analysis?.risk_level === 'medium' ? 'text-yellow-500' : 'text-green-500'
            }`}>
            {results.risk_analysis?.risk_level || '—'}
          </div>
          <div className="metric-label">Risk Level</div>
        </div>
      </div>

      {/* Timing Reason */}
      {aiInsights.timing_reason && (
        <div className="glass p-5 border-l-4 border-blue-500">
          <h4 className="text-sm font-medium text-neutral-400 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timing Assessment
          </h4>
          <p className="text-sm text-neutral-300">{aiInsights.timing_reason}</p>
        </div>
      )}

      {/* Market Research */}
      {results.market_research?.news?.length > 0 && (
        <div className="glass p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Market Research
            <span className="text-xs text-neutral-500 font-normal">via Serper</span>
          </h3>
          <div className="space-y-3">
            {results.market_research.news.slice(0, 4).map((news, idx) => (
              <a
                key={idx}
                href={news.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <div className="font-medium text-sm mb-1 line-clamp-1">{news.title}</div>
                <div className="text-xs text-neutral-500 line-clamp-2">{news.snippet}</div>
                <div className="text-xs text-neutral-600 mt-2">{news.source} • {news.date}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Competitor Analysis */}
      {results.competitor_analysis?.results?.length > 0 && (
        <div className="glass p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Competitor Activity
          </h3>
          {aiInsights.competitor_insights && (
            <p className="text-sm text-neutral-400 mb-4">{aiInsights.competitor_insights}</p>
          )}
          <div className="space-y-2">
            {results.competitor_analysis.results.slice(0, 3).map((comp, idx) => (
              <a
                key={idx}
                href={comp.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs flex-shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <div className="font-medium text-sm line-clamp-1">{comp.title}</div>
                  <div className="text-xs text-neutral-500 line-clamp-1">{comp.snippet}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Real Risks */}
      {(results.risk_analysis?.controversies?.length > 0 || aiInsights.real_risks?.length > 0) && (
        <div className="glass p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Identified Risks
          </h3>
          <div className="space-y-3">
            {/* From search */}
            {results.risk_analysis?.controversies?.slice(0, 2).map((risk, idx) => (
              <div key={`s-${idx}`} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="font-medium text-sm text-red-400 mb-1">{risk.title}</div>
                <div className="text-xs text-neutral-500">{risk.snippet}</div>
              </div>
            ))}
            {/* From AI */}
            {aiInsights.real_risks?.slice(0, 3).map((risk, idx) => (
              <div key={`ai-${idx}`} className="p-3 bg-neutral-900 rounded-lg">
                <div className="font-medium text-sm mb-1">{risk.risk}</div>
                <div className="text-xs text-neutral-500 mb-2">{risk.source}</div>
                <div className="text-xs text-green-500/80">
                  <strong>Mitigation:</strong> {risk.mitigation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {aiInsights.opportunities?.length > 0 && (
        <div className="glass p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" />
            Opportunities
          </h3>
          <ul className="space-y-2">
            {aiInsights.opportunities.map((opp, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-neutral-300">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {opp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {aiInsights.recommendations?.length > 0 && (
        <div className="glass p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            AI Recommendations
          </h3>
          <div className="space-y-3">
            {aiInsights.recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 bg-neutral-900 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-sm">{rec.action}</span>
                  <span className={`badge ${rec.priority === 'high' ? 'badge-danger' :
                    rec.priority === 'medium' ? 'badge-warning' : 'badge-success'
                    }`}>
                    {rec.priority}
                  </span>
                </div>
                <div className="text-xs text-neutral-500">{rec.reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Discussions */}
      {results.social_discussions?.reddit?.length > 0 && (
        <div className="glass p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            Social Discussions
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Reddit */}
            <div>
              <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">Reddit</div>
              <div className="space-y-2">
                {results.social_discussions.reddit.slice(0, 2).map((item, idx) => (
                  <a
                    key={idx}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 bg-neutral-900 rounded-lg text-xs hover:bg-neutral-800 transition-colors"
                  >
                    <div className="line-clamp-2">{item.title}</div>
                  </a>
                ))}
              </div>
            </div>
            {/* Twitter */}
            {results.social_discussions?.twitter?.length > 0 && (
              <div>
                <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wide">Twitter/X</div>
                <div className="space-y-2">
                  {results.social_discussions.twitter.slice(0, 2).map((item, idx) => (
                    <a
                      key={idx}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 bg-neutral-900 rounded-lg text-xs hover:bg-neutral-800 transition-colors"
                    >
                      <div className="line-clamp-2">{item.title}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- VIABILITY SCORE ---
function ViabilityScore({ score }) {
  const getColor = () => {
    if (score >= 70) return '#22c55e';
    if (score >= 40) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="text-center">
      <div
        className="text-7xl font-bold mb-2"
        style={{ color: getColor() }}
      >
        {score}
      </div>
      <div className="text-neutral-500 text-sm uppercase tracking-wide">
        Viability Score
      </div>
      <div className="mt-4 h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${score}%`, backgroundColor: getColor() }}
        />
      </div>
    </div>
  );
}

// --- ANALYSIS RESULTS ---
function AnalysisResults({ results }) {
  if (!results) return null;

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="glass p-6">
        <ViabilityScore score={results.viability_score || 50} />
      </div>

      {results.summary && (
        <div className="glass p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Summary
          </h3>
          <p className="text-neutral-300 text-sm leading-relaxed">{results.summary}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="metric-card">
          <div className="metric-value">{results.predicted_lifecycle_days || '—'}</div>
          <div className="metric-label">Predicted Days</div>
        </div>
        <div className="metric-card">
          <div className="metric-value capitalize text-lg">{results.market_status || '—'}</div>
          <div className="metric-label">Market Status</div>
        </div>
        <div className="metric-card">
          <div className="metric-value capitalize text-lg">
            {results.competitive_analysis?.market_saturation || '—'}
          </div>
          <div className="metric-label">Saturation</div>
        </div>
      </div>

      {results.risk_factors?.length > 0 && (
        <div className="glass p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            Risk Factors
          </h3>
          <div className="space-y-3">
            {results.risk_factors.slice(0, 4).map((rf, idx) => (
              <div key={idx} className="flex items-start justify-between p-3 bg-neutral-900 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <span className="text-sm">{typeof rf === 'string' ? rf : rf.risk}</span>
                </div>
                {rf.severity && (
                  <span className={`badge ${rf.severity === 'high' ? 'badge-danger' :
                    rf.severity === 'medium' ? 'badge-warning' : 'badge-success'
                    }`}>
                    {rf.severity}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {results.recommendations?.length > 0 && (
        <div className="glass p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Recommendations
          </h3>
          <ul className="space-y-2">
            {results.recommendations.slice(0, 5).map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-neutral-300">
                <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center text-xs flex-shrink-0">
                  {idx + 1}
                </span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// --- METRIC EXPLANATION CARD ---
function MetricExplanation({ metric, analysis }) {
  if (!analysis) return null;

  const data = analysis.metric_analysis?.[metric];
  if (!data) return null;

  const getStatusIcon = (status) => {
    if (status === 'growing') return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (status === 'declining') return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-neutral-500" />;
  };

  return (
    <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="capitalize font-medium">{metric}</span>
          {getStatusIcon(data.status)}
        </div>
        <span className={`badge ${data.status === 'growing' ? 'badge-success' :
          data.status === 'declining' ? 'badge-danger' : 'badge-neutral'
          }`}>
          {data.status}
        </span>
      </div>
      <p className="text-sm text-neutral-400 mb-2">{data.explanation}</p>
      {data.cause && (
        <div className="text-xs text-neutral-500 mt-2">
          <strong>Cause:</strong> {data.cause}
        </div>
      )}
      {data.action && (
        <div className="text-xs text-green-500/80 mt-1">
          <strong>Action:</strong> {data.action}
        </div>
      )}
    </div>
  );
}

// --- STATE COLORS ---
const STATE_COLORS = {
  Emerging: '#22d3ee',
  Growth: '#22c55e',
  Peak: '#a855f7',
  Saturation: '#eab308',
  Decline: '#ef4444'
};

// --- TREND LIFECYCLE CHART ---
function TrendLifecycleChart({ data }) {
  if (!data?.length) return null;

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="velocityG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fatigueG" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis
            dataKey="date"
            stroke="#525252"
            tick={{ fontSize: 11 }}
            tickFormatter={(val) => val?.slice(5, 10) || ''}
          />
          <YAxis stroke="#525252" tick={{ fontSize: 11 }} domain={[0, 1]} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#141414',
              border: '1px solid #262626',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
          <Area type="monotone" dataKey="velocity" stroke="#fff" strokeWidth={2} fill="url(#velocityG)" name="Velocity" />
          <Area type="monotone" dataKey="fatigue" stroke="#ef4444" strokeWidth={2} fill="url(#fatigueG)" name="Fatigue" />
          <Legend />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- STATE PIE CHART ---
function StateDistributionChart({ distribution }) {
  if (!distribution) return null;

  const data = Object.entries(distribution).map(([name, value]) => ({
    name, value, color: STATE_COLORS[name] || '#525252'
  }));

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPie>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#141414',
              border: '1px solid #262626',
              borderRadius: '8px'
            }}
          />
        </RechartsPie>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 justify-center mt-2">
        {Object.entries(STATE_COLORS).map(([state, color]) => (
          <div key={state} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-neutral-400">{state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- TRENDS DASHBOARD ---
function TrendsDashboard() {
  const [trends, setTrends] = useState([]);
  const [selectedTrend, setSelectedTrend] = useState(null);
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [metricExplanation, setMetricExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    try {
      const data = await api.listTrends();
      setTrends(data.trends || []);
    } catch (err) {
      setError('Failed to load trends');
    }
  };

  const analyzeTrend = async (trendName) => {
    setLoading(true);
    setError(null);
    setTrendAnalysis(null);
    setMetricExplanation(null);

    try {
      const data = await api.analyzeTrend(trendName);
      setTrendAnalysis(data);

      // Get AI explanation for metrics if decline detected
      if (data.decline_detected && data.decline_info?.metrics) {
        setLoadingExplanation(true);
        const explanation = await apiClient.explainMetrics({
          trend_name: trendName,
          current_metrics: data.decline_info.metrics,
          archetype: data.decline_info.archetype
        });
        setMetricExplanation(explanation);
        setLoadingExplanation(false);
      }
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTrendSelect = (trendName) => {
    setSelectedTrend(trendName);
    analyzeTrend(trendName);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl font-bold">Trend Analytics</h2>
            <p className="text-neutral-500 text-sm mt-1">Select a trend to analyze its lifecycle</p>
          </div>
          <button onClick={loadTrends} className="btn-secondary p-3">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <select
            value={selectedTrend || ''}
            onChange={(e) => handleTrendSelect(e.target.value)}
            className="input text-lg"
          >
            <option value="">Select a trend...</option>
            {trends.map((t, i) => (
              <option key={i} value={t.trend_name}>
                {t.trend_name} ({t.archetype || 'unknown'}) — {t.data_points} days
              </option>
            ))}
          </select>
        </div>

        {/* Quick Stats */}
        {trends.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mt-5">
            <div className="metric-card">
              <div className="metric-value">{trends.length}</div>
              <div className="metric-label">Trends</div>
            </div>
            <div className="metric-card">
              <div className="metric-value text-red-500">
                {trends.filter(t => t.archetype === 'viral_crash').length}
              </div>
              <div className="metric-label">Viral Crashes</div>
            </div>
            <div className="metric-card">
              <div className="metric-value text-yellow-500">
                {trends.filter(t => t.archetype === 'controversy_spike').length}
              </div>
              <div className="metric-label">Controversies</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">
                {trends.reduce((sum, t) => sum + (t.data_points || 0), 0)}
              </div>
              <div className="metric-label">Data Points</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="glass p-5 border-l-4 border-red-500">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {loading && (
        <div className="glass p-12 text-center pulse-glow">
          <div className="loader mx-auto mb-4" />
          <p className="text-neutral-400">Analyzing trend...</p>
        </div>
      )}

      {!loading && trendAnalysis && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Lifecycle Chart */}
          <div className="glass p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-neutral-400" />
              Lifecycle ({trendAnalysis.trend_name})
            </h3>
            <TrendLifecycleChart data={trendAnalysis.lifecycle_data} />
          </div>

          {/* State Distribution */}
          <div className="glass p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-neutral-400" />
              State Distribution
            </h3>
            <StateDistributionChart distribution={trendAnalysis.state_distribution} />
          </div>

          {/* Decline Detection */}
          {trendAnalysis.decline_detected && trendAnalysis.decline_info && (
            <div className="glass p-6 lg:col-span-2 border-l-4 border-red-500">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                Decline Detected — {trendAnalysis.decline_info.date}
              </h3>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="metric-card">
                  <div className="metric-value" style={{ color: STATE_COLORS[trendAnalysis.decline_info.state] }}>
                    {trendAnalysis.decline_info.state}
                  </div>
                  <div className="metric-label">State</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">{(trendAnalysis.decline_info.metrics?.velocity * 100).toFixed(0)}%</div>
                  <div className="metric-label">Velocity</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value text-red-400">{(trendAnalysis.decline_info.metrics?.fatigue * 100).toFixed(0)}%</div>
                  <div className="metric-label">Fatigue</div>
                </div>
              </div>

              {/* AI Metric Explanations */}
              {loadingExplanation && (
                <div className="flex items-center gap-3 p-4 bg-neutral-900 rounded-xl">
                  <Brain className="w-5 h-5 text-purple-500 animate-pulse" />
                  <span className="text-neutral-400">Getting AI explanation...</span>
                </div>
              )}

              {metricExplanation && !loadingExplanation && (
                <div className="space-y-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <h4 className="font-medium">AI Metric Analysis</h4>
                    <span className={`badge ${metricExplanation.overall_health === 'healthy' ? 'badge-success' :
                      metricExplanation.overall_health === 'warning' ? 'badge-warning' : 'badge-danger'
                      }`}>
                      {metricExplanation.overall_health}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    {['velocity', 'fatigue', 'retention'].map(metric => (
                      <MetricExplanation
                        key={metric}
                        metric={metric}
                        analysis={metricExplanation}
                      />
                    ))}
                  </div>

                  {metricExplanation.causal_chain && (
                    <div className="p-4 bg-neutral-900 rounded-xl">
                      <h5 className="text-sm font-medium text-neutral-400 mb-2">Causal Chain</h5>
                      <p className="text-sm">{metricExplanation.causal_chain}</p>
                    </div>
                  )}

                  {metricExplanation.recovery_actions?.length > 0 && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                      <h5 className="text-sm font-medium text-green-400 mb-2">Recovery Actions</h5>
                      <ul className="space-y-1">
                        {metricExplanation.recovery_actions.slice(0, 3).map((action, i) => (
                          <li key={i} className="text-sm text-neutral-300 flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!trendAnalysis.decline_detected && (
            <div className="glass p-6 lg:col-span-2 border-l-4 border-green-500">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="font-semibold">Trend is Healthy</span>
              </div>
              <p className="text-neutral-400 mt-2 text-sm">No decline detected in this trend.</p>
            </div>
          )}
        </div>
      )}

      {!loading && !trendAnalysis && !error && (
        <div className="glass p-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-neutral-700 mb-4" />
          <p className="text-neutral-500">Select a trend to analyze</p>
        </div>
      )}
    </div>
  );
}

// --- MAIN APP ---
function App() {
  const [activeTab, setActiveTab] = useState('campaign');
  const [activeSubTab, setActiveSubTab] = useState('form');
  const [loading, setLoading] = useState(false);
  const [deepLoading, setDeepLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [deepResults, setDeepResults] = useState(null);
  const [postResults, setPostResults] = useState(null);
  const [error, setError] = useState(null);

  const handleCampaignSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setDeepResults(null);
    try {
      const result = await api.analyzeCampaign(data);
      setResults(result);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeepCampaignSubmit = async (data) => {
    setDeepLoading(true);
    setError(null);
    setResults(null);
    setDeepResults(null);
    try {
      const response = await fetch('/api/campaign/deep-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Deep analysis failed');
      const result = await response.json();
      setDeepResults(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeepLoading(false);
    }
  };

  const handlePostAnalysis = async (formData) => {
    setLoading(true);
    setError(null);
    setPostResults(null);
    try {
      const result = await apiClient.analyzePost(formData);
      setPostResults(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-neutral-800 sticky top-0 z-50 bg-black/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold">TrendGuard</h1>
              <p className="text-xs text-neutral-500">AI Campaign Advisor</p>
            </div>
          </div>

          <nav className="flex gap-1">
            {[
              { id: 'campaign', icon: Rocket, label: 'Campaign' },
              { id: 'trends', icon: BarChart3, label: 'Trends' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === tab.id
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {activeTab === 'campaign' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="glass p-7">
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Campaign Analysis</h2>
                <p className="text-neutral-500 text-sm">Get AI predictions before launch</p>
              </div>

              {/* Sub tabs */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setActiveSubTab('form')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeSubTab === 'form' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'
                    }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Details
                </button>
                <button
                  onClick={() => setActiveSubTab('upload')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeSubTab === 'upload' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'
                    }`}
                >
                  <Image className="w-4 h-4" />
                  Upload Post
                </button>
              </div>

              {activeSubTab === 'form' && (
                <CampaignForm
                  onSubmit={handleCampaignSubmit}
                  onDeepSubmit={handleDeepCampaignSubmit}
                  loading={loading}
                  deepLoading={deepLoading}
                />
              )}
              {activeSubTab === 'upload' && (
                <PostUpload onAnalysis={handlePostAnalysis} loading={loading} />
              )}
            </div>

            <div>
              {error && (
                <div className="glass p-5 border-l-4 border-red-500 mb-6">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {(loading || deepLoading) && (
                <div className="glass p-12 text-center pulse-glow">
                  <div className="loader mx-auto mb-4" />
                  <p className="text-neutral-400">
                    {deepLoading ? 'Deep analyzing with Serper + AI...' : 'Analyzing with AI...'}
                  </p>
                </div>
              )}

              {!loading && !deepLoading && activeSubTab === 'form' && results && (
                <AnalysisResults results={results} />
              )}

              {!loading && !deepLoading && activeSubTab === 'form' && deepResults && (
                <DeepAnalysisResults results={deepResults} />
              )}

              {!loading && !deepLoading && activeSubTab === 'upload' && postResults && (
                <PostAnalysisResult result={postResults} />
              )}

              {!loading && !deepLoading && !results && !deepResults && !postResults && !error && (
                <div className="glass p-12 text-center">
                  <Search className="w-12 h-12 mx-auto text-neutral-700 mb-4" />
                  <p className="text-neutral-500">Fill the form or upload a post to analyze</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'trends' && <TrendsDashboard />}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-5 text-center text-neutral-600 text-sm">
          TrendGuard v4 — Powered by Gemini AI
        </div>
      </footer>
    </div>
  );
}

export default App;
