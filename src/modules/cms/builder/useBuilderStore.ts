import { create } from "zustand";
import { CMSData, CMSPage, SectionBlock } from "../types";
import { toast } from "sonner";

export type BuilderChannel = "homepage" | "pages" | "theme" | "media" | "navbar" | "seo";
export type ViewportMode = "desktop" | "tablet" | "mobile";

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  size: string;
  tag: "logo" | "banner" | "product" | "icon";
  alt: string;
  createdAt: string;
}

export interface NavLink {
  id: string;
  label: string;
  path: string;
  children?: NavLink[];
}

export interface CanvasElement {
  id: string;
  type: string; // 'container' | 'grid' | 'section' | 'column' | 'text' | 'image' | 'button' | 'divider' | 'form' | 'map' | 'video' | 'slider'
  name: string;
  properties: Record<string, any>;
}

interface BuilderState {
  // Navigation & UI States
  activeChannel: BuilderChannel;
  viewport: ViewportMode;
  isDirty: boolean;
  saving: boolean;
  
  // CMS Core States
  cmsValues: Partial<CMSData>;
  pages: CMSPage[];
  selectedPageId: string | null;
  sections: SectionBlock[];
  selectedSectionId: string | null;

  // New Website Builder States
  canvasElements: CanvasElement[];
  selectedElementId: string | null;
  historyStack: CanvasElement[][];
  futureStack: CanvasElement[][];

  // Media Library States
  mediaItems: MediaItem[];
  mediaFilter: "all" | "logo" | "banner" | "product" | "icon";

  // Navigation Link States
  navLinks: NavLink[];

  // Audit Logs
  auditLogs: { id: string; timestamp: string; action: string; user: string }[];

  // Actions
  setChannel: (channel: BuilderChannel) => void;
  setViewport: (mode: ViewportMode) => void;
  setInitialState: (cmsData: Partial<CMSData>, pages: CMSPage[]) => void;
  
  // Field Mutations (optimistic)
  updateField: (key: string, value: any) => void;
  updateSectionField: (sectionId: string, key: string, value: any) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  reorderSections: (reordered: SectionBlock[]) => void;
  selectSection: (id: string | null) => void;

  // New Website Builder Actions
  setCanvasElements: (elements: CanvasElement[]) => void;
  selectElement: (id: string | null) => void;
  addCanvasElement: (element: Omit<CanvasElement, 'id'>, index?: number) => void;
  updateElementProperties: (id: string, props: Record<string, any>) => void;
  duplicateElement: (id: string) => void;
  deleteElement: (id: string) => void;
  moveElement: (id: string, direction: 'up' | 'down') => void;
  undo: () => void;
  redo: () => void;
  pushToHistory: (elements: CanvasElement[]) => void;

  // Page Actions
  selectPage: (pageId: string) => void;
  addPage: (newPage: CMSPage) => void;
  deletePage: (pageId: string) => void;
  clonePageLayout: (fromPageId: string, toPageId: string) => void;

  // Media Actions
  addMediaItem: (item: MediaItem) => void;
  updateMediaAlt: (id: string, alt: string) => void;
  setMediaFilter: (tag: "all" | "logo" | "banner" | "product" | "icon") => void;

  // Navbar Actions
  updateNavLinks: (links: NavLink[]) => void;
  addNavLink: (link: Omit<NavLink, "id">) => void;
  deleteNavLink: (id: string) => void;

  // Persistence triggers
  markSaved: () => void;
  addAuditLog: (action: string) => void;
}

const syncCanvasToPages = (elements: CanvasElement[], pages: any[], selectedPageId: string | null) => {
  if (!selectedPageId) return { canvasElements: elements };
  const updatedPages = pages.map(p => {
    if (p.id === selectedPageId) {
      return { ...p, sections: elements };
    }
    return p;
  });
  return { canvasElements: elements, pages: updatedPages };
};

