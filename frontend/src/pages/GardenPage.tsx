import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { Card, CardContent } from '../components/ui/card';
import { Link } from 'react-router-dom';
import { Calendar, FileText, BookOpen, Clock, Grid } from 'lucide-react';
import { useState } from 'react';
import { TimelineView } from '../components/visualizations/TimelineView';
import { GraphView } from '../components/visualizations/GraphView';
import { Button } from '../components/ui/button';
import { Network } from 'lucide-react';

export function GardenPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'timeline' | 'graph'>('grid');
  const [timelineGroupBy, setTimelineGroupBy] = useState<'date' | 'tag'>('date');
  const { data: papers, isLoading } = useQuery({
    queryKey: ['public-feed'],
    queryFn: api.getPublicFeed
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading knowledge garden...</div>;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(71,224,202,0.12),transparent_40%),radial-gradient(circle_at_80%_25%,rgba(99,102,241,0.08),transparent_45%),radial-gradient(circle_at_50%_80%,rgba(14,165,233,0.07),transparent_45%)] blur-3xl animate-gradient-drift" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0)_40%,rgba(255,255,255,0.06)_70%)] opacity-40 animate-slow-pan" />
      </div>

      <div className="container mx-auto max-w-6xl py-12 px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl text-white font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Research Garden
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A collection of papers, articles, and notes from my learning journey. 
            <br/>Check out <a href="https://ashwinms.com" className="underline hover:text-primary">my website</a> for more about the me!
          </p>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
             {viewMode === 'timeline' && (
                 <div className="bg-muted/50 p-1 rounded-lg inline-flex backdrop-blur-sm border">
                     <Button 
                         variant={timelineGroupBy === 'date' ? 'secondary' : 'ghost'} 
                         size="sm" 
                         onClick={() => setTimelineGroupBy('date')}
                         className="h-8 text-xs"
                     >
                         By Paper Date
                     </Button>
                     <Button 
                         variant={timelineGroupBy === 'tag' ? 'secondary' : 'ghost'} 
                         size="sm" 
                         onClick={() => setTimelineGroupBy('tag')}
                          className="h-8 text-xs"
                     >
                         By Tag
                     </Button>
                 </div>
             )}
          </div>

          <div className="bg-muted/50 p-1 rounded-lg inline-flex backdrop-blur-sm border shadow-sm">
              <Button 
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('grid')}
                  className="h-8"
              >
                  <Grid className="w-4 h-4 mr-2" /> Grid
              </Button>
              <Button 
                  variant={viewMode === 'timeline' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('timeline')}
                   className="h-8"
              >
                  <Clock className="w-4 h-4 mr-2" /> Timeline
              </Button>
              <Button 
                  variant={viewMode === 'graph' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('graph')}
                   className="h-8"
              >
                  <Network className="w-4 h-4 mr-2" /> Graph
              </Button>
          </div>
        </div>

        {viewMode === 'graph' ? (
          <GraphView />
        ) : viewMode === 'timeline' && papers ? (
          <TimelineView papers={papers} groupBy={timelineGroupBy} />
        ) : (
        <div className="space-y-6">
          {papers?.map((paper) => (
            <Link key={paper.id} to={`/garden/${paper.id}`} className="block group">
              <Card className="transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        {paper.publishedAt && (
                          <span className="flex items-center text-xs text-muted-foreground bg-muted/50 px-1 py-1 rounded-full mt-3">
                            <Calendar className="w-3 h-3 mr-1.5" />
                            Published {new Date(paper.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                          </span>
                        )}
                        {paper.completedAt && (
                          <span className="flex items-center text-xs text-green-600 dark:text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full font-medium">
                            <FileText className="w-3 h-3 mr-1.5" />
                            Completed {new Date(paper.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold group-hover:text-primary transition-colors leading-snug">
                        {paper.title}
                      </h2>
                      <p className="text-sm text-muted-foreground italic line-clamp-1">{paper.authors}</p>
                      {paper.abstract && (
                        <p className="text-sm text-muted-foreground/90 line-clamp-2 leading-relaxed">
                          {paper.abstract}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {paper.tags.map(tag => (
                          <span key={tag} className="px-2.5 py-1 bg-secondary/80 rounded-full text-xs font-medium text-secondary-foreground">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {papers?.length === 0 && (
              <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/20">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">The garden is currently empty. Check back soon!</p>
              </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
