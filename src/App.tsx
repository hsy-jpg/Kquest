import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import MobileLayout from "./components/MobileLayout";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Quests from "./pages/Quests";
import Community from "./pages/Community";
import GroupChat from "./pages/GroupChat";
import JoinGroup from "./pages/JoinGroup";
import InviteFriends from "./pages/InviteFriends";
import Profile from "./pages/Profile";
import QuestDetail from "./pages/QuestDetail";
import QuestPlay from "./pages/QuestPlay";
import PhotoVerify from "./pages/PhotoVerify";
import QuestReview from "./pages/QuestReview";
import Login from "./pages/Login";
import JournalEntryPage from "./pages/JournalEntry";
import PublicProfile from "./pages/PublicProfile";
import NotFound from "./pages/NotFound";
import Splash from "./components/Splash";
import PersonalizationGate from "./components/PersonalizationGate";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <Splash onDone={() => setShowSplash(false)} />}
        <BrowserRouter>
          <PersonalizationGate ready={!showSplash} />
          <MobileLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/quests" element={<Quests />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/community" element={<Community />} />
              <Route path="/community/chat" element={<GroupChat />} />
              <Route path="/community/chat/:groupId" element={<GroupChat />} />
              <Route path="/community/groups" element={<JoinGroup />} />
              <Route path="/community/invite" element={<InviteFriends />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/journal/:id" element={<JournalEntryPage />} />
              <Route path="/traveler/:userId" element={<PublicProfile />} />
              <Route path="/quest/:id" element={<QuestDetail />} />
              <Route path="/quest/:id/play" element={<QuestPlay />} />
              <Route path="/quest/:id/verify" element={<PhotoVerify />} />
              <Route path="/quest/:id/review" element={<QuestReview />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MobileLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
