"use client";

import React from "react";
import { Bold, Italic, Underline, Heading2, Heading3 } from "lucide-react";

interface RichTextToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInsert: (newText: string) => void;
  disabled?: boolean;
}

export default function RichTextToolbar({ textareaRef, onInsert, disabled = false }: RichTextToolbarProps) {
  
  const handleFormat = (startTag: string, endTag: string) => {
    if (!textareaRef.current) return;
    const t = textareaRef.current;
    
    const start = t.selectionStart;
    const end = t.selectionEnd;
    const currentText = t.value;
    
    const selectedText = currentText.substring(start, end);
    const textBefore = currentText.substring(0, start);
    const textAfter = currentText.substring(end);
    
    // If no text is selected, insert the tags and place cursor between them
    const newText = textBefore + startTag + selectedText + endTag + textAfter;
    
    onInsert(newText);
    
    // Attempt to set cursor position after render
    setTimeout(() => {
      if (t) {
        t.focus();
        if (selectedText.length > 0) {
          t.setSelectionRange(start, start + startTag.length + selectedText.length + endTag.length);
        } else {
          t.setSelectionRange(start + startTag.length, start + startTag.length);
        }
      }
    }, 0);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-surface/50 border-b border-border text-muted">
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleFormat("<b>", "</b>")}
        className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
        title="Negrita (Bold)"
      >
        <Bold size={14} />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleFormat("<i>", "</i>")}
        className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
        title="Cursiva (Italic)"
      >
        <Italic size={14} />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleFormat("<u>", "</u>")}
        className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
        title="Subrayado (Underline)"
      >
        <Underline size={14} />
      </button>
      
      <div className="w-px h-4 bg-border mx-1" />
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleFormat("<h2>", "</h2>")}
        className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
        title="Título (H2)"
      >
        <Heading2 size={14} />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleFormat("<h3>", "</h3>")}
        className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
        title="Subtítulo (H3)"
      >
        <Heading3 size={14} />
      </button>
    </div>
  );
}
