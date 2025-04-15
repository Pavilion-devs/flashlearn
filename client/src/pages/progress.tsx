import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Loader2, LineChart, CalendarClock, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { StreakIcon } from "@/components/icons";
import { format, subDays, differenceInDays } from "date-fns";

// Chart color constants
const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

// Helper function to format date
const formatDate = (dateString: string | number | Date) => {
  if (!dateString) return "";
  return format(new Date(dateString), "MMM d");
};

export default function Progress() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "all">("7days");
  
  // Fetch user's quiz attempts
  const { 
    data: quizHistory, 
    isLoading: historyLoading 
  } = useQuery({
    queryKey: ["/api/quizzes/history"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch quiz history");
      return await res.json();
    },
  });
  
  // Fetch user's stats
  const { 
    data: stats, 
    isLoading: statsLoading 
  } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return await res.json();
    },
  });
  
  // Fetch user's decks
  const { 
    data: decks, 
    isLoading: decksLoading 
  } = useQuery({
    queryKey: ["/api/decks"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch decks");
      return await res.json();
    },
  });
  
  // Filter stats based on time range
  const filterByTimeRange = (data: any[]) => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    
    switch (timeRange) {
      case "7days":
        return data.filter(item => {
          const itemDate = new Date(item.date);
          return differenceInDays(now, itemDate) <= 7;
        });
      case "30days":
        return data.filter(item => {
          const itemDate = new Date(item.date);
          return differenceInDays(now, itemDate) <= 30;
        });
      case "all":
      default:
        return data;
    }
  };
  
  // Prepare daily activity data
  const getDailyActivityData = () => {
    if (!stats || stats.length === 0) return [];
    
    const filteredStats = filterByTimeRange(stats);
    const sortedStats = [...filteredStats].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return sortedStats.map(stat => ({
      date: formatDate(stat.date),
      Cards: stat.cardsReviewed || 0,
      XP: stat.xpEarned || 0
    }));
  };
  
  // Prepare quiz performance data
  const getQuizPerformanceData = () => {
    if (!quizHistory || quizHistory.length === 0) return [];
    
    const filteredHistory = filterByTimeRange(quizHistory);
    
    // Group and average by quiz type
    const quizTypeData: Record<string, { count: number, totalScore: number }> = {};
    
    filteredHistory.forEach((quiz: any) => {
      const type = quiz.quizType;
      const score = Math.round((quiz.score / quiz.totalQuestions) * 100);
      
      if (!quizTypeData[type]) {
        quizTypeData[type] = { count: 0, totalScore: 0 };
      }
      
      quizTypeData[type].count += 1;
      quizTypeData[type].totalScore += score;
    });
    
    // Convert to array and calculate averages
    return Object.entries(quizTypeData).map(([type, data]) => ({
      name: type === "multiple-choice" ? "Multiple Choice" : 
            type === "typing" ? "Typing" : "Listening",
      value: Math.round(data.totalScore / data.count)
    }));
  };
  
  // Prepare deck usage data
  const getDeckUsageData = () => {
    if (!quizHistory || quizHistory.length === 0 || !decks || decks.length === 0) return [];
    
    const filteredHistory = filterByTimeRange(quizHistory);
    
    // Count quiz attempts per deck
    const deckCounts: Record<number, number> = {};
    
    filteredHistory.forEach((quiz: any) => {
      if (!deckCounts[quiz.deckId]) {
        deckCounts[quiz.deckId] = 0;
      }
      deckCounts[quiz.deckId] += 1;
    });
    
    // Get deck names and create data for chart
    const deckData = Object.entries(deckCounts)
      .map(([deckId, count]) => {
        const deck = decks.find((d: any) => d.id === Number(deckId));
        return {
          name: deck ? deck.name : `Deck ${deckId}`,
          value: count
        };
      })
      // Sort by usage count (highest first)
      .sort((a, b) => b.value - a.value)
      // Limit to top 5 decks
      .slice(0, 5);
    
    return deckData;
  };
  
  const activityData = getDailyActivityData();
  const performanceData = getQuizPerformanceData();
  const deckUsageData = getDeckUsageData();
  
  const isLoading = historyLoading || statsLoading || decksLoading;
  
  return (
    <div className="flex flex-col h-screen">
      <MobileHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50 pb-16 md:pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-poppins font-semibold mb-1">
                  Learning Progress
                </h1>
                <p className="text-neutral-500">Track your learning journey statistics</p>
              </div>
              <div className="mt-4 md:mt-0">
                <Select 
                  value={timeRange} 
                  onValueChange={(value) => setTimeRange(value as any)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-neutral-500 text-sm">Current Streak</p>
                      <h3 className="text-3xl font-bold">{user?.streak || 0} days</h3>
                    </div>
                    <div className="p-3 bg-secondary-50 rounded-full">
                      <div className="text-secondary-500">
                        <i className="ri-fire-fill text-2xl"></i>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-neutral-500 text-sm">Total XP</p>
                      <h3 className="text-3xl font-bold">{user?.xp || 0}</h3>
                    </div>
                    <div className="p-3 bg-primary-50 rounded-full">
                      <div className="text-primary">
                        <i className="ri-award-line text-2xl"></i>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-neutral-500 text-sm">Cards Reviewed</p>
                      <h3 className="text-3xl font-bold">
                        {stats && stats.length > 0
                          ? stats.reduce((total, stat) => total + (stat.cardsReviewed || 0), 0)
                          : 0}
                      </h3>
                    </div>
                    <div className="p-3 bg-accent-50 rounded-full">
                      <div className="text-accent">
                        <i className="ri-flashcard-line text-2xl"></i>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="activity">
              <TabsList className="mb-4">
                <TabsTrigger value="activity" className="flex items-center">
                  <LineChart size={16} className="mr-2" />
                  Daily Activity
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center">
                  <BarChart3 size={16} className="mr-2" />
                  Quiz Performance
                </TabsTrigger>
                <TabsTrigger value="usage" className="flex items-center">
                  <PieChartIcon size={16} className="mr-2" />
                  Deck Usage
                </TabsTrigger>
              </TabsList>
              
              {/* Daily Activity Chart */}
              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CalendarClock className="mr-2 h-5 w-5" />
                      Daily Learning Activity
                    </CardTitle>
                    <CardDescription>
                      Track your daily flashcard reviews and XP earned over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : activityData.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={activityData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis yAxisId="left" orientation="left" stroke={COLORS[0]} />
                            <YAxis yAxisId="right" orientation="right" stroke={COLORS[1]} />
                            <Tooltip />
                            <Legend />
                            <Bar yAxisId="left" dataKey="Cards" fill={COLORS[0]} name="Cards Reviewed" />
                            <Bar yAxisId="right" dataKey="XP" fill={COLORS[1]} name="XP Earned" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-16 text-neutral-500">
                        <p>No activity data available for the selected time period.</p>
                        <p className="text-sm mt-2">Start reviewing flashcards to see your progress!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Quiz Performance Chart */}
              <TabsContent value="performance">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5" />
                      Quiz Performance
                    </CardTitle>
                    <CardDescription>
                      Average score by quiz type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : performanceData.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={performanceData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis dataKey="name" type="category" width={120} />
                            <Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} />
                            <Bar dataKey="value" name="Accuracy" radius={[0, 4, 4, 0]}>
                              {performanceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-16 text-neutral-500">
                        <p>No quiz performance data available for the selected time period.</p>
                        <p className="text-sm mt-2">Complete quizzes to see your performance!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Deck Usage Chart */}
              <TabsContent value="usage">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChartIcon className="mr-2 h-5 w-5" />
                      Deck Usage
                    </CardTitle>
                    <CardDescription>
                      Most frequently practiced decks
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : deckUsageData.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={deckUsageData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              outerRadius={120}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                              {deckUsageData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} quizzes`, "Usage"]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-16 text-neutral-500">
                        <p>No deck usage data available for the selected time period.</p>
                        <p className="text-sm mt-2">Take quizzes with different decks to see usage statistics!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
