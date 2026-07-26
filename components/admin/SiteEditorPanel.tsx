"use client";

import Link from "next/link";
import { useState } from "react";
import { useSiteContent, type EditorTab } from "@/components/providers/SiteContentProvider";

const TABS: { id: EditorTab; label: string }[] = [
  { id: "inicio", label: "Inicio" },
  { id: "navegacion", label: "Menú" },
  { id: "catalogo", label: "Catálogo" },
  { id: "pie", label: "Footer" },
  { id: "diseno", label: "Diseño" },
  { id: "historial", label: "Versiones" },
];

const fieldClass = "mt-1.5 w-full rounded-xl border border-ink/15 bg-sand px-3 py-2.5 text-sm text-ink outline-none focus:border-coral";

function Field({ path, label, multiline = false, type = "text" }: { path: string; label: string; multiline?: boolean; type?: string }) {
  const { getValue, setValue } = useSiteContent();
  const value = String(getValue(path) ?? "");
  return (
    <label className="block text-xs font-bold text-ink">
      {label}
      {multiline ? (
        <textarea rows={3} value={value} onChange={(event) => setValue(path, event.target.value)} className={fieldClass} />
      ) : (
        <input type={type} value={value} onChange={(event) => setValue(path, event.target.value)} className={fieldClass} />
      )}
    </label>
  );
}

function MediaField({ path, label }: { path: string; label: string }) {
  const { getValue, setValue, uploadMedia } = useSiteContent();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const value = String(getValue(path) ?? "");

  return (
    <div className="rounded-xl border border-ink/10 p-3">
      <p className="text-xs font-bold text-ink">{label}</p>
      <input value={value} onChange={(event) => setValue(path, event.target.value)} className={fieldClass} placeholder="URL de la imagen" />
      <label className="mt-2 flex min-h-10 cursor-pointer items-center justify-center rounded-lg bg-sand-2 px-3 text-xs font-bold text-ink">
        {uploading ? "Subiendo…" : "Subir nueva imagen"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          disabled={uploading}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setUploading(true);
            setError(null);
            try {
              setValue(path, await uploadMedia(file));
            } catch (uploadError) {
              setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir.");
            } finally {
              setUploading(false);
            }
          }}
        />
      </label>
      {error ? <p className="mt-2 text-xs text-coral">{error}</p> : null}
    </div>
  );
}

function HomeFields() {
  const { content } = useSiteContent();
  return (
    <div className="space-y-5">
      <section className="space-y-3"><h3 className="font-display text-lg font-semibold text-ink">Portada</h3><Field path="home.hero.eyebrow" label="Etiqueta" /><Field path="home.hero.title" label="Título" /><Field path="home.hero.accent" label="Título destacado" /><Field path="home.hero.description" label="Descripción" multiline /><Field path="home.hero.primaryLabel" label="Botón principal" /><Field path="home.hero.primaryHref" label="Enlace principal" /><Field path="home.hero.secondaryLabel" label="Botón secundario" /><MediaField path="home.hero.image" label="Imagen principal opcional" /></section>
      <section className="space-y-3 border-t border-ink/10 pt-5"><h3 className="font-display text-lg font-semibold text-ink">Servicios</h3><Field path="home.services.eyebrow" label="Etiqueta" /><Field path="home.services.title" label="Título" /><Field path="home.services.description" label="Descripción" multiline />{content.home.services.cards.map((card, index) => <div key={index} className="space-y-2 rounded-xl bg-sand-2 p-3"><p className="font-mono text-[0.65rem] font-bold uppercase text-coral">Tarjeta {index + 1}</p><Field path={`home.services.cards.${index}.label`} label="Categoría" /><Field path={`home.services.cards.${index}.title`} label="Título" /><Field path={`home.services.cards.${index}.description`} label="Descripción" multiline /><Field path={`home.services.cards.${index}.href`} label="Enlace" /><MediaField path={`home.services.cards.${index}.image`} label="Imagen" /></div>)}</section>
      <section className="space-y-3 border-t border-ink/10 pt-5"><h3 className="font-display text-lg font-semibold text-ink">Promociones</h3><Field path="home.promotions.eyebrow" label="Etiqueta" /><Field path="home.promotions.title" label="Título" /></section>
      <section className="space-y-3 border-t border-ink/10 pt-5"><h3 className="font-display text-lg font-semibold text-ink">Hot Sales</h3><Field path="home.hotSales.eyebrow" label="Etiqueta" /><Field path="home.hotSales.title" label="Título" /></section>
            <section className="space-y-3 border-t border-ink/10 pt-5"><h3 className="font-display text-lg font-semibold text-ink">Corporativo</h3><Field path="home.corporate.eyebrow" label="Etiqueta" /><Field path="home.corporate.title" label="Título" /><Field path="home.corporate.description" label="Descripción" multiline /><MediaField path="home.corporate.image" label="Imagen" /></section>
    </div>
  );
}

