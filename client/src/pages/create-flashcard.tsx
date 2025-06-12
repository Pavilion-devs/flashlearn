import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CreateFlashcardForm } from "@/components/flashcards/create-flashcard-form";
import { CsvUploader } from "@/components/csv-uploader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Upload, DivideSquare } from "lucide-react";

export default function CreateFlashcard() {
  const [activeTab, setActiveTab] = useState<"create" | "import">("create");
  
  return (
    <div className="flex flex-col h-screen">
      <MobileHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50 pb-16 md:pb-6">
          <div className="mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-poppins font-semibold mb-1">
                Create Flashcards
              </h1>
              <p className="text-neutral-500">Add new flashcards to your decks</p>
            </div>
            
            <Tabs defaultValue="create" value={activeTab} onValueChange={(v) => setActiveTab(v as "create" | "import")}>
              <TabsList className="mb-6">
                <TabsTrigger value="create" className="flex items-center">
                  <PlusCircle size={16} className="mr-2" />
                  Create Single Card
                </TabsTrigger>
                <TabsTrigger value="import" className="flex items-center">
                  <Upload size={16} className="mr-2" />
                  Import from CSV
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="create">
                <CreateFlashcardForm />
              </TabsContent>
              
              <TabsContent value="import">
                <CsvUploader />
                
                <div className="mt-6 bg-white rounded-xl p-6 border border-neutral-200">
                  <h3 className="font-medium text-lg mb-4 flex items-center">
                    <DivideSquare size={18} className="mr-2" />
                    CSV Format Instructions
                  </h3>
                  <p className="mb-4 text-neutral-600">
                    Your CSV file should include the following columns:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">Required Columns:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><strong>front</strong>: The front side of the flashcard</li>
                        <li><strong>back</strong>: The back side/answer</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Optional Columns:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li><strong>partOfSpeech</strong>: Grammatical category</li>
                        <li><strong>exampleSentence</strong>: Usage example</li>
                        <li><strong>audioUrl</strong>: URL to audio file</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-neutral-50 rounded-md border border-neutral-200 font-mono text-xs">
                    front,back,partOfSpeech,exampleSentence<br />
                    Hello,Hola,noun,Hello in Spanish<br />
                    Good morning,Buenos días,phrase,Said in the morning
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      <MobileNav />
    </div>
  );
}
