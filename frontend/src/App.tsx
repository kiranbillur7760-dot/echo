import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { ExpertsPage } from './pages/ExpertsPage';
import { ExpertDetailPage } from './pages/ExpertDetailPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { DecisionIntelligencePage } from './pages/DecisionIntelligencePage';
import { KnowledgeGraphPage } from './pages/KnowledgeGraphPage';
import { ExperienceSimulationPage } from './pages/ExperienceSimulationPage';
import { AskEchoPage } from './pages/AskEchoPage';
import { LearningPlatformPage } from './pages/LearningPlatformPage';
import { KnowledgeEvolutionPage } from './pages/KnowledgeEvolutionPage';
import { EchoNetworkPage } from './pages/EchoNetworkPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { EchoMirrorPage } from './pages/EchoMirrorPage';
import { SelfReflectionPage } from './pages/SelfReflectionPage';
import { SelfEvolutionPage } from './pages/SelfEvolutionPage';
import { ExistenceLaboratoryPage } from './pages/ExistenceLaboratoryPage';
import { CouncilOfExpertsPage } from './pages/CouncilOfExpertsPage';
import { DecisionTimeMachinePage } from './pages/DecisionTimeMachinePage';
import { CreateExpertStudioPage } from './pages/CreateExpertStudioPage';
import { ConversationsPage } from './pages/ConversationsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<OverviewPage />} />
          <Route path="experts" element={<ExpertsPage />} />
          <Route path="experts/:id" element={<ExpertDetailPage />} />
          <Route path="create-expert" element={<CreateExpertStudioPage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="decisions" element={<DecisionIntelligencePage />} />
          <Route path="council" element={<CouncilOfExpertsPage />} />
          <Route path="time-machine" element={<DecisionTimeMachinePage />} />
          <Route path="graph" element={<KnowledgeGraphPage />} />
          <Route path="simulation" element={<ExperienceSimulationPage />} />
          <Route path="ask-echo" element={<AskEchoPage />} />
          <Route path="conversations" element={<ConversationsPage />} />
          <Route path="learning" element={<LearningPlatformPage />} />
          <Route path="evolution" element={<KnowledgeEvolutionPage />} />
          <Route path="network" element={<EchoNetworkPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="mirror" element={<EchoMirrorPage />} />
          <Route path="reflection" element={<SelfReflectionPage />} />
          <Route path="self-evolution" element={<SelfEvolutionPage />} />
          <Route path="existence" element={<ExistenceLaboratoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
