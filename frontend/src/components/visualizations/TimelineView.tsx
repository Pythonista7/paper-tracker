import { useState } from 'react';
import type { Paper } from '../../types';
import { Card } from '../ui/card';
import { Quote, BookOpen, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

interface Props {
  papers: Paper[];
  groupBy?: 'date' | 'tag';
}

export function TimelineView({ papers, groupBy = 'date' }: Props) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Sort by date descending
  const sorted = [...papers].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  let groups: string[] = [];
  let grouped: Record<string, Paper[]> = {};

  if (groupBy === 'date') {
      // Group by Year-Month
      grouped = sorted.reduce((acc, paper) => {
        const date = paper.publishedAt ? new Date(paper.publishedAt) : null;
        const key = date 
          ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) 
          : 'Undated';
        if (!acc[key]) acc[key] = [];
        acc[key].push(paper);
        return acc;
      }, {} as Record<string, Paper[]>);

      groups = Array.from(new Set(sorted.map(p => {
        const date = p.publishedAt ? new Date(p.publishedAt) : null;
        return date 
          ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) 
          : 'Undated';
      })));
  } else {
      // Group by Tag
      grouped = sorted.reduce((acc, paper) => {
          if (!paper.tags || paper.tags.length === 0) {
              const key = 'Uncategorized';
              if (!acc[key]) acc[key] = [];
              acc[key].push(paper);
          } else {
              paper.tags.forEach(tag => {
                   if (!acc[tag]) acc[tag] = [];
                   acc[tag].push(paper);
              });
          }
          return acc;
      }, {} as Record<string, Paper[]>);

      const allTags = Object.keys(grouped).sort();
      groups = selectedTags.length > 0 
        ? allTags.filter(tag => selectedTags.includes(tag))
        : allTags;
  }

  const toggleTag = (tag: string) => {
      if (selectedTags.includes(tag)) {
          setSelectedTags(selectedTags.filter(t => t !== tag));
      } else {
          setSelectedTags([...selectedTags, tag]);
      }
  };

  return (
    <div className="bg-gradient-to-br from-background via-muted/10 to-background rounded-xl p-6 border shadow-sm">
        {groupBy === 'tag' && (
            <div className="mb-8 pb-6 border-b">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Filter by Tags</h3>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedTags([])}
                        className={cn(
                            "px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 shadow-sm",
                            selectedTags.length === 0 
                                ? "bg-primary text-primary-foreground border-primary shadow-primary/20" 
                                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                    >
                        All Tags
                    </button>
                    {Object.keys(grouped).sort().map(tag => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={cn(
                                "px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1.5 shadow-sm",
                                selectedTags.includes(tag)
                                    ? "bg-primary text-primary-foreground border-primary shadow-primary/20"
                                    : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:bg-muted/50"
                            )}
                        >
                            {selectedTags.includes(tag) && <Check className="w-3 h-3" />}
                            {tag}
                            <span className="opacity-70 text-[10px] ml-0.5 bg-background/20 px-1.5 py-0.5 rounded-full">
                                {grouped[tag]?.length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="relative border-l-2 border-primary/30 ml-4 space-y-10 py-4">
        {groups.map((group) => (
            <div key={group} className="relative pl-10">
                <div className="absolute -left-[13px] top-1 h-6 w-6 rounded-full bg-primary border-4 border-background shadow-lg shadow-primary/20 ring-2 ring-primary/10" />
                <h3 className="text-lg font-bold mb-5 text-foreground flex items-center gap-2">
                    <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        {group}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                        {grouped[group].length} {grouped[group].length === 1 ? 'item' : 'items'}
                    </span>
                </h3>
                
                <div className="space-y-3">
                    {grouped[group].map(paper => (
                        <Link key={paper.id} to={`/garden/${paper.id}`} className="block group">
                            <Card className="hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 bg-card/50 backdrop-blur-sm">
                                <div className="p-5 flex items-start gap-4">
                                    <div className="mt-1 text-muted-foreground bg-muted/50 p-2 rounded-lg group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                                        {paper.type === 'blog' ? <BookOpen className="w-5 h-5" /> : <Quote className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold group-hover:text-primary leading-tight mb-2">{paper.title}</h4>
                                        <p className="text-sm text-muted-foreground mb-2">{paper.authors}</p>
                                        {paper.completedAt && (
                                            <span className="inline-flex items-center text-xs text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                                                <Check className="w-3 h-3 mr-1" />
                                                Completed {new Date(paper.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        ))}
        </div>
    </div>
  );
}
