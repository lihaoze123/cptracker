/**
 * Markdown Renderer Component
 *
 * This component is lazy-loaded to avoid bundling markdown dependencies
 * (react-markdown, remark-*, rehype-*, katex, react-syntax-highlighter)
 * in the main bundle. These dependencies add ~350KB gzip to the bundle.
 */
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || "");
          const codeString = String(children).replace(/\n$/, "");

          if (match) {
            return (
              <SyntaxHighlighter
                showLineNumbers={true}
                language={match[1]}
                PreTag="div"
                style={oneLight}
              >
                {codeString}
              </SyntaxHighlighter>
            );
          }

          return (
            <code
              className="bg-muted px-1 py-0.5 text-xs font-mono"
              {...props}
            >
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
