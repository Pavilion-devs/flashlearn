import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCog, BookOpen, ShieldCheck } from "lucide-react";

export default function Admin() {
  const { toast } = useToast();
  
  // Fetch users
  const { 
    data: users, 
    isLoading: usersLoading, 
    refetch: refetchUsers 
  } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return await res.json();
    },
  });
  
  // Fetch decks
  const { 
    data: decks, 
    isLoading: decksLoading, 
    refetch: refetchDecks 
  } = useQuery({
    queryKey: ["/api/admin/decks"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch decks");
      return await res.json();
    },
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "User has been updated successfully",
      });
      refetchUsers();
    },
    onError: (error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update deck mutation
  const updateDeckMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/decks/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Deck updated",
        description: "Deck has been updated successfully",
      });
      refetchDecks();
    },
    onError: (error) => {
      toast({
        title: "Failed to update deck",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Toggle user admin status
  const toggleUserAdmin = (userId: number, currentStatus: boolean) => {
    updateUserMutation.mutate({
      id: userId,
      data: { isAdmin: !currentStatus }
    });
  };
  
  // Toggle deck public status
  const toggleDeckPublic = (deckId: number, currentStatus: boolean) => {
    updateDeckMutation.mutate({
      id: deckId,
      data: { isPublic: !currentStatus }
    });
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="flex flex-col h-screen">
      <MobileHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50 pb-16 md:pb-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-poppins font-semibold mb-1">
                Admin Dashboard
              </h1>
              <p className="text-neutral-500">Manage users and content</p>
            </div>
            
            <Tabs defaultValue="users">
              <TabsList className="mb-4">
                <TabsTrigger value="users" className="flex items-center">
                  <UserCog size={16} className="mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="decks" className="flex items-center">
                  <BookOpen size={16} className="mr-2" />
                  Decks
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <UserCog size={18} className="mr-2" />
                      User Management
                    </CardTitle>
                    <CardDescription>
                      Manage user accounts and permissions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {usersLoading ? (
                      <div className="flex justify-center p-6">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : users && users.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Username</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Stats</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Admin</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.map((user: any) => (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.id}</TableCell>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>{user.name || "-"}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span><strong>XP:</strong> {user.xp}</span>
                                    <span><strong>Streak:</strong> {user.streak}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{formatDate(user.createdAt)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    {user.isAdmin ? (
                                      <Badge variant="default" className="bg-success">
                                        <ShieldCheck size={12} className="mr-1" />
                                        Admin
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">Regular</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={user.isAdmin}
                                      onCheckedChange={() => toggleUserAdmin(user.id, user.isAdmin)}
                                      disabled={updateUserMutation.isPending}
                                    />
                                    <span className="text-xs text-neutral-500">
                                      {user.isAdmin ? "Remove Admin" : "Make Admin"}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center p-6 bg-muted/10 rounded-md">
                        <p className="text-neutral-500">No users found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="decks">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen size={18} className="mr-2" />
                      Deck Management
                    </CardTitle>
                    <CardDescription>
                      Manage flashcard decks across the platform.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {decksLoading ? (
                      <div className="flex justify-center p-6">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : decks && decks.length > 0 ? (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Owner ID</TableHead>
                              <TableHead>Cards</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Public</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {decks.map((deck: any) => (
                              <TableRow key={deck.id}>
                                <TableCell className="font-medium">{deck.id}</TableCell>
                                <TableCell>{deck.name}</TableCell>
                                <TableCell>{deck.userId}</TableCell>
                                <TableCell>{deck.cardCount}</TableCell>
                                <TableCell>{formatDate(deck.createdAt)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    {deck.isPublic ? (
                                      <Badge variant="default" className="bg-accent text-accent-foreground">
                                        Public
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">Private</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={deck.isPublic}
                                      onCheckedChange={() => toggleDeckPublic(deck.id, deck.isPublic)}
                                      disabled={updateDeckMutation.isPending}
                                    />
                                    <span className="text-xs text-neutral-500">
                                      {deck.isPublic ? "Make Private" : "Make Public"}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center p-6 bg-muted/10 rounded-md">
                        <p className="text-neutral-500">No decks found</p>
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
