import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, CheckCircle, AlertCircle, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface CsvUploaderProps {
  deckId?: number;
  onSuccess?: () => void;
}

export function CsvUploader({ deckId, onSuccess }: CsvUploaderProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<number | undefined>(deckId);
  const [showPreview, setShowPreview] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Get decks for selection if no deckId provided
  const { data: decks, isLoading: decksLoading } = useQuery({
    queryKey: ["/api/decks"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch decks");
      return res.json();
    },
    enabled: !deckId,
  });

  // Upload CSV mutation
  const uploadCsv = useMutation({
    mutationFn: async (uploadDeckId: number) => {
      if (!file) throw new Error("No file selected");

      const formData = new FormData();
      formData.append("csvFile", file);

      const res = await fetch(`/api/decks/${uploadDeckId}/upload-csv`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to upload CSV");
      }

      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "CSV uploaded successfully",
        description: `${data.success} cards imported, ${data.failed} failed`,
      });
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      if (selectedDeckId) {
        queryClient.invalidateQueries({ queryKey: [`/api/decks/${selectedDeckId}/flashcards`] });
      }
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check if it's a CSV file
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (!selectedDeckId) {
      toast({
        title: "Please select a deck",
        description: "You need to select a deck to upload flashcards to",
        variant: "destructive",
      });
      return;
    }

    uploadCsv.mutate(selectedDeckId);
  };

  const downloadTemplate = () => {
    // Create CSV template content
    const csvContent = "front,back,partOfSpeech,exampleSentence,audioUrl\n" +
                      "Hello,Hola,noun,Hello in Spanish,\n" +
                      "Good morning,Buenos días,phrase,Said in the morning,\n";
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'flashcard_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          CSV Upload
        </CardTitle>
        <CardDescription>
          Import multiple flashcards at once using a CSV file
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!deckId && (
          <div className="mb-4">
            <Label htmlFor="deck-select">Select Deck</Label>
            <Select
              value={selectedDeckId?.toString()}
              onValueChange={(value) => setSelectedDeckId(parseInt(value))}
              disabled={decksLoading || uploadCsv.isPending}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a deck" />
              </SelectTrigger>
              <SelectContent>
                {decks?.map((deck: any) => (
                  <SelectItem key={deck.id} value={deck.id.toString()}>
                    {deck.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="mt-4">
          <Label htmlFor="csv-file">Upload CSV File</Label>
          <div
            className={cn(
              "mt-1 flex justify-center rounded-lg border border-dashed border-neutral-300 px-6 py-10",
              uploadCsv.isPending && "opacity-50"
            )}
          >
            <div className="text-center">
              {file ? (
                <div className="flex flex-col items-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-success" />
                  <div className="mt-2 text-sm font-semibold">{file.name}</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload
                    className="mx-auto h-12 w-12 text-neutral-400"
                    strokeWidth={1}
                  />
                  <div className="mt-2 text-sm font-medium text-neutral-900">
                    Click to upload or drag and drop
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    CSV file up to 5MB
                  </div>
                </div>
              )}
              <input
                id="csv-file"
                name="csv-file"
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={handleFileChange}
                disabled={uploadCsv.isPending}
                ref={fileInputRef}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex">
            <button
              type="button"
              className="text-primary hover:text-primary-600 font-medium flex items-center"
              onClick={() => setShowHelp(true)}
            >
              <AlertCircle className="mr-1 h-4 w-4" />
              CSV Format
            </button>
          </div>
          <Button
            variant="link"
            onClick={downloadTemplate}
            className="text-primary hover:text-primary-600 p-0 h-auto"
          >
            <Download className="mr-1 h-4 w-4" />
            Download Template
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => {
            setFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
          disabled={!file || uploadCsv.isPending}
        >
          Clear
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!file || !selectedDeckId || uploadCsv.isPending}
        >
          {uploadCsv.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload CSV"
          )}
        </Button>
      </CardFooter>

      {/* CSV Help Dialog */}
      <AlertDialog open={showHelp} onOpenChange={setShowHelp}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>CSV Format Instructions</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Your CSV file should include the following columns:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>front</strong> (required): The front side of the flashcard</li>
                <li><strong>back</strong> (required): The back side/answer</li>
                <li><strong>partOfSpeech</strong> (optional): Grammatical category</li>
                <li><strong>exampleSentence</strong> (optional): Usage example</li>
                <li><strong>audioUrl</strong> (optional): URL to audio file</li>
              </ul>
              <p className="text-sm text-neutral-600 mt-2">
                The first row of your CSV must contain these column headers.
                Only front and back fields are required for each card.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={downloadTemplate}>
              Download Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
