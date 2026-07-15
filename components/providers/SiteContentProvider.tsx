"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { DEFAULT_SITE_CONTENT, combinarContenido } from "@/lib/site-content/defaults";
import { supabaseBrowser } from "@/lib/supabase/client";
import { revalidarSitioPublico } from "@/lib/admin/revalidate";
import type { SiteContent } from "@/lib/site-content/types";

export type EditorTab = "inicio" | "navegacion" | "catalogo" | "pie" | "diseno" | "historial";

interface HistoryItem {
  version: number;
  created_at: string;
}

interface SiteContentContextValue {
  content: SiteContent;
  publicado: SiteContent;
  version: number;
  dirty: boolean;
  saving: boolean;
  message: string | null;
  editorOpen: boolean;
  editorTab: EditorTab;
  history: HistoryItem[];
  getValue: (path: string) => unknown;
  setValue: (path: string, value: unknown) => void;
  setEditorOpen: (open: boolean) => void;
  setEditorTab: (tab: EditorTab) => void;
  saveDraft: () => Promise<boolean>;
  publish: () => Promise<boolean>;
  restore: (version: number) => Promise<void>;
  uploadMedia: (file: File) => Promise<string>;
}

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

function getAtPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (Array.isArray(value)) return value[Number(key)];
    if (value && typeof value === "object") return (value as Record<string, unknown>)[key];
    return undefined;
  }, source);
}

function setAtPath(source: SiteContent, path: string, value: unknown): SiteContent {
  const copy = structuredClone(source) as unknown as Record<string, unknown>;
  const keys = path.split(".");
  let cursor: Record<string, unknown> | unknown[] = copy;
  keys.slice(0, -1).forEach((key) => {
    cursor = Array.isArray(cursor)
      ? (cursor[Number(key)] as Record<string, unknown> | unknown[])
      : (cursor[key] as Record<string, unknown> | unknown[]);
  });
  const finalKey = keys.at(-1)!;
  if (Array.isArray(cursor)) cursor[Number(finalKey)] = value;
  else cursor[finalKey] = value;
  return copy as unknown as SiteContent;
}

export function SiteContentProvider({ initialContent, children }: { initialContent: SiteContent; children: React.ReactNode }) {
  const { rol, modoEdicion } = useAuth();
  const [publicado, setPublicado] = useState(initialContent);
  const publicadoRef = useRef(initialContent);
  const [content, setContent] = useState(initialContent);
  const [version, setVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTab, setEditorTab] = useState<EditorTab>("inicio");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const activeContent = rol === "admin" && modoEdicion ? content : publicado;

  useEffect(() => {
    const root = document.documentElement;
    const theme = activeContent.theme;
    const variables: Record<string, string> = {
      "--color-sand": theme.sand,
      "--color-card": theme.card,
      "--color-ink": theme.ink,
      "--color-ink-soft": theme.inkSoft,
      "--color-coral": theme.coral,
      "--color-gold": theme.gold,
      "--color-dusk": theme.dusk,
      "--color-dusk-2": theme.dusk2,
      "--color-seafoam": theme.seafoam,
    };
    Object.entries(variables).forEach(([key, value]) => {
      if (theme.applyCustom) root.style.setProperty(key, value);
      else root.style.removeProperty(key);
    });
  }, [activeContent.theme]);

  const loadHistory = useCallback(async () => {
    const { data } = await supabaseBrowser().rpc("web_listar_historial_contenido", { p_clave: "sitio" });
    setHistory((data ?? []) as HistoryItem[]);
  }, []);

  useEffect(() => {
    if (rol !== "admin" || !modoEdicion) return;
    let active = true;
    supabaseBrowser()
      .rpc("web_obtener_contenido_admin", { p_clave: "sitio" })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setMessage("El editor necesita completar su configuración de base de datos.");
          return;
        }
        const response = data as { contenido?: unknown; publicado?: unknown; version?: number } | null;
        const nextPublished = combinarContenido(DEFAULT_SITE_CONTENT, response?.publicado);
        publicadoRef.current = nextPublished;
        setPublicado(nextPublished);
        setContent(combinarContenido(DEFAULT_SITE_CONTENT, response?.contenido));
        setVersion(response?.version ?? 0);
        setDirty(false);
        setMessage(null);
        void loadHistory();
      });
    return () => {
      active = false;
    };
  }, [loadHistory, modoEdicion, rol]);

  const setValue = useCallback((path: string, value: unknown) => {
    setContent((current) => setAtPath(current, path, value));
    setDirty(true);
    setMessage(null);
  }, []);

  const saveDraft = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    const { data, error } = await supabaseBrowser().rpc("web_guardar_contenido_borrador", {
      p_clave: "sitio",
      p_contenido: content,
    });
    setSaving(false);
    if (error || !data?.ok) {
      setMessage("No se pudo guardar el borrador.");
      return false;
    }
    setDirty(false);
    setMessage("Borrador guardado.");
    return true;
  }, [content]);

  const publish = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    const saved = dirty ? await saveDraft() : true;
    if (!saved) {
      setSaving(false);
      return false;
    }
    const { data, error } = await supabaseBrowser().rpc("web_publicar_contenido", { p_clave: "sitio" });
    setSaving(false);
    if (error || !data?.ok) {
      setMessage("No se pudieron publicar los cambios.");
      return false;
    }
    setVersion(data.version ?? version + 1);
    setPublicado(content);
    publicadoRef.current = content;
    try {
      await revalidarSitioPublico();
      setMessage(`Versión ${data.version ?? version + 1} publicada y web actualizada.`);
    } catch {
      setMessage("La versión se publicó, pero la web pública no pudo actualizarse.");
      return false;
    }
    await loadHistory();
    return true;
  }, [content, dirty, loadHistory, saveDraft, version]);

  const restore = useCallback(async (historyVersion: number) => {
    setSaving(true);
    const { data, error } = await supabaseBrowser().rpc("web_restaurar_borrador_contenido", {
      p_clave: "sitio",
      p_version: historyVersion,
    });
    setSaving(false);
    if (error || !data?.ok) {
      setMessage("No se pudo restaurar esa versión.");
      return;
    }
    setContent(combinarContenido(DEFAULT_SITE_CONTENT, data.contenido));
    setDirty(false);
    setMessage(`Versión ${historyVersion} restaurada como borrador.`);
  }, []);

  const uploadMedia = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      throw new Error("La imagen debe pesar menos de 10 MB.");
    }
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `web-admin/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const sb = supabaseBrowser();
    const { error } = await sb.storage.from("web-contenido").upload(path, file, { upsert: false });
    if (error) throw error;
    return sb.storage.from("web-contenido").getPublicUrl(path).data.publicUrl;
  }, []);

  const value = useMemo<SiteContentContextValue>(() => ({
    content: activeContent,
    publicado,
    version,
    dirty,
    saving,
    message,
    editorOpen,
    editorTab,
    history,
    getValue: (path) => getAtPath(activeContent, path),
    setValue,
    setEditorOpen,
    setEditorTab,
    saveDraft,
    publish,
    restore,
    uploadMedia,
  }), [activeContent, dirty, editorOpen, editorTab, history, message, publicado, publish, restore, saveDraft, saving, setValue, uploadMedia, version]);

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (!context) throw new Error("useSiteContent debe usarse dentro de SiteContentProvider");
  return context;
}
