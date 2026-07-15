"use client";

import { createElement } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

export function EditableText({
  path,
  as = "span",
  className,
  multiline = false,
  id,
}: {
  path: string;
  as?: "span" | "p" | "h1" | "h2" | "h3";
  className?: string;
  multiline?: boolean;
  id?: string;
}) {
  const { rol, modoEdicion } = useAuth();
  const { getValue, setValue, setEditorOpen } = useSiteContent();
  const value = String(getValue(path) ?? "");
  const editable = rol === "admin" && modoEdicion;

  return createElement(
    as,
    {
      id,
      className: `${className ?? ""} ${editable ? "cursor-text rounded outline outline-1 outline-dashed outline-coral/55 outline-offset-4 hover:outline-2" : ""}`,
      contentEditable: editable,
      suppressContentEditableWarning: editable,
      onClick: editable
        ? (event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            setEditorOpen(true);
          }
        : undefined,
      onKeyDown: editable && !multiline
        ? (event: React.KeyboardEvent) => {
            if (event.key === "Enter") {
              event.preventDefault();
              (event.currentTarget as HTMLElement).blur();
            }
          }
        : undefined,
      onBlur: editable
        ? (event: React.FocusEvent<HTMLElement>) => {
            const next = event.currentTarget.innerText.trim();
            if (next && next !== value) setValue(path, next);
          }
        : undefined,
    },
    value,
  );
}
