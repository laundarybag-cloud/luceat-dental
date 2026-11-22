"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Renders the markdown-lite article body: "## " headings, "- " bullets,
 * "1. " numbered steps, **bold**, and paragraphs. Deliberately tiny — the
 * body is clinic copy, not arbitrary HTML, and keeping the renderer narrow
 * means published content cannot inject markup into the assistant's answers.
 */
function inline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
    )
  );
}

export function ArticleBody({
  body,
  rtl,
  className,
}: {
  body: string;
  rtl?: boolean;
  className?: string;
}) {
  const blocks: React.ReactNode[] = [];
  const lines = body.split("\n");
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = (key: string) => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={key}
        className={cn(
          "mt-1.5 space-y-1 text-small leading-6 text-ink-soft",
          list.ordered ? "list-decimal" : "list-disc",
          rtl ? "me-5" : "ms-5"
        )}
      >
        {list.items.map((item, i) => (
          <li key={i} className="ps-1">
            {inline(item, `${key}-${i}`)}
          </li>
        ))}
      </Tag>
    );
    list = null;
  };

  lines.forEach((raw, index) => {
    const line = raw.trim();
    const key = `b-${index}`;

    if (line.startsWith("## ")) {
      flush(`${key}-l`);
      blocks.push(
        <h3 key={key} className="mt-5 text-card text-ink first:mt-0">
          {line.slice(3)}
        </h3>
      );
      return;
    }
    if (line.startsWith("- ")) {
      if (!list || list.ordered) {
        flush(`${key}-l`);
        list = { ordered: false, items: [] };
      }
      list.items.push(line.slice(2));
      return;
    }
    if (/^\d+\.\s/.test(line)) {
      if (!list || !list.ordered) {
        flush(`${key}-l`);
        list = { ordered: true, items: [] };
      }
      list.items.push(line.replace(/^\d+\.\s/, ""));
      return;
    }
    flush(`${key}-l`);
    if (line) {
      blocks.push(
        <p key={key} className="mt-2 text-small leading-6 text-ink-soft">
          {inline(line, key)}
        </p>
      );
    }
  });
  flush("b-final");

  return (
    <div
      dir={rtl ? "rtl" : undefined}
      lang={rtl ? "ar" : undefined}
      className={cn(rtl && "font-arabic text-start", className)}
    >
      {blocks}
    </div>
  );
}
