import React, { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Decks from "@/pages/decks";
import CreateFlashcard from "@/pages/create-flashcard";
import StudyDeck from "@/pages/study-deck";
import Quiz from "@/pages/quiz";
import Progress from "@/pages/progress";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import { ProtectedRoute, AdminRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";

// Create a component to handle routing logic
function RouterWithAuth() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Redirect to auth page if not logged in
  useEffect(() => {
    if (!isLoading && !user && location !== "/auth") {
      setLocation("/auth");
    }
  }, [user, isLoading, location, setLocation]);

  // Redirect to dashboard if logged in and on auth page
  useEffect(() => {
    if (!isLoading && user && location === "/auth") {
      setLocation("/");
    }
  }, [user, isLoading, location, setLocation]);

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/decks" component={Decks} />
      <Route path="/create-flashcard" component={CreateFlashcard} />
      <Route path="/study-deck/:id" component={StudyDeck} />
      <Route path="/quiz/:type?" component={Quiz} />
      <Route path="/progress" component={Progress} />
      <Route path="/profile" component={Profile} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <RouterWithAuth />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
