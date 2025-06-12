import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { InsertFlashcard, Deck } from "@shared/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";

// Basic flashcard validation schema
const flashcardSchema = z.object({
  deck_id: z.number(),
  front: z.string().min(1, "Front text is required"),
  back: z.string().min(1, "Back text is required"),
  part_of_speech: z.string().optional(),
  example_sentence: z.string().optional(),
  audio_url: z.string().optional(),
});

export function CreateFlashcardForm() {
  const { toast } = useToast();
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  // Get user's decks
  const { data: decks, isLoading: decksLoading } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
  });
  
  // Define form
  const form = useForm<z.infer<typeof flashcardSchema>>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: {
      deck_id: undefined,
      front: "",
      back: "",
      part_of_speech: "",
      example_sentence: "",
      audio_url: "",
    },
  });
  
  // Create flashcard mutation
  const createFlashcard = useMutation({
    mutationFn: async (values: z.infer<typeof flashcardSchema>) => {
      // Handle audio upload if present
      let audioUrl = values.audio_url;
      
      if (audioFile) {
        // In a real app, we would implement file upload to a storage service
        // For this MVP, we're just using the file name as a placeholder
        audioUrl = `/audio/${audioFile.name}`;
      }
      
      const flashcardData = {
        ...values,
        audio_url: audioUrl,
      };
      
      const res = await apiRequest(
        "POST", 
        `/api/decks/${values.deck_id}/flashcards`, 
        flashcardData
      );
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Flashcard created",
        description: "Your flashcard has been created successfully",
      });
      
      // Reset form
      form.reset({
        deck_id: form.getValues().deck_id, // Keep the selected deck
        front: "",
        back: "",
        part_of_speech: "",
        example_sentence: "",
        audio_url: "",
      });
      
      setAudioFile(null);
      
      // Invalidate decks query to update card count
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create flashcard",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: z.infer<typeof flashcardSchema>) => {
    createFlashcard.mutate(values);
  };
  
  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };
  
  if (decksLoading) {
    return (
      <div className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Front Side */}
              <div>
                <h3 className="font-medium mb-4">Front Side</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="front"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Word/Phrase</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter word or phrase" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="part_of_speech"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Part of Speech (Optional)</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                          defaultValue={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select part of speech" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="noun">Noun</SelectItem>
                            <SelectItem value="verb">Verb</SelectItem>
                            <SelectItem value="adjective">Adjective</SelectItem>
                            <SelectItem value="adverb">Adverb</SelectItem>
                            <SelectItem value="preposition">Preposition</SelectItem>
                            <SelectItem value="conjunction">Conjunction</SelectItem>
                            <SelectItem value="pronoun">Pronoun</SelectItem>
                            <SelectItem value="interjection">Interjection</SelectItem>
                            <SelectItem value="phrase">Phrase/Expression</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <FormLabel>Add Audio (Optional)</FormLabel>
                    <div className="flex items-center space-x-3 mt-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("audio-upload")?.click()}
                      >
                        <Upload size={16} className="mr-2" />
                        Upload Audio
                      </Button>
                      <input
                        id="audio-upload"
                        type="file"
                        className="hidden"
                        accept="audio/*"
                        onChange={handleAudioChange}
                      />
                      <span className="text-neutral-500 text-sm">
                        {audioFile ? audioFile.name : "No file chosen"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Back Side */}
              <div>
                <h3 className="font-medium mb-4">Back Side</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="back"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Definition/Translation</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter definition or translation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="example_sentence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Example Sentence (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter an example using this word/phrase"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <div className="border-t border-neutral-200 pt-6">
              <FormField
                control={form.control}
                name="deck_id"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Add to Deck</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString() ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a deck" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {decks?.map((deck: any) => (
                          <SelectItem key={deck.id} value={deck.id.toString()}>
                            {deck.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createFlashcard.isPending}
                >
                  {createFlashcard.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Flashcard"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
