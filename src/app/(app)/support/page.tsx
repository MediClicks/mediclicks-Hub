import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LifeBuoy, MessageSquare, BookOpen } from "lucide-react";

export default function SupportPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <LifeBuoy className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold tracking-tight">Support Center</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          We're here to help. Find answers to your questions or get in touch with our team.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center gap-3">
            <BookOpen className="h-8 w-8 text-accent" />
            <div>
              <CardTitle className="text-xl">Knowledge Base</CardTitle>
              <CardDescription>Find articles, guides, and FAQs.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Input type="search" placeholder="Search our knowledge base..." className="mb-4" />
            <ul className="space-y-2 text-sm">
              <li><Button variant="link" className="p-0 h-auto text-primary">Getting Started Guide</Button></li>
              <li><Button variant="link" className="p-0 h-auto text-primary">Managing Your Clients</Button></li>
              <li><Button variant="link" className="p-0 h-auto text-primary">Troubleshooting Common Issues</Button></li>
            </ul>
             <Button className="mt-4 w-full">Explore Knowledge Base</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center gap-3">
            <MessageSquare className="h-8 w-8 text-accent" />
            <div>
              <CardTitle className="text-xl">Contact Support</CardTitle>
              <CardDescription>Can't find an answer? Reach out to us.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="supportSubject">Subject</Label>
              <Input id="supportSubject" placeholder="e.g., Issue with billing" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supportMessage">Your Message</Label>
              <Textarea id="supportMessage" placeholder="Describe your issue in detail..." className="min-h-[100px]" />
            </div>
            <Button className="w-full">Send Message</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
