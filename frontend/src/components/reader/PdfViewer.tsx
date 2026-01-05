import { useState } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { toolbarPlugin } from '@react-pdf-viewer/toolbar';
import type { ToolbarSlot } from '@react-pdf-viewer/toolbar';
import { thumbnailPlugin } from '@react-pdf-viewer/thumbnail';
import { bookmarkPlugin } from '@react-pdf-viewer/bookmark';
import { searchPlugin } from '@react-pdf-viewer/search';
import { ChevronDown, ChevronUp } from 'lucide-react';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/toolbar/lib/styles/index.css';
import '@react-pdf-viewer/thumbnail/lib/styles/index.css';
import '@react-pdf-viewer/bookmark/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';
import './pdf-viewer.css';
import { Button } from '../ui/button';

interface PdfViewerProps {
  url: string;
  title: string;
}

const workerUrl = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

type SidebarTab = 'thumbnails' | 'outline' | null;

export function PdfViewer({ url, title }: PdfViewerProps) {
  const [sidebar, setSidebar] = useState<SidebarTab>('thumbnails');
  const toolbarPluginInstance = toolbarPlugin();
  const thumbnailPluginInstance = thumbnailPlugin();
  const bookmarkPluginInstance = bookmarkPlugin();
  const searchPluginInstance = searchPlugin();

  const { Toolbar } = toolbarPluginInstance;
  const { Thumbnails } = thumbnailPluginInstance;
  const { Bookmarks } = bookmarkPluginInstance;
  const { Search } = searchPluginInstance;

  return (
    <div className="flex h-full w-full overflow-hidden rounded-2xl border border-white/5 bg-black/90">
      {sidebar && (
        <div className="flex w-64 flex-col border-r border-white/5 bg-surface-900/90">
          <div className="flex items-center gap-2 p-3 text-sm">
            <button
              className={`rounded-full px-3 py-1 ${sidebar === 'thumbnails' ? 'bg-accent/20 text-accent' : 'bg-white/5 text-white/70'}`}
              onClick={() => setSidebar('thumbnails')}
            >
              Pages
            </button>
            <button
              className={`rounded-full px-3 py-1 ${sidebar === 'outline' ? 'bg-accent/20 text-accent' : 'bg-white/5 text-white/70'}`}
              onClick={() => setSidebar('outline')}
            >
              Outline
            </button>
            <button className="ml-auto text-sm text-white/60 hover:text-white" onClick={() => setSidebar(null)}>
              ✕
            </button>
          </div>
          <div className="h-full overflow-y-auto">
            {sidebar === 'thumbnails' ? <Thumbnails /> : <Bookmarks />}
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-white/5 bg-surface-900/80 px-3 py-2">
          <Toolbar>
            {(props) => <CustomToolbar {...props} />}
          </Toolbar>
          <Search>
            {(renderProps) => (
              <div className="flex items-center gap-2">
                <form
                  className="flex items-center gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    renderProps.search();
                  }}
                >
                  <input
                    className="rounded-lg border border-white/10 bg-black/60 px-2 py-1 text-sm text-white w-32 focus:w-48 transition-all outline-none focus:border-accent/50"
                    placeholder="Search..."
                    type="text"
                    value={renderProps.keyword}
                    onChange={(e) => renderProps.setKeyword(e.target.value)}
                  />
                </form>
                {renderProps.numberOfMatches > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/60 min-w-[3rem] text-center select-none">
                      {renderProps.currentMatch} / {renderProps.numberOfMatches}
                    </span>
                    <div className="flex items-center rounded-md border border-white/10 bg-white/5">
                      <button
                        className="p-1 hover:bg-white/10 text-white/70 hover:text-white transition-colors border-r border-white/10"
                        onClick={renderProps.jumpToPreviousMatch}
                        title="Previous match"
                        type="button"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                        onClick={renderProps.jumpToNextMatch}
                        title="Next match"
                        type="button"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Search>
          <Button variant="ghost" onClick={() => setSidebar(sidebar ? null : 'thumbnails')}>
            {sidebar ? 'Hide panel' : 'Show panel'}
          </Button>
        </div>
        <div className="flex-1 overflow-hidden bg-[#1c1c1c]">
          <Worker workerUrl={workerUrl}>
            <Viewer
              fileUrl={url}
              renderLoader={() => <div className="flex h-full items-center justify-center text-white/70">Loading {title}…</div>}
              plugins={[toolbarPluginInstance, thumbnailPluginInstance, bookmarkPluginInstance, searchPluginInstance]}
            />
          </Worker>
        </div>
      </div>
    </div>
  );
}

function CustomToolbar(props: ToolbarSlot) {
  const {
    CurrentPageInput,
    NumberOfPages,
    GoToNextPage,
    GoToPreviousPage,
    Zoom,
    ZoomIn,
    ZoomOut,
    EnterFullScreen
  } = props;

  return (
    <div className="flex flex-1 flex-wrap items-center gap-3 text-sm">
      <div className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-1">
        <GoToPreviousPage />
        <div className="flex items-center gap-1 text-xs font-semibold">
          <CurrentPageInput />
          <span>/</span>
          <NumberOfPages />
        </div>
        <GoToNextPage />
      </div>
      <div className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-1">
        <ZoomOut />
        <Zoom />
        <ZoomIn />
      </div>
      <div className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-1">
        <EnterFullScreen />
      </div>
    </div>
  );
}
