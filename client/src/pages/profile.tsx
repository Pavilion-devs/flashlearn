import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Avatar, StreakIcon } from "@/components/icons";
import { 
  UserCircle,
  Trophy,
  Calendar,
  Hash,
  Mail,
  Edit,
  Save,
  ArrowRight,
  AlertCircle,
  Loader2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

// User profile form schema
const profileFormSchema = z.object({
  name: z.string().optional(),
  dailyGoal: z.coerce.number().min(1, "Goal must be at least 1").max(100, "Goal cannot exceed 100"),
});

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showResetStreak, setShowResetStreak] = useState(false);
  
  // Profile form
  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      dailyGoal: user?.daily_goal || 20,
    },
  });
  
  // Reset form values when user changes
  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name || "",
        dailyGoal: user.daily_goal || 20,
      });
    }
  }, [user, form]);
  
  // Fetch quiz history
  const { 
    data: quizHistory, 
    isLoading: historyLoading 
  } = useQuery({
    queryKey: ["/api/quizzes/history"],
  });
  
  // Fetch stats
  const { 
    data: stats, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ["/api/stats"],
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      const res = await apiRequest("PUT", `/api/user`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Reset streak mutation
  const resetStreakMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/user`, { streak: 0 });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Streak reset",
        description: "Your streak has been reset to 0",
      });
      setShowResetStreak(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to reset streak",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(values);
  };
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Calculate stats
  const getStats = () => {
    if (!quizHistory || !Array.isArray(quizHistory) || quizHistory.length === 0) {
      return {
        totalQuizzes: 0,
        avgScore: 0,
        bestScore: 0,
      };
    }
    
    const totalQuizzes = quizHistory.length;
    let totalScorePercent = 0;
    let bestScore = 0;
    
    quizHistory.forEach((quiz: any) => {
      const scorePercent = Math.round((quiz.score / quiz.total_questions) * 100);
      totalScorePercent += scorePercent;
      bestScore = Math.max(bestScore, scorePercent);
    });
    
    const avgScore = Math.round(totalScorePercent / totalQuizzes);
    
    return {
      totalQuizzes,
      avgScore,
      bestScore,
    };
  };
  
  const userStats = getStats();
  
  return (
    <div className="flex flex-col h-screen">
      <MobileHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50 pb-16 md:pb-6">
          <div className="mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-poppins font-semibold mb-1">
                User Profile
              </h1>
              <p className="text-neutral-500">Manage your account and settings</p>
            </div>
            
            {/* Profile Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <UserCircle className="mr-2 h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    View and update your account details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Display Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
                              </FormControl>
                              <FormDescription>
                                This name will be displayed throughout the app
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="dailyGoal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Daily Flashcard Goal</FormLabel>
                              <FormControl>
                                <Input type="number" min={1} max={100} {...field} />
                              </FormControl>
                              <FormDescription>
                                Number of flashcards you aim to review each day
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end space-x-2 pt-2">
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false);
                              form.reset({
                                name: user?.name || "",
                                dailyGoal: user?.daily_goal || 20,
                              });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit"
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-neutral-500 mr-2" />
                          <span className="text-sm text-neutral-500">Username:</span>
                        </div>
                        <span className="font-medium">{user?.username}</span>
                      </div>
                      
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center">
                          <UserCircle className="h-4 w-4 text-neutral-500 mr-2" />
                          <span className="text-sm text-neutral-500">Display Name:</span>
                        </div>
                        <span className="font-medium">{user?.name || "Not set"}</span>
                      </div>
                      
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-neutral-500 mr-2" />
                          <span className="text-sm text-neutral-500">Member Since:</span>
                        </div>
                        <span className="font-medium">{formatDate(user?.created_at)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center">
                          <Hash className="h-4 w-4 text-neutral-500 mr-2" />
                          <span className="text-sm text-neutral-500">Daily Goal:</span>
                        </div>
                        <span className="font-medium">{user?.daily_goal || 20} flashcards</span>
                      </div>
                      
                      <div className="flex justify-end pt-2">
                        <Button 
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Profile
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <Trophy className="mr-2 h-5 w-5" />
                    Achievement Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-2">
                    <div className="flex justify-center mb-2">
                      <div className="w-20 h-20 rounded-full bg-neutral-200 mb-3">
                        <Avatar alt={user?.name || user?.username || "User"} className="h-20 w-20" />
                      </div>
                    </div>
                    <h3 className="font-medium text-lg">
                      {user?.name || user?.username}
                    </h3>
                    <div className="flex items-center justify-center mt-1 space-x-1">
                      <span className="text-secondary-400 text-xl font-semibold">
                        {user?.streak || 0}
                      </span>
                      <i className="ri-fire-fill text-secondary-400"></i>
                      <span className="text-neutral-500 text-sm ml-1">day streak</span>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">Total XP:</span>
                      <span className="font-semibold">{user?.xp || 0} XP</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">Quizzes Taken:</span>
                      <span className="font-semibold">{userStats.totalQuizzes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">Avg. Quiz Score:</span>
                      <span className="font-semibold">{userStats.avgScore}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">Best Score:</span>
                      <span className="font-semibold">{userStats.bestScore}%</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-center">
                  <AlertDialog open={showResetStreak} onOpenChange={setShowResetStreak}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Reset Streak
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset your streak?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will reset your current streak to zero. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => resetStreakMutation.mutate()}
                          disabled={resetStreakMutation.isPending}
                        >
                          {resetStreakMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Resetting...
                            </>
                          ) : (
                            "Reset Streak"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            </div>
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your recent quiz attempts and learning sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : quizHistory && Array.isArray(quizHistory) && quizHistory.length > 0 ? (
                  <div className="space-y-4">
                    {quizHistory.slice(0, 5).map((quiz: any, index: number) => (
                      <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                        <div>
                          <div className="font-medium">
                            {quiz.quiz_type === "multiple-choice" ? "Multiple Choice Quiz" :
                             quiz.quiz_type === "typing" ? "Typing Quiz" : "Listening Quiz"}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {formatDate(quiz.created_at)}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="text-right mr-4">
                            <div className="font-medium">
                              {quiz.score}/{quiz.total_questions}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {Math.round((quiz.score / quiz.total_questions) * 100)}%
                            </div>
                          </div>
                          <ArrowRight size={16} className="text-neutral-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-muted/10 rounded-md">
                    <p className="text-neutral-500">No quiz history available yet. Start practicing to see your activity!</p>
                    <Link href="/quiz">
                      <Button variant="outline" className="mt-4">
                        Start a Quiz
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