export const useBuilderStore = create<BuilderState>((set, get) => ({
  activeChannel: "homepage",
  viewport: "desktop",
  isDirty: false,
  saving: false,
  
  cmsValues: {},
  pages: [],
  selectedPageId: null,
  sections: [],
  selectedSectionId: null,

  // New Website Builder Initial States
  canvasElements: [
    {
      id: "el-1",
      type: "section",
      name: "Kahraman Banner Seksiyonu",
      properties: {
        padding: "py-20 px-8",
        backgroundColor: "bg-slate-50",
        textAlign: "center",
      }
    },
    {
      id: "el-2",
      type: "text",
      name: "Ana Başlık",
      properties: {
        content: "B2B E-Ticaret Dünyasına Hoş Geldiniz",
        fontSize: "text-4xl",
        fontWeight: "font-extrabold",
        textColor: "text-slate-950",
        marginBottom: "mb-4",
      }
    },
    {
      id: "el-3",
      type: "text",
      name: "Alt Açıklama",
      properties: {
        content: "En gelişmiş entegrasyon altyapısı ve akıllı dağıtım modülleriyle işinizi dijitalleştirin.",
        fontSize: "text-base",
        fontWeight: "font-medium",
        textColor: "text-slate-600",
        marginBottom: "mb-8",
      }
    },
    {
      id: "el-4",
      type: "button",
      name: "Eylem Butonu",
      properties: {
        content: "Hemen Başlayın",
        link: "/tr/register",
        buttonStyle: "solid",
        backgroundColor: "bg-orange-500",
        textColor: "text-white",
      }
    }
  ],
  selectedElementId: null,
  historyStack: [],
  futureStack: [],

  mediaItems: [
    { id: "1", name: "logo_dark.png", url: "/uploads/logo_dark.png", size: "45 KB", tag: "logo", alt: "PEKEFE Geleneksel & Doğal Lezzetler Kurumsal Logosu", createdAt: "29.05.2026" },
    { id: "2", name: "banner_honey.jpg", url: "/uploads/banner_honey.jpg", size: "380 KB", tag: "banner", alt: "Arı Kovanı ve Bal Süzme Slayt Görseli", createdAt: "29.05.2026" },
    { id: "3", name: "hive_wood.png", url: "/uploads/hive_wood.png", size: "120 KB", tag: "product", alt: "304 Kalite Paslanmaz Krom Arı Kovanı", createdAt: "29.05.2026" },
    { id: "4", name: "comb_wax.png", url: "/uploads/comb_wax.png", size: "85 KB", tag: "product", alt: "Doğal Petek Mum Kalıbı Görseli", createdAt: "29.05.2026" },
  ],
  mediaFilter: "all",

  navLinks: [
    { id: "menu-1", label: "Ana Sayfa", path: "/tr" },
    { id: "menu-2", label: "Ürünler", path: "/tr/products" },
    { id: "menu-3", label: "Hakkımızda", path: "/tr/about" },
    { id: "menu-4", label: "Blog & Haberler", path: "/tr/blog" },
    { id: "menu-5", label: "İletişim", path: "/tr/contact" }
  ],

  auditLogs: [
    { id: "log-1", timestamp: "29.05.2026 20:00", action: "Stil Renk Paleti Güncellendi (#b45309)", user: "Admin (ETicaret)" },
    { id: "log-2", timestamp: "29.05.2026 20:15", action: "Yeni Sayfa Taslağı Eklendi (Blog Detay)", user: "Admin (ETicaret)" }
  ],

  setChannel: (channel) => set({ activeChannel: channel }),
  setViewport: (mode) => set({ viewport: mode }),
  
  setInitialState: (cmsData, pages) => {
    const defaultPage = pages.find(p => p.slug === "home") || pages[0] || null;
    const initialSections = defaultPage && Array.isArray(defaultPage.sections)
      ? defaultPage.sections
      : [];
      
    set({
      cmsValues: cmsData,
      pages,
      selectedPageId: defaultPage ? defaultPage.id : null,
      sections: initialSections,
      selectedSectionId: initialSections[0]?.id || null,
      canvasElements: initialSections,
      isDirty: false
    });
  },

  updateField: (key, value) => {
    set((state) => ({
      cmsValues: { ...state.cmsValues, [key]: value },
      isDirty: true
    }));
  },

  updateSectionField: (sectionId, key, value) => {
    set((state) => {
      const updatedSections = state.sections.map((s) => {
        if (s.id === sectionId) {
          return {
            ...s,
            fields: { ...(s.fields || {}), [key]: value }
          };
        }
        return s;
      });
      return {
        sections: updatedSections,
        cmsValues: { ...state.cmsValues, [key]: value },
        isDirty: true
      };
    });
  },

  toggleSectionVisibility: (sectionId) => {
    set((state) => ({
      sections: state.sections.map(s => s.id === sectionId ? { ...s, visible: !s.visible } : s),
      isDirty: true
    }));
  },

  reorderSections: (reordered) => {
    set({ sections: reordered, isDirty: true });
  },

  selectSection: (id) => set({ selectedSectionId: id }),

  // Website Builder Actions Implementation
  setCanvasElements: (elements) => {
    set((state) => ({
      ...syncCanvasToPages(elements, state.pages, state.selectedPageId)
    }));
  },
  
  selectElement: (id) => set({ selectedElementId: id }),

  pushToHistory: (elements) => {
    const history = [...get().historyStack];
    // Keep max 20 states
    if (history.length >= 20) {
      history.shift();
    }
    set({
      historyStack: [...history, elements],
      futureStack: [] // Clear future redo path on new action
    });
  },

  addCanvasElement: (element, index) => {
    const currentElements = [...get().canvasElements];
    get().pushToHistory(currentElements.map(el => ({ ...el, properties: { ...el.properties } })));

    const newElement: CanvasElement = {
      id: `el-${Date.now()}`,
      ...element
    };

    if (index !== undefined && index >= 0) {
      currentElements.splice(index, 0, newElement);
    } else {
      currentElements.push(newElement);
    }

    set((state) => ({
      ...syncCanvasToPages(currentElements, state.pages, state.selectedPageId),
      selectedElementId: newElement.id,
      isDirty: true
    }));
  },

  updateElementProperties: (id, props) => {
    const currentElements = get().canvasElements;
    get().pushToHistory(currentElements.map(el => ({ ...el, properties: { ...el.properties } })));

    const updatedElements = currentElements.map((el) => {
      if (el.id === id) {
        return {
          ...el,
          properties: { ...el.properties, ...props }
        };
      }
      return el;
    });

    set((state) => ({
      ...syncCanvasToPages(updatedElements, state.pages, state.selectedPageId),
      isDirty: true
    }));
  },

  duplicateElement: (id) => {
    const currentElements = [...get().canvasElements];
    get().pushToHistory(currentElements.map(el => ({ ...el, properties: { ...el.properties } })));

    const index = currentElements.findIndex(el => el.id === id);
    if (index !== -1) {
      const source = currentElements[index];
      const copy: CanvasElement = {
        id: `el-${Date.now()}`,
        type: source.type,
        name: `${source.name} (Kopya)`,
        properties: JSON.parse(JSON.stringify(source.properties))
      };
      currentElements.splice(index + 1, 0, copy);
      set((state) => ({
        ...syncCanvasToPages(currentElements, state.pages, state.selectedPageId),
        selectedElementId: copy.id,
        isDirty: true
      }));
    }
  },

  deleteElement: (id) => {
    const currentElements = [...get().canvasElements];
    get().pushToHistory(currentElements.map(el => ({ ...el, properties: { ...el.properties } })));

    const filtered = currentElements.filter(el => el.id !== id);
    set((state) => ({
      ...syncCanvasToPages(filtered, state.pages, state.selectedPageId),
      selectedElementId: get().selectedElementId === id ? null : get().selectedElementId,
      isDirty: true
    }));
  },

  moveElement: (id, direction) => {
    const currentElements = [...get().canvasElements];
    get().pushToHistory(currentElements.map(el => ({ ...el, properties: { ...el.properties } })));

    const index = currentElements.findIndex(el => el.id === id);
    if (index !== -1) {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < currentElements.length) {
        const temp = currentElements[index];
        currentElements[index] = currentElements[targetIndex];
        currentElements[targetIndex] = temp;
        set((state) => ({
          ...syncCanvasToPages(currentElements, state.pages, state.selectedPageId),
          isDirty: true
        }));
      }
    }
  },

  undo: () => {
    const history = [...get().historyStack];
    if (history.length > 0) {
      const previousState = history.pop()!;
      const currentElements = get().canvasElements;

      set((state) => ({
        historyStack: history,
        futureStack: [...get().futureStack, currentElements],
        ...syncCanvasToPages(previousState, state.pages, state.selectedPageId),
        isDirty: true
      }));
    }
  },

  redo: () => {
    const future = [...get().futureStack];
    if (future.length > 0) {
      const nextState = future.pop()!;
      const currentElements = get().canvasElements;

      set((state) => ({
        historyStack: [...get().historyStack, currentElements],
        futureStack: future,
        ...syncCanvasToPages(nextState, state.pages, state.selectedPageId),
        isDirty: true
      }));
    }
  },

  selectPage: (pageId) => {
    const page = get().pages.find(p => p.id === pageId);
    if (page) {
      const pageSections = Array.isArray(page.sections) ? page.sections : [];
      set({
        selectedPageId: pageId,
        sections: pageSections,
        selectedSectionId: pageSections[0]?.id || null,
        canvasElements: pageSections,
        selectedElementId: null
      });
    }
  },

  addPage: (newPage) => {
    set((state) => ({
      pages: [...state.pages, newPage],
      isDirty: true
    }));
  },

  deletePage: (pageId) => {
    set((state) => ({
      pages: state.pages.filter(p => p.id !== pageId),
      isDirty: true
    }));
  },

  clonePageLayout: (fromPageId, toPageId) => {
    const fromPage = get().pages.find(p => p.id === fromPageId);
    if (fromPage) {
      set((state) => ({
        pages: state.pages.map(p => p.id === toPageId ? { ...p, sections: fromPage.sections } : p),
        isDirty: true
      }));
      if (get().selectedPageId === toPageId) {
        set({ sections: Array.isArray(fromPage.sections) ? fromPage.sections : [] });
      }
    }
  },

  addMediaItem: (item) => {
    set((state) => ({
      mediaItems: [item, ...state.mediaItems]
    }));
  },

  updateMediaAlt: (id, alt) => {
    set((state) => ({
      mediaItems: state.mediaItems.map(item => item.id === id ? { ...item, alt } : item)
    }));
    toast.success("Alt etiketi başarıyla güncellendi.");
  },

  setMediaFilter: (tag) => set({ mediaFilter: tag }),

  updateNavLinks: (links) => set({ navLinks: links, isDirty: true }),

  addNavLink: (link) => {
    const newLink: NavLink = {
      id: `menu-${Date.now()}`,
      ...link
    };
    set((state) => ({
      navLinks: [...state.navLinks, newLink],
      isDirty: true
    }));
  },

  deleteNavLink: (id) => {
    set((state) => ({
      navLinks: state.navLinks.filter(lnk => lnk.id !== id),
      isDirty: true
    }));
  },

  markSaved: () => set({ isDirty: false, saving: false }),

  addAuditLog: (action) => {
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString("tr-TR"),
      action,
      user: "Admin (ETicaret)"
    };
    set((state) => ({
      auditLogs: [newLog, ...state.auditLogs]
    }));
  }
}));
