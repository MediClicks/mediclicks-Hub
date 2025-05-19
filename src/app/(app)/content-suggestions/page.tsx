import { SuggestionForm } from "@/components/content-suggestions/suggestion-form";

export default function ContentSuggestionsPage() {
  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight">AI Content Suggestions</h1>
        <p className="text-muted-foreground mt-1">
          Leverage AI to craft compelling social media posts for your clients.
        </p>
      </div>
      <SuggestionForm />
    </div>
  );
}
