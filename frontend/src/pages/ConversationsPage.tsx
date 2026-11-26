import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ConversationSummary } from '../types';
import {
  MessagesSquare,
  Mic,
  MessageSquare,
  Trash2,
  ArrowRight,
  Database,
  Cpu,
  Clock,
} from 'lucide-react';

export const ConversationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadList = async () => {
    setLoading(true);
    try {
      const rows = await api.listConversations();
      setConversations(rows);
      if (rows.length > 0 && !selected) {
        const detail = await api.getConversation(rows[0].id);
        setSelected(detail);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleSelect = async (id: number) => {
    try {
      const detail = await api.getConversation(id);
      setSelected(detail);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.deleteConversation(id);
    if (selected?.id === id) setSelected(null);
    await loadList();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#00D9FF]/15">
        <div>
          <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2.5">
            <MessagesSquare className="w-6 h-6 text-[#00D9FF]" />
            CONVERSATIONS &amp; AUDIT TRAIL
          </h1>
          <p className="text-xs text-[#9FB2CA] mt-1">
            Persistent voice and text conversations with full AI model run logs and supporting evidence links.
          </p>
        </div>

        <button
          onClick={() => navigate('/ask-echo')}
          className="px-4 py-2 rounded-xl btn-cyber-primary text-xs uppercase tracking-wider font-bold flex items-center gap-2 self-start"
        >
          <span>New Conversation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation List */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-[#00D9FF] uppercase tracking-wider">
            Saved Sessions ({conversations.length})
          </div>
          {loading ? (
            <div className="p-6 rounded-2xl glass-panel text-xs font-mono text-[#9FB2CA]">Loading sessions...</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 rounded-2xl glass-panel text-xs text-[#9FB2CA]">
              No saved conversations yet. Start one in Ask ECHO or on any Expert profile.
            </div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelect(c.id)}
                className={`p-4 rounded-2xl glass-panel cursor-pointer transition border ${
                  selected?.id === c.id ? 'border-[#00D9FF] bg-[#00D9FF]/10' : 'border-white/10 hover:border-[#00D9FF]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {c.is_voice ? (
                      <Mic className="w-3.5 h-3.5 text-[#00E6A0]" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 text-[#00D9FF]" />
                    )}
                    <span className="text-[10px] font-mono uppercase text-purple-300">
                      {c.mode.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(c.id, e)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="text-sm font-bold text-white mt-1.5 line-clamp-1">{c.title}</h3>
                <p className="text-[11px] text-[#00D9FF] mt-0.5">{c.expert_name}</p>
                <p className="text-[11px] text-[#9FB2CA] line-clamp-2 mt-1">{c.last_preview}</p>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2 pt-2 border-t border-white/5">
                  <span>{c.message_count} messages</span>
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Thread Inspector */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="p-6 rounded-2xl glass-panel border border-[#00D9FF]/20 space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono text-[#00D9FF] uppercase">
                    Conversation #{selected.id} • {selected.expert_name}
                  </span>
                  <h2 className="text-lg font-bold text-white mt-0.5">{selected.title}</h2>
                </div>
                <button
                  onClick={() => navigate(`/ask-echo?conversationId=${selected.id}${selected.expert_id ? `&expertId=${selected.expert_id}` : ''}`)}
                  className="px-3.5 py-2 rounded-xl btn-cyber-secondary text-xs font-mono font-bold flex items-center gap-1.5"
                >
                  Resume in Ask ECHO <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {selected.messages.map((m: any) => (
                  <div
                    key={m.id}
                    className={`p-4 rounded-xl border ${
                      m.sender === 'user'
                        ? 'bg-[#00D9FF]/10 border-[#00D9FF]/30 ml-8'
                        : 'bg-[#020713]/80 border-white/10 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#9FB2CA] mb-2">
                      <span className={m.sender === 'user' ? 'text-[#00D9FF] font-bold' : 'text-purple-300 font-bold'}>
                        {m.sender === 'user' ? 'USER' : 'ECHO RESPONSE'} {m.voice_used ? '(VOICE)' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(m.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-100 leading-relaxed whitespace-pre-line">{m.content}</p>

                    {m.ai_runs && m.ai_runs.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-white/5 flex flex-wrap gap-2">
                        {m.ai_runs.map((r: any, idx: number) => (
                          <span
                            key={idx}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 ${
                              r.status === 'success'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            <Cpu className="w-3 h-3" />
                            {r.provider_name} ({r.model}) • {r.status} ({r.latency_ms}ms)
                          </span>
                        ))}
                      </div>
                    )}

                    {m.evidence_links && m.evidence_links.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                        <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                          <Database className="w-3 h-3" /> Evidence Links ({m.evidence_links.length}):
                        </span>
                        {m.evidence_links.map((el: any, i: number) => (
                          <div key={i} className="text-[11px] text-slate-300">
                            • [{el.source_type}] <strong>{el.source_title}</strong> ({el.expert_name})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl glass-panel text-center text-xs text-[#9FB2CA]">
              Select a conversation on the left to inspect its messages, AI provider runs, and evidence provenance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
