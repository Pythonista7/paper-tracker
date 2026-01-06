import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api';
import type { Note } from '../../types';
import '@mdxeditor/editor/style.css';
import {
  MDXEditor,
  headingsPlugin,
  linkPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  CodeToggle,
  codeBlockPlugin,
  codeMirrorPlugin,
  InsertCodeBlock,
  ConditionalContents,
  ChangeCodeMirrorLanguage,
  listsPlugin,
  ListsToggle
} from '@mdxeditor/editor';

interface Props {
  paperId: string;
  sourceUrl: string;
}

const AUTOSAVE_DELAY = 1000;

export function NotesPanel({ paperId, sourceUrl }: Props) {
  const queryClient = useQueryClient();
  const notesQuery = useQuery({ queryKey: ['notes', paperId], queryFn: () => api.getNotes(paperId), enabled: Boolean(paperId) });
  const existingNote = notesQuery.data?.[0];
  const [value, setValue] = useState(existingNote?.body ?? '');
  const [status, setStatus] = useState<'idle' | 'saving'>('idle');

  const saveMutation = useMutation<Note | undefined, Error, string>({
    mutationFn: async (body: string) => {
      if (existingNote) {
        return api.updateNote(existingNote.id, { body });
      }
      const notes = await api.createNote(paperId, { body });
      return notes[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', paperId] });
      setStatus('idle');
    }
  });

  useEffect(() => {
    setValue(existingNote?.body ?? '');
  }, [existingNote?.id]);

  useEffect(() => {
    if (value.trim() === '') return;
    setStatus('saving');
    const handle = setTimeout(() => {
      saveMutation.mutate(value);
    }, AUTOSAVE_DELAY);
    return () => clearTimeout(handle);
  }, [value]);

  const editor = useMemo(() => {
    const toolbar = toolbarPlugin({
      toolbarContents: () => (
        <div className="flex flex-wrap items-center gap-2 text-white">
          <ConditionalContents
            options={[
              { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
              {
                fallback: () => (
                  <>
                    <UndoRedo />
                    <BoldItalicUnderlineToggles />
                    <InsertCodeBlock />
                    <CodeToggle />
                    <ListsToggle />
                    <BlockTypeSelect />
                    <CreateLink />
                  </>
                )
              }
            ]}
          />
        </div>
      )
    });

    return (
      <MDXEditor
        markdown={value}
        onChange={setValue}
        className="notes-editor"
        contentEditableClassName="notes-editor__content"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          linkPlugin(),
          markdownShortcutPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
          codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', ts: 'TypeScript', tsx: 'TypeScript (React)', jsx: 'JavaScript (React)' }, autoLoadLanguageSupport: true }),
          toolbar
        ]}
      />
    );
  }, [value]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-2xl border border-white/5 bg-surface-800/70 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Notes</h2>
            <p className="text-sm text-white/60">Markdown editor with autosave.</p>
          </div>
          <button className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/70" onClick={() => window.open(sourceUrl, '_blank')?.focus()}>
            Pop-out PDF
          </button>
        </div>
        <div className="mt-4 text-white">{editor}</div>
        <p className="mt-2 text-xs text-white/50">{status === 'saving' ? 'Saving…' : 'Autosaved'}</p>
      </div>
    </div>
  );
}
