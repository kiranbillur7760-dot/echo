import React, { useState, useEffect } from 'react';
import { 
  Code, 
  Terminal, 
  Cpu, 
  Copy, 
  Check, 
  ShieldCheck, 
  Key, 
  ExternalLink, 
  Zap, 
  Globe, 
  Database, 
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export const DeveloperApiPage: React.FC = () => {
  const [apiKey, setApiKey] = useState('echo_live_sk_prod_994821');
  const [endpointTab, setEndpointTab] = useState<'query' | 'search' | 'ingest' | 'discover'>('query');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [modelsData, setModelsData] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Playground state
  const [playgroundQuery, setPlaygroundQuery] = useState('What did Dr. Elena Rostova discover regarding piezoelectric ultrasonic disruption of biofilms?');
  const [playgroundMode, setPlaygroundMode] = useState('hybrid_intelligence');
  const [playgroundResponse, setPlaygroundResponse] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    loadHealthAndModels();
  }, []);

  const loadHealthAndModels = async () => {
    try {
      const h = await api.getV1Health();
      setHealthStatus(h);
      const m = await api.getV1Models();
      setModelsData(m);
    } catch (err) {
      console.error('Failed to load API status', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const executePlayground = async () => {
    setIsExecuting(true);
    setPlaygroundResponse(null);
    try {
      const res = await api.queryV1Intelligence(playgroundQuery, playgroundMode, undefined, apiKey);
      setPlaygroundResponse(res);
    } catch (err: any) {
      setPlaygroundResponse({ error: err.message || 'Execution error' });
    } finally {
      setIsExecuting(false);
    }
  };

  const pythonSnippet = `import requests

API_KEY = "${apiKey}"
BASE_URL = "http://localhost:8000/api/v1"

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# Query the Hybrid Reasoning Engine
payload = {
    "query": "${playgroundQuery}",
    "mode": "${playgroundMode}",
    "provider": "gemini"
}

response = requests.post(f"{BASE_URL}/intelligence/query", json=payload, headers=headers)
result = response.json()

print(f"Executed in: {result.get('execution_time_ms')}ms")
print(f"Direct Grounded Answer: {result.get('answer')}")
for citation in result.get('citations', []):
    print(f" - [{citation['expert_name']}] {citation['snippet']}")`;

  const curlSnippet = `curl -X POST "http://localhost:8000/api/v1/intelligence/query" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "${playgroundQuery}",
    "mode": "${playgroundMode}"
  }'`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
              <Terminal className="w-3.5 h-3.5" />
              Product A: Hybrid Intelligence API v1
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Developer API & SDK Platform</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Integrate PROJECT ECHO's 5 Core Intelligence Engines into your enterprise systems, scientific pipelines, healthcare applications, or autonomous research workflows.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-mono">v1.0.0-rc1 Healthy</span>
            </div>
          </div>
        </div>

        {/* API Credentials Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
                <Key className="w-4 h-4 text-amber-400" />
                Active Authorization Key
              </div>
              <p className="text-xs text-slate-400">
                Include this key in the <code className="text-blue-300">X-API-Key</code> request header.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs text-amber-300 w-64 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                onClick={() => copyToClipboard(apiKey, 'key')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Copy Key"
              >
                {copiedCode === 'key' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Core Endpoints Reference Tabs */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-3 gap-2 overflow-x-auto">
            <button
              onClick={() => setEndpointTab('query')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                endpointTab === 'query'
                  ? 'bg-slate-900 text-white border-t-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              POST /api/v1/intelligence/query
            </button>
            <button
              onClick={() => setEndpointTab('search')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                endpointTab === 'search'
                  ? 'bg-slate-900 text-white border-t-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              POST /api/v1/knowledge/search
            </button>
            <button
              onClick={() => setEndpointTab('ingest')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                endpointTab === 'ingest'
                  ? 'bg-slate-900 text-white border-t-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              POST /api/v1/knowledge/ingest
            </button>
            <button
              onClick={() => setEndpointTab('discover')}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
                endpointTab === 'discover'
                  ? 'bg-slate-900 text-white border-t-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-teal-400" />
              POST /api/v1/research/discover
            </button>
          </div>

          <div className="p-6">
            {endpointTab === 'query' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Hybrid Reasoning Execution</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Queries the hybrid reasoning core, performing strict grounded retrieval across verified human intelligence and cross-validating with multi-AI coordination.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-slate-400 font-sans font-semibold">Request Body</div>
                    <pre className="text-slate-300 overflow-x-auto">{`{
  "query": "string (required)",
  "mode": "hybrid_intelligence" | "complete_human_intelligence",
  "expert_id": "string (optional)",
  "provider": "gemini" | "openai" | "claude"
}`}</pre>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-slate-400 font-sans font-semibold">Response Structure</div>
                    <pre className="text-slate-300 overflow-x-auto">{`{
  "success": true,
  "execution_time_ms": 28.4,
  "mode_executed": "hybrid_intelligence",
  "answer": "Direct grounded conclusion...",
  "citations": [ ... ],
  "synthesis": { ... }
}`}</pre>
                  </div>
                </div>
              </div>
            )}

            {endpointTab === 'search' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Engine 1: Global Knowledge Retrieval</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Query categorized knowledge items across human, scientific, published, and verified real-world records.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
                  <pre className="text-slate-300">{`POST /api/v1/knowledge/search
{
  "query": "biofilm disruption ultrasound",
  "category": "scientific",
  "limit": 10,
  "min_confidence": 0.8
}`}</pre>
                </div>
              </div>
            )}

            {endpointTab === 'ingest' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Engine 1: Incremental Knowledge Ingestion</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ingest raw clinical or scientific documents with SHA-256 deduplication, automatic semantic chunking, and sparse embeddings.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
                  <pre className="text-slate-300">{`POST /api/v1/knowledge/ingest
{
  "source_name": "Journal of Clinical Investigation 2026",
  "category": "scientific",
  "content_payload": "Detailed study findings...",
  "author_or_contributor": "Dr. Elena Rostova",
  "license": "CC-BY-4.0"
}`}</pre>
                </div>
              </div>
            )}

            {endpointTab === 'discover' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Engine 5: Autonomous Discovery</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Formulate cross-domain hypotheses and experimental protocols from high-level questions.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
                  <pre className="text-slate-300">{`POST /api/v1/research/discover
{
  "research_question": "Can acoustic cavitation disrupt biofilms?",
  "target_domains": ["acoustics", "biomedical_engineering"]
}`}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Interactive API Playground & Code Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Playground Form */}
          <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Live API Testbed
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                POST /api/v1/intelligence/query
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Query Parameter</label>
              <textarea
                value={playgroundQuery}
                onChange={(e) => setPlaygroundQuery(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Execution Mode</label>
              <select
                value={playgroundMode}
                onChange={(e) => setPlaygroundMode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="hybrid_intelligence">Hybrid Intelligence (Default: Human + Multi-AI)</option>
                <option value="complete_human_intelligence">Complete Human Intelligence (Strict Human Grounding Only)</option>
              </select>
            </div>

            <button
              onClick={executePlayground}
              disabled={isExecuting || !playgroundQuery.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold disabled:opacity-50 transition-all cursor-pointer"
            >
              {isExecuting ? (
                <>Executing API Call...</>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send Request
                </>
              )}
            </button>

            {playgroundResponse && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Response Payload</span>
                  {playgroundResponse.execution_time_ms && (
                    <span className="text-emerald-400 font-mono text-[10px]">
                      {playgroundResponse.execution_time_ms} ms
                    </span>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                  <pre>{JSON.stringify(playgroundResponse, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Right: Multi-Language Code Snippets */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Code className="w-4 h-4 text-amber-400" />
                  Python SDK Example
                </div>
                <button
                  onClick={() => copyToClipboard(pythonSnippet, 'python')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white"
                >
                  {copiedCode === 'python' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  Copy Python
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto leading-relaxed max-h-72">
                {pythonSnippet}
              </pre>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  cURL HTTP Request
                </div>
                <button
                  onClick={() => copyToClipboard(curlSnippet, 'curl')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-[10px] text-slate-300 hover:text-white"
                >
                  {copiedCode === 'curl' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  Copy cURL
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-blue-300/90 overflow-x-auto leading-relaxed">
                {curlSnippet}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
