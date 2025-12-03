import React from 'react';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  // Parse markdown-style content to HTML
  const parseContent = (text: string): string => {
    let html = text;

    // Headers (## Title -> <h3>)
    html = html.replace(/^### (.+)$/gm, '<h4 class="text-lg font-semibold text-white mt-6 mb-3">$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3 class="text-xl font-semibold text-white mt-6 mb-4">$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2 class="text-2xl font-bold text-white mt-8 mb-4">$1</h2>');

    // Bold text (**text** or __text__)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong class="text-white font-semibold">$1</strong>');

    // Italic text (*text* or _text_)
    html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/_(.+?)_/g, '<em class="italic">$1</em>');

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#dc2626] hover:text-[#b91c1c] underline transition-colors">$1 ↗</a>'
    );

    // Inline code `code`
    html = html.replace(/`([^`]+)`/g,
      '<code class="bg-[#262626] text-[#dc2626] px-2 py-1 rounded text-sm font-mono">$1</code>'
    );

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p class="mb-4">');
    html = html.replace(/\n/g, '<br/>');

    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<h') && !html.startsWith('<p>')) {
      html = `<p class="mb-4">${html}</p>`;
    }

    return html;
  };

  return (
    <div
      className="text-[#e5e5e5] leading-relaxed"
      dangerouslySetInnerHTML={{ __html: parseContent(content) }}
    />
  );
}
