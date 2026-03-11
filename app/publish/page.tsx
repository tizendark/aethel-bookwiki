"use client";

import { useState, useEffect, useRef } from "react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";
import { Loader2, Send, Image as ImageIcon, BookOpen, AlertCircle, CheckCircle2, Plus, Trash2, Save, Info } from "lucide-react";
import RichTextToolbar from "@/components/RichTextToolbar";
import { useI18n } from "@/contexts/I18nContext";

export default function PublishPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [pages, setPages] = useState<string[]>([""]);
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const { t } = useI18n();

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("aethel_draft");
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        setTitle(draftData.title || "");
        setCategory(draftData.category || "");
        setSynopsis(draftData.synopsis || "");
        setPages(draftData.pages && draftData.pages.length > 0 ? draftData.pages : [""]);
      } catch (err) {
        console.error("Failed to parse draft", err);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverFile(e.target.files[0]);
    }
  };

  const handleSaveDraft = () => {
    const draftData = {
      title,
      category,
      synopsis,
      pages,
    };
    localStorage.setItem("aethel_draft", JSON.stringify(draftData));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000);
  };

  // Auto-save draft after 10 seconds of inactivity
  useEffect(() => {
    // Only auto-save if there's actually some content to prevent overwriting with blanks
    if (title || category || synopsis || pages.some(p => p.trim() !== "")) {
      const timeoutId = setTimeout(() => {
        handleSaveDraft();
      }, 10000);

      return () => clearTimeout(timeoutId);
    }
  }, [title, category, synopsis, pages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!user) throw new Error(t("publish.restrictedDesc"));
      
      if (!title || !category || !synopsis || !coverFile || pages.some(p => !p.trim())) {
        throw new Error(t("common.error")); // generic error for validation
      }

      // 1. Upload cover image to Cloudinary
      const coverUrl = await uploadToCloudinary(coverFile);
      if (!coverUrl) {
        throw new Error(t("common.error")); // generic error
      }

      // 2. Save document to Firestore in "pending_books" collection
      await addDoc(collection(db, "pending_books"), {
        title,
        category,
        synopsis,
        content: pages,
        coverUrl,
        authorId: user.uid,
        authorName: user.displayName || "Usuario Anónimo",
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // 3. Setup Success State
      setSuccess(true);
      setTitle("");
      setCategory("");
      setSynopsis("");
      setPages([""]);
      setCoverFile(null);
      localStorage.removeItem("aethel_draft"); // Borrar el borrador si se publicó con éxito
      
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
    }
  };

  return (
    <div className="min-h-screen bg-background py-32 px-4 sm:px-6 lg:px-8 font-sans antialiased text-text">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-8">
            <BookOpen size={12} />
            {t("publish.headerTag")}
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight mb-4">
            {t("publish.title")} <span className="text-primary italic font-light">{t("publish.titleHighlight")}</span>
          </h1>
          <p className="text-lg text-muted font-light max-w-xl mx-auto">
            {t("publish.subtitle")}
          </p>
        </div>

        <div className="bg-surface rounded-3xl shadow-soft border border-border p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 opacity-50" />
          
          {authChecking ? (
            <div className="py-24 flex flex-col items-center justify-center text-muted">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-sm font-black uppercase tracking-[0.2em]">{t("publish.verifying")}</p>
            </div>
          ) : !user ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-8 border border-red-500/20">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-3xl font-serif font-semibold mb-4 text-white">{t("publish.restricted")}</h2>
              <p className="text-muted leading-relaxed mb-10 max-w-sm mx-auto">
                {t("publish.restrictedDesc")}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 border border-border text-xs font-black uppercase tracking-[0.2em] rounded-full text-text hover:bg-white hover:text-black transition-all duration-300 shadow-editorial"
              >
                {t("publish.loginButton")}
              </Link>
            </div>
          ) : success ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-8 border border-primary/20">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-serif font-semibold mb-4">{t("publish.successTitle")}</h2>
              <p className="text-muted leading-relaxed mb-10 max-w-sm mx-auto">
                {t("publish.successDesc")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setSuccess(false)}
                  className="inline-flex items-center justify-center px-8 py-4 border border-border text-xs font-black uppercase tracking-[0.2em] rounded-full text-text hover:bg-white hover:text-black transition-all duration-300 w-full sm:w-auto"
                >
                  {t("publish.publishAnother")}
                </button>
                <Link
                  href="/library"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-black hover:bg-primary hover:text-white text-xs font-black uppercase tracking-[0.2em] rounded-full transition-all duration-300 shadow-editorial w-full sm:w-auto"
                >
                  {t("publish.goToLibrary")}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Draft Warning */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <h4 className="text-sm font-semibold text-white">{t("publish.draftWarningTitle")}</h4>
                  <p className="text-xs text-muted/80 mt-1 leading-relaxed">
                    {t("publish.draftWarningDesc")} 
                    <strong className="text-primary/80 font-normal"> {t("publish.draftWarningHighlight")}</strong> {t("publish.draftWarningDesc2")}
                  </p>
                </div>
              </div>

              {/* Title Field */}
              <div className="space-y-3">
                <label htmlFor="title" className="block text-[11px] font-black uppercase tracking-[0.2em] text-muted">
                  {t("publish.formTitleLabel")}
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("publish.formTitlePlaceholder")}
                  className="block w-full px-5 py-4 rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-text placeholder-muted/50 font-serif text-lg outline-none"
                  disabled={isLoading}
                />
              </div>

              {/* Category Field */}
              <div className="space-y-3">
                <label htmlFor="category" className="block text-[11px] font-black uppercase tracking-[0.2em] text-muted">
                  {t("publish.formCategoryLabel")}
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full bg-background border border-border rounded-xl px-4 py-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none cursor-pointer hover:border-white/20 transition-colors"
                  >
                    <option value="" disabled className="text-muted/50">{t("publish.formCategoryPlaceholder")}</option>
                    <option value="Ficción">{t("categories.fiction")}</option>
                    <option value="Fantasía">{t("categories.fantasy")}</option>
                    <option value="Ciencia Ficción">{t("categories.scienceFiction")}</option>
                    <option value="Romance">{t("categories.romance")}</option>
                    <option value="Misterio">{t("categories.mystery")}</option>
                    <option value="Filosofía">{t("categories.philosophy")}</option>
                    <option value="Biología">{t("categories.biology")}</option>
                    <option value="Tecnología">{t("categories.technology")}</option>
                    <option value="Poesía">{t("categories.poetry")}</option>
                    <option value="Ciencia">{t("categories.science")}</option>
                    <option value="Arte">{t("categories.art")}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Cover Image Field */}
              <div className="space-y-3">
                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-muted">
                  {t("publish.formCoverLabel")}
                </label>
                <div className="mt-1 flex justify-center px-6 pt-10 pb-12 border border-border border-dashed rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all bg-background group relative overflow-hidden">
                  <div className="space-y-4 text-center relative z-10 w-full">
                    <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                      <ImageIcon className="h-6 w-6 text-muted group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col items-center text-sm text-muted">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 transition-colors focus-within:outline-none"
                      >
                        <span className="text-base font-serif">{t("publish.formCoverExplore")}</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleFileChange}
                          disabled={isLoading}
                        />
                      </label>
                      <p className="mt-1 text-xs opacity-70">{t("publish.formCoverDrag")}</p>
                    </div>
                    {coverFile && (
                      <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium">
                        <CheckCircle2 size={14} />
                        {coverFile.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Synopsis Field */}
              <div className="space-y-3">
                <label htmlFor="synopsis" className="block text-[11px] font-black uppercase tracking-[0.2em] text-muted">
                  {t("publish.formSynopsisLabel")}
                </label>
                <textarea
                  id="synopsis"
                  rows={4}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder={t("publish.formSynopsisPlaceholder")}
                  className="block w-full px-5 py-4 rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-text placeholder-muted/50 resize-y outline-none font-serif text-lg leading-relaxed"
                  disabled={isLoading}
                />
              </div>

              {/* Pages Grid (Forum-style Editor) */}
              <div className="space-y-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-muted">
                    {t("publish.formPagesLabel")}
                  </label>
                  <span className="text-[10px] text-muted font-bold tracking-widest uppercase">
                    {pages.length} {pages.length === 1 ? t("publish.formPageCountSingular") : t("publish.formPageCountPlural")}
                  </span>
                </div>
                
                <div className="space-y-8">
                  {pages.map((pageContent, index) => (
                    <div key={index} className="relative group/page bg-background border border-border rounded-2xl overflow-hidden transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                      <div className="bg-surface px-4 py-3 flex items-center justify-between border-b border-border">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">
                          {t("publish.formPageNumber")} {index + 1}
                        </span>
                        {pages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newPages = [...pages];
                              newPages.splice(index, 1);
                              
                              // Handle refs array
                              textareaRefs.current.splice(index, 1);
                              
                              setPages(newPages);
                            }}
                            className="text-muted hover:text-red-400 transition-colors p-1"
                            title={t("publish.formPageDelete")}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      
                      {/* Rich Text Toolbar */}
                      <RichTextToolbar 
                        textareaRef={{ current: textareaRefs.current[index] }}
                        onInsert={(newText) => {
                          const newPages = [...pages];
                          newPages[index] = newText;
                          setPages(newPages);
                        }}
                        disabled={isLoading}
                      />

                      <textarea
                        ref={(el) => { textareaRefs.current[index] = el; }}
                        rows={8}
                        value={pageContent}
                        onChange={(e) => {
                          const newPages = [...pages];
                          newPages[index] = e.target.value;
                          setPages(newPages);
                        }}
                        placeholder={t("publish.formPagePlaceholder").replace("{index}", (index + 1).toString())}
                        className="block w-full px-5 py-6 bg-transparent text-text placeholder-muted/50 resize-y outline-none font-serif text-lg leading-relaxed"
                        disabled={isLoading}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setPages([...pages, ""])}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 border border-dashed border-border rounded-full text-xs font-black uppercase tracking-widest text-muted hover:text-primary hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <Plus size={16} /> {t("publish.formAddPage")}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Submit / Draft Buttons */}
              <div className="pt-6 flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isLoading}
                  className="flex-1 flex justify-center items-center gap-2 py-4 px-8 border border-border rounded-full hover:bg-surface transition-all text-xs font-black uppercase tracking-[0.2em] text-muted relative"
                >
                  {draftSaved ? (
                     <><CheckCircle2 className="w-4 h-4 text-primary" /> {t("publish.draftSaved")}</>
                  ) : (
                     <><Save className="w-4 h-4" /> {t("publish.saveDraft")}</>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex justify-center items-center gap-3 py-4 px-8 border border-transparent rounded-full shadow-editorial text-xs font-black uppercase tracking-[0.2em] text-black bg-white hover:bg-primary hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("publish.submitLoading")}
                    </>
                  ) : (
                    <>
                      {t("publish.submitButton")}
                      <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
