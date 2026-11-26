import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { KnowledgeGraphData } from '../types';
import { InteractiveKnowledgeGraph } from '../components/InteractiveKnowledgeGraph';
import { FeatureHeader } from '../components/FeatureInfoModal';

export const KnowledgeGraphPage: React.FC = () => {
  const [data, setData] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getGraphData();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Feature Explanation & Demo Stage Header */}
      <FeatureHeader featureKey="graph" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#00D9FF]/15">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">INTERACTIVE KNOWLEDGE GRAPH</h1>
          <p className="text-xs text-[#9FB2CA] mt-1">
            Topological network connecting human experts, flight projects, Decision DNA, empirical evidence, and verified heuristics.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#00D9FF]">
          <span className="w-2 h-2 rounded-full bg-[#00E6A0] animate-ping" />
          <span>GRAPH ENGINE LIVE • FORCE-DIRECTED PHYSICS</span>
        </div>
      </div>

      {/* Main Interactive Canvas Graph */}
      {loading ? (
        <div className="h-[600px] rounded-2xl glass-panel flex items-center justify-center font-mono text-[#00D9FF]">
          Synthesizing Knowledge Topology...
        </div>
      ) : data ? (
        <InteractiveKnowledgeGraph data={data} />
      ) : (
        <div className="h-[600px] rounded-2xl glass-panel flex items-center justify-center text-red-400">
          Failed to load graph nodes.
        </div>
      )}
    </div>
  );
};
