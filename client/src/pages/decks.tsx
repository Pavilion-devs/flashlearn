import React, { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Deck } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DeckCard } from "@/components/dashboard/deck-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDeckSchema } from "@shared/schema";
import { z } from "zod";
import { 
  Plus, 
  Loader2, 
  Search, 
  BookOpen, 
  Globe, 
  PenSquare, 
  Trash2,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Extend the insertDeckSchema with custom validation
const deckFormSchema = insertDeckSchema
  .omit({ userId: true })
  .extend({
    color: z.enum(["primary", "secondary", "accent"]).default("primary"),
  });

type DeckFormValues = z.infer<typeof deckFormSchema>;

export default function Decks() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingDeckId, setDeletingDeckId] = useState<number | null>(null);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Fetch user's decks
  const { 
    data: decks, 
    isLoading: decksLoading,
    refetch: refetchDecks
  } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch decks");
      return await res.json();
    },
  });
  
  // Fetch public decks
  const { 
    data: publicDecks, 
    isLoading: publicDecksLoading,
    refetch: refetchPublicDecks
  } = useQuery<Deck[]>({
    queryKey: ["/api/decks/public"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch public decks");
      return await res.json();
    },
  });
  
  // Create deck form
  const createForm = useForm<DeckFormValues>({
    resolver: zodResolver(deckFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "primary",
      isPublic: false,
    },
  });
  
  // Edit deck form
  const editForm = useForm<DeckFormValues>({
    resolver: zodResolver(deckFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "primary",
      isPublic: false,
    },
  });
  
  // Set edit form values when editing deck changes
  React.useEffect(() => {
    if (editingDeck) {
      editForm.reset({
        name: editingDeck.name,
        description: editingDeck.description || "",
        color: editingDeck.color as "primary" | "secondary" | "accent" || "primary",
        isPublic: editingDeck.isPublic,
      });
    }
  }, [editingDeck, editForm]);
  
  // Create deck mutation
  const createDeckMutation = useMutation({
    mutationFn: async (values: DeckFormValues) => {
      const res = await apiRequest("POST", "/api/decks", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Deck created",
        description: "Your deck has been created successfully",
      });
      setCreateDialogOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create deck",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update deck mutation
  const updateDeckMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number, values: DeckFormValues }) => {
      const res = await apiRequest("PUT", `/api/decks/${id}`, values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Deck updated",
        description: "Your deck has been updated successfully",
      });
      setEditDialogOpen(false);
      setEditingDeck(null);
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/decks/public"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update deck",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete deck mutation
  const deleteDeckMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/decks/${id}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Deck deleted",
        description: "Your deck has been deleted successfully",
      });
      setDeletingDeckId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/decks/public"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete deck",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle create form submission
  const onCreateSubmit = (values: DeckFormValues) => {
    createDeckMutation.mutate(values);
  };
  
  // Handle edit form submission
  const onEditSubmit = (values: DeckFormValues) => {
    if (editingDeck) {
      updateDeckMutation.mutate({ id: editingDeck.id, values });
    }
  };
  
  // Filter decks based on search query
  const filterDecks = (deckList: Deck[] | undefined) => {
    if (!deckList) return [];
    if (!searchQuery.trim()) return deckList;
    
    return deckList.filter(deck => 
      deck.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (deck.description && deck.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  };
  
  const filteredDecks = filterDecks(decks);
  const filteredPublicDecks = filterDecks(publicDecks);
  
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
                  Flashcard Decks
                </h1>
                <p className="text-neutral-500">Manage and browse your learning decks</p>
              </div>
              <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="inline-flex items-center">
                      <Plus size={16} className="mr-2" />
                      Create Deck
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Deck</DialogTitle>
                      <DialogDescription>
                        Create a new flashcard deck to organize your learning materials.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...createForm}>
                      <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                        <FormField
                          control={createForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Deck Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter deck name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={createForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter deck description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={createForm.control}
                          name="color"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Deck Color</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a color" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="primary">Blue</SelectItem>
                                  <SelectItem value="secondary">Red</SelectItem>
                                  <SelectItem value="accent">Yellow</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={createForm.control}
                          name="isPublic"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Public Deck</FormLabel>
                                <FormDescription>
                                  Make this deck available to all users
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={createDeckMutation.isPending}
                          >
                            {createDeckMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              "Create Deck"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search decks..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Tabs defaultValue="my-decks">
              <TabsList className="mb-4">
                <TabsTrigger value="my-decks" className="flex items-center">
                  <BookOpen size={16} className="mr-2" />
                  My Decks
                </TabsTrigger>
                <TabsTrigger value="public-decks" className="flex items-center">
                  <Globe size={16} className="mr-2" />
                  Public Decks
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="my-decks">
                {decksLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-40 w-full rounded-xl" />
                    ))}
                  </div>
                ) : filteredDecks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDecks.map((deck) => (
                      <div key={deck.id} className="relative group">
                        <DeckCard 
                          id={deck.id}
                          name={deck.name}
                          description={deck.description || ""}
                          cardCount={deck.cardCount || 0}
                          color={deck.color || "primary"}
                          lastStudied={deck.lastStudied ? "Last studied yesterday" : "Not studied yet"}
                          status={deck.isPublic ? "Public" : undefined}
                        />
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex space-x-1">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 bg-white border border-neutral-200"
                              onClick={() => {
                                setEditingDeck(deck);
                                setEditDialogOpen(true);
                              }}
                            >
                              <PenSquare size={14} />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 bg-white border border-neutral-200 hover:bg-destructive hover:text-white"
                              onClick={() => setDeletingDeckId(deck.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-neutral-200 rounded-xl p-6 text-center">
                    <p className="text-neutral-500 mb-4">
                      {searchQuery.trim() 
                        ? "No decks match your search. Try a different query."
                        : "You don't have any decks yet. Create your first deck to start learning!"}
                    </p>
                    {!searchQuery.trim() && (
                      <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus size={16} className="mr-2" />
                        Create Your First Deck
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="public-decks">
                {publicDecksLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-40 w-full rounded-xl" />
                    ))}
                  </div>
                ) : filteredPublicDecks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPublicDecks.map((deck) => (
                      <DeckCard 
                        key={deck.id}
                        id={deck.id}
                        name={deck.name}
                        description={deck.description || ""}
                        cardCount={deck.cardCount || 0}
                        color={deck.color || "primary"}
                        lastStudied="Public deck"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-neutral-200 rounded-xl p-6 text-center">
                    <p className="text-neutral-500 mb-4">
                      {searchQuery.trim()
                        ? "No public decks match your search. Try a different query."
                        : "No public decks are available yet."}
                    </p>
                    <Button variant="outline" onClick={() => refetchPublicDecks()}>
                      <RefreshCw size={16} className="mr-2" />
                      Refresh
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      <MobileNav />
      
      {/* Edit Deck Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Deck</DialogTitle>
            <DialogDescription>
              Update your flashcard deck information.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deck Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter deck name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter deck description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deck Color</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a color" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="primary">Blue</SelectItem>
                        <SelectItem value="secondary">Red</SelectItem>
                        <SelectItem value="accent">Yellow</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Public Deck</FormLabel>
                      <FormDescription>
                        Make this deck available to all users
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingDeck(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateDeckMutation.isPending}
                >
                  {updateDeckMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletingDeckId !== null} onOpenChange={(open) => !open && setDeletingDeckId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this deck and all of its flashcards. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingDeckId !== null) {
                  deleteDeckMutation.mutate(deletingDeckId);
                }
              }}
              disabled={deleteDeckMutation.isPending}
            >
              {deleteDeckMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Deck"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