function NavigationFields() {
  const { content, setValue } = useSiteContent();
  return <div className="space-y-4"><Field path="brand.name" label="Nombre de la marca" />{content.navigation.items.map((item, index) => <div key={item.id} className="space-y-2 rounded-xl bg-sand-2 p-3"><Field path={`navigation.items.${index}.label`} label="Texto" /><Field path={`navigation.items.${index}.href`} label="Enlace" /><label className="flex items-center gap-2 text-xs font-bold text-ink"><input type="checkbox" checked={item.visible} onChange={(event) => setValue(`navigation.items.${index}.visible`, event.target.checked)} /> Visible</label></div>)}<Field path="navigation.quoteLabel" label="Texto de Cotizar" /><Field path="navigation.quoteHref" label="Enlace de Cotizar" /><Field path="navigation.whatsappLabel" label="Texto de WhatsApp" /></div>;
}

function CatalogFields() {
  return <div className="space-y-3"><Field path="catalog.eyebrow" label="Etiqueta del catálogo" /><Field path="catalog.descriptions.promociones" label="Descripción de promociones" multiline /><Field path="catalog.descriptions.hoteles" label="Descripción de hoteles" multiline /><Field path="catalog.descriptions.paquetes" label="Descripción de paquetes" multiline /><Field path="catalog.descriptions.guias-tours" label="Descripción de guías y tours" multiline /><Link href="/cuenta/admin" className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-dusk px-4 text-sm font-bold text-dusk-text">Editar productos, tarifas y fotos</Link></div>;
}

function FooterFields() {
  return <div className="space-y-3"><Field path="footer.eyebrow" label="Etiqueta" /><Field path="footer.headline" label="Título" multiline /><Field path="footer.ctaLabel" label="Botón" /><Field path="footer.description" label="Descripción" multiline /><Field path="footer.copyright" label="Derechos reservados" /></div>;
}

function DesignFields() {
  const { content, setValue } = useSiteContent();
  return <div className="space-y-4"><label className="flex items-center gap-3 rounded-xl border border-ink/10 p-3 text-sm font-bold text-ink"><input type="checkbox" checked={content.theme.applyCustom} onChange={(event) => setValue("theme.applyCustom", event.target.checked)} /> Aplicar paleta personalizada</label><p className="text-xs leading-5 text-ink-soft">Mientras esté desactivada, se conserva la paleta optimizada y el modo claro/oscuro del sitio.</p><div className="grid grid-cols-2 gap-3"><Field path="theme.sand" label="Fondo" type="color" /><Field path="theme.card" label="Tarjetas" type="color" /><Field path="theme.ink" label="Texto" type="color" /><Field path="theme.inkSoft" label="Texto suave" type="color" /><Field path="theme.coral" label="Acento" type="color" /><Field path="theme.gold" label="Dorado" type="color" /><Field path="theme.dusk" label="Fondo oscuro" type="color" /><Field path="theme.dusk2" label="Oscuro secundario" type="color" /><Field path="theme.seafoam" label="Verde agua" type="color" /></div></div>;
}

export function SiteEditorPanel() {
  const { editorOpen, setEditorOpen, editorTab, setEditorTab, dirty, saving, message, saveDraft, publish, history, restore, version } = useSiteContent();
  if (!editorOpen) return null;
  return (
    <aside className="fixed inset-y-3 right-3 z-[70] flex w-[min(410px,calc(100vw-24px))] flex-col overflow-hidden rounded-[24px] border border-ink/15 bg-card shadow-2xl" aria-label="Editor del sitio">
      <div className="border-b border-ink/10 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] text-coral">Editor visual</p><h2 className="font-display text-xl font-semibold text-ink">Sitio · v{version}</h2></div><button type="button" onClick={() => setEditorOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand-2 text-ink" aria-label="Cerrar panel">×</button></div><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => void saveDraft()} disabled={saving || !dirty} className="min-h-10 rounded-xl border border-ink/15 text-xs font-bold text-ink disabled:opacity-40">Guardar borrador</button><button type="button" onClick={() => void publish()} disabled={saving} className="min-h-10 rounded-xl bg-coral text-xs font-bold text-white disabled:opacity-50">Publicar cambios</button></div>{message ? <p className="mt-2 text-xs text-ink-soft">{message}</p> : null}</div>
      <div className="flex gap-1 overflow-x-auto border-b border-ink/10 p-2 [scrollbar-width:none]">{TABS.map((tab) => <button key={tab.id} type="button" onClick={() => setEditorTab(tab.id)} className={`min-h-9 flex-shrink-0 rounded-lg px-3 text-xs font-bold ${editorTab === tab.id ? "bg-dusk text-dusk-text" : "text-ink-soft"}`}>{tab.label}</button>)}</div>
      <div className="flex-1 overflow-y-auto p-4">{editorTab === "inicio" ? <HomeFields /> : editorTab === "navegacion" ? <NavigationFields /> : editorTab === "catalogo" ? <CatalogFields /> : editorTab === "pie" ? <FooterFields /> : editorTab === "diseno" ? <DesignFields /> : <div className="space-y-3">{history.length ? history.map((item) => <button key={item.version} type="button" onClick={() => void restore(item.version)} className="flex min-h-12 w-full items-center justify-between rounded-xl border border-ink/10 px-4 text-left text-sm text-ink"><span>Versión {item.version}</span><span className="text-xs text-ink-soft">Restaurar</span></button>) : <p className="text-sm text-ink-soft">Todavía no hay versiones anteriores.</p>}</div>}</div>
    </aside>
  );
}
