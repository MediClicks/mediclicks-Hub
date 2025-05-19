
import { SuggestionForm } from "@/components/content-suggestions/suggestion-form";

export default function ContentSuggestionsPage() {
  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight">Sugerencias de Contenido IA</h1>
        <p className="text-muted-foreground mt-1">
          Aprovecha la IA para crear publicaciones atractivas en redes sociales para tus clientes.
        </p>
      </div>
      <SuggestionForm />
    </div>
  );
}
