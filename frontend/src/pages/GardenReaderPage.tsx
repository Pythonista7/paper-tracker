import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { Button } from '../components/ui/button';
import { ArrowLeft, ExternalLink, Calendar, Users, BookOpen, Quote, FileText } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function GardenReaderPage() {
  const { id } = useParams<{ id: string }>();
  
  const { data, isLoading } = useQuery({
    queryKey: ['public-paper', id],
    queryFn: () => api.getPublicPaperDetails(id!)
  });

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading entry...</div>;
  if (!data) return <div className="p-12 text-center text-destructive">Entry not found</div>;

  const { paper, notes } = data;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(71,224,202,0.12),transparent_40%),radial-gradient(circle_at_80%_25%,rgba(99,102,241,0.08),transparent_45%),radial-gradient(circle_at_50%_80%,rgba(14,165,233,0.07),transparent_45%)] blur-3xl animate-gradient-drift" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_40%,rgba(255,255,255,0.06)_70%)] opacity-40 animate-slow-pan" />
      </div>

      <header className="border-b sticky top-0 bg-background/95 backdrop-blur-md z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-muted">
              <ArrowLeft className="w-4 h-4" />
              Back to Garden
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <a href={paper.sourceUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2 shadow-sm">
                <ExternalLink className="w-4 h-4" />
                View Source
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-screen-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          {/* Left Column: Content Viewer */}
          {/* <div className="lg:order-1 order-2">
             {paper.type === 'paper' ? (
                <div className="sticky top-24">
                  <PublicPdfViewer url={paper.sourceUrl} />
                </div>
             ) : (
                <div className="bg-gradient-to-br from-muted/30 via-muted/10 to-muted/30 border-2 border-dashed rounded-xl p-10 text-center min-h-[500px] flex flex-col items-center justify-center sticky top-24 shadow-sm">
                    <BookOpen className="w-16 h-16 text-muted-foreground/60 mb-6" />
                    <h3 className="text-2xl font-semibold mb-3">Read the Original Article</h3>
                    <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
                        This content is hosted externally. You can read my notes alongside while viewing the original content in a new tab.
                    </p>
                    <a href={paper.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="lg" className="gap-2 shadow-md">
                            Open Article <ExternalLink className="w-5 h-5" />
                        </Button>
                    </a>
                </div>
             )}
          </div> */}

          {/* Right Column: Metadata & Notes */}
          <div className="lg:order-2 order-1 space-y-8">
            {/* Paper Metadata */}
            <div className="bg-card/50 backdrop-blur-sm border rounded-xl p-6 shadow-sm">
              <h1 className="text-3xl text-white font-extrabold mb-4 leading-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                {paper.title}
              </h1>
              <div className="flex flex-col gap-3 text-sm mb-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{paper.authors}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {paper.publishedAt && (
                     <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                      <Calendar className="w-4 h-4" />
                      <span>Published: {new Date(paper.publishedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                      {paper.type === 'blog' ? <BookOpen className="w-4 h-4" />  : <Quote className="w-4 h-4" />}
                      <span className="capitalize font-medium">{paper.type}</span>
                  </div>
                </div>
              </div>
              
              {paper.abstract && (
                <div className="bg-muted/30 border rounded-lg p-4 mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Abstract</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{paper.abstract}</p>
                </div>
              )}

               <div className="flex flex-wrap gap-2">
                  {paper.tags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-secondary/80 backdrop-blur-sm rounded-full text-xs font-medium text-secondary-foreground border border-secondary shadow-sm">
                      #{tag}
                    </span>
                  ))}
               </div>
            </div>
          </div>
        </div>
        {/* Research Notes */}
        <div className="bg-card/50 backdrop-blur-sm border rounded-xl p-6 mt-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Research Notes
          </h2>
          {notes.length === 0 ? (
            <div className="text-center py-8 bg-muted/20 rounded-lg border-2 border-dashed">
              <p className="text-muted-foreground italic">No public notes added yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
                {notes.map((note, index) => (
                  <article key={note.id} className="bg-background/50 rounded-lg p-5 border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                      <span className="bg-primary/10 text-primary font-semibold px-2 py-1 rounded">Note {index + 1}</span>
                      <span>•</span>
                      <span>{new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="notes-editor__content !min-h-0 !bg-transparent !p-0 prose prose-sm dark:prose-invert max-w-none">
                      <Markdown remarkPlugins={[remarkGfm]}>{note.body}</Markdown>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </div>
        
        
      </main>
    </div>
  );
}
