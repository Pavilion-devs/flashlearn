import { Switch, Route } from "wouter";
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

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/decks" component={Decks} />
      <ProtectedRoute path="/create-flashcard" component={CreateFlashcard} />
      <ProtectedRoute path="/study-deck/:id" component={StudyDeck} />
      <ProtectedRoute path="/quiz/:type?" component={Quiz} />
      <ProtectedRoute path="/progress" component={Progress} />
      <ProtectedRoute path="/profile" component={Profile} />
      <AdminRoute path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
