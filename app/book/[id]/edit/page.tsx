"use client";

import { useState, useEffect, useRef } from "react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Send, Image as ImageIcon, BookOpen, AlertCircle, CheckCircle2, ArrowLeft, Plus, Trash2, Save, Info } from "lucide-react";
import RichTextToolbar from "@/components/RichTextToolbar";

export default function EditBookPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [pages, setPages] = useState<string[]>([""]);
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isModerator, setIsModerator] = useState(false);

  // Authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists() && userDoc.data().role === "moderator") {
            setIsModerator(true);
          } else {
            setIsModerator(false);
          }
        } catch (err) {
          console.error("Error checking user role:", err);
          setIsModerator(false);
        }
      } else {
        setIsModerator(false);
      }
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Original Book Data
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const docRef = doc(db, "books", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const pagesArray = Array.isArray(data.content) ? data.content : [data.content || ""];
          
          // Check for draft and overwrite original data if exists
          const savedDraft = localStorage.getItem(`aethel_edit_draft_${id}`);
          if (savedDraft) {
            try {
              const draftData = JSON.parse(savedDraft);
              setTitle(draftData.title || data.title || "");
              setCategory(draftData.category || data.category || "");
              setSynopsis(draftData.synopsis || data.synopsis || "");
              setPages(draftData.pages && draftData.pages.length > 0 ? draftData.pages : pagesArray);
            } catch (err) {
              console.error("Failed to parse edit draft", err);
              // Fallback to original
              setTitle(data.title || "");
              setCategory(data.category || "");
              setSynopsis(data.synopsis || "");
              setPages(pagesArray);
            }
          } else {
            setTitle(data.title || "");
            setCategory(data.category || "");
            setSynopsis(data.synopsis || "");
            setPages(pagesArray);
          }

          setCurrentCoverUrl(data.coverUrl || "");
        } else {
          setError("El libro que intentas editar no existe.");
        }
      } catch (err) {
        console.error("Error fetching book for edit:", err);
        setError("Error al cargar los datos del libro.");
      } finally {
        setIsFetching(false);
      }
    };

    if (id) {
      fetchBook();
    }
  }, [id]);

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
    localStorage.setItem(`aethel_edit_draft_${id}`, JSON.stringify(draftData));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000);
  };

  // Auto-save draft after 10 seconds of inactivity
  useEffect(() => {
    if (title || category || synopsis || pages.some(p => p.trim() !== "")) {
      const timeoutId = setTimeout(() => {
        handleSaveDraft();
      }, 10000);

      return () => clearTimeout(timeoutId);
    }
  }, [title, category, synopsis, pages, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!user) throw new Error("Debes haber iniciado sesión para proponer una edición.");
      
      if (!title || !category || !synopsis || pages.some(p => !p.trim())) {
        throw new Error("Por favor, completa todos los campos y asegúrate de que ninguna página esté vacía.");
      }

      // Si el usuario sube una nueva imagen, la subimos
      let finalCoverUrl = currentCoverUrl;
      if (coverFile) {
        const uploadedUrl = await uploadToCloudinary(coverFile);
        if (!uploadedUrl) throw new Error("Error al procesar la nueva imagen.");
        finalCoverUrl = uploadedUrl;
      }

      // If user is moderator, update the book directly
      if (isModerator) {
        await updateDoc(doc(db, "books", id), {
          title,
          category,
          synopsis,
          content: pages,
          coverUrl: finalCoverUrl
        });
      } else {
        // Guardar en la colección `edits` (Proposición)
        await addDoc(collection(db, "edits"), {
          bookId: id,
          proposedTitle: title,
          proposedCategory: category,
          proposedSynopsis: synopsis,
          proposedContent: pages,
          proposedCoverUrl: finalCoverUrl,
          status: "pending",
          authorId: user.uid,
          authorName: user.displayName || "Usuario Anónimo",
          createdAt: serverTimestamp(),
        });
      }

      setSuccess(true);
      localStorage.removeItem(`aethel_edit_draft_${id}`); // Borrar el borrador de edición al enviar
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado al enviar la propuesta.");
    } finally {
      setIsLoading(false);
    }
  };

  // Vistas de Estado (Auth / Fetching)
  if (authChecking || isFetching) {
    return (
      <div className="min-h-screen bg-background py-32 flex flex-col items-center justify-center text-muted">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-sm font-black uppercase tracking-[0.2em]">Cargando Entorno Seguro...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-32 flex flex-col items-center justify-center text-center px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-8 border border-red-500/20">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-3xl font-serif font-semibold mb-4 text-white">Acceso Restringido</h2>
        <p className="text-muted leading-relaxed mb-10 max-w-sm mx-auto">
          Debes identificarte en el Gremio para proponer cambios al archivo.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center px-8 py-4 border border-border text-xs font-black uppercase tracking-[0.2em] rounded-full text-text hover:bg-white hover:text-black transition-all duration-300 shadow-editorial"
        >
          Identificarse
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-32 px-4 sm:px-6 lg:px-8 font-sans antialiased text-text">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Link 
            href={`/book/${id}`}
            className="inline-flex flex-col items-center gap-2 mb-8 group"
          >
            <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center border border-border group-hover:border-primary group-hover:text-primary transition-all">
               <ArrowLeft size={18} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted group-hover:text-primary">Cancelar</span>
          </Link>
          <div className="flex items-center justify-center gap-2 px-4 py-2 mx-auto bg-primary/10 rounded-full text-primary w-fit text-[10px] font-black uppercase tracking-[0.3em] mb-8">
            <BookOpen size={12} />
            {isModerator ? 'Edición Directa' : 'Edición Colaborativa'}
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">
             Reescribe la <span className="text-primary italic font-light">Historia</span>
          </h1>
          <p className="mt-4 text-muted font-light px-8 max-w-xl mx-auto">
            Propón mejoras, correcciones o expansiones a esta obra. Los guardianes del archivo revisarán tu contribución antes de integrarla.
          </p>
        </div>

        <div className="bg-surface rounded-3xl shadow-soft border border-border p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 opacity-50" />
          
          {success ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-8 border border-primary/20">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-serif font-semibold mb-4">
                {isModerator ? 'Cambios Aplicados' : 'Edición en Revisión'}
              </h2>
              <p className="text-muted leading-relaxed mb-10 max-w-sm mx-auto">
                {isModerator 
                  ? 'La obra ha sido actualizada directamente en el registro público.'
                  : 'Tu contribución ha sido enviada a los curadores. Te agradecemos por enriquecer nuestra biblioteca viviente.'}
              </p>
              <Link
                href={`/book/${id}`}
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-black text-xs font-black uppercase tracking-[0.2em] rounded-full hover:bg-primary hover:text-white transition-all shadow-editorial"
              >
                Volver a la Lectura
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Draft Warning */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <h4 className="text-sm font-semibold text-white">Borrador de Edición</h4>
                  <p className="text-xs text-muted/80 mt-1 leading-relaxed">
                    Si no terminas tu revisión ahora, puedes guardarla como borrador. 
                    <strong className="text-primary/80 font-normal"> El borrador se guarda en la memoria de este navegador.</strong> Si cierras sesión o entras desde otro dispositivo, perderás el progreso no guardado.
                  </p>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                  1. Clasificación
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full bg-background border border-border rounded-xl px-4 py-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none cursor-pointer hover:border-white/20 transition-colors"
                >
                  <option value="" disabled>Selecciona la nueva naturaleza de la obra...</option>
                  <option value="Philosophy">Philosophy (Filosofía)</option>
                  <option value="Technology">Technology (Tecnología)</option>
                  <option value="Fiction">Fiction (Ficción Viva)</option>
                  <option value="Poetry">Poetry (Poesía)</option>
                  <option value="Science">Science (Ciencia)</option>
                  <option value="Art">Art (Arte Visuales)</option>
                </select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-muted">
                  2. Título de la Obra
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Escribe el título corregido aquí..."
                  required
                  className="w-full bg-background border border-border rounded-xl px-4 py-4 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors text-lg font-serif placeholder:font-sans placeholder:text-sm"
                />
              </div>

              {/* Optional Cover */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-muted flex items-center justify-between">
                  <span>3. Nueva Cubierta Visual <span className="text-[9px] text-muted-foreground ml-2">(Opcional)</span></span>
                </label>
                <div className="relative group cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full border-2 border-dashed rounded-xl px-4 py-8 flex flex-col items-center justify-center transition-all duration-300
                    ${coverFile ? 'border-primary/50 bg-primary/5' : 'border-border bg-background group-hover:border-primary/30 group-hover:bg-primary/5'}`}
                  >
                    <ImageIcon className={`w-8 h-8 mb-3 ${coverFile ? 'text-primary' : 'text-muted group-hover:text-primary/70'} transition-colors`} />
                    <span className="text-sm font-medium text-text text-center">
                      {coverFile ? coverFile.name : currentCoverUrl ? "Reemplazar imagen actual" : "Arrastra o haz clic para subir una imagen de portada"}
                    </span>
                    <span className="text-[10px] text-muted mt-2 tracking-wider">JPG, PNG o WEBP (Recomendado 3:4)</span>
                  </div>
                </div>
              </div>

              {/* Synopsis Field */}
              <div className="space-y-3">
                <label htmlFor="synopsis" className="text-xs font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                  4. Sinopsis / Resumen
                </label>
                <textarea
                  id="synopsis"
                  rows={4}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  className="block w-full px-5 py-4 rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:border-primary transition-colors text-text placeholder-muted/50 resize-y outline-none font-serif text-lg leading-relaxed"
                  disabled={isLoading}
                />
              </div>

              {/* Pages Grid (Forum-style Editor) */}
              <div className="space-y-6 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                    5. Hojas del Manuscrito
                  </label>
                  <span className="text-[10px] text-muted font-bold tracking-widest uppercase">
                    {pages.length} {pages.length === 1 ? 'Página' : 'Páginas'}
                  </span>
                </div>
                
                <div className="space-y-8">
                  {pages.map((pageContent, index) => (
                     <div key={index} className="relative group/page bg-background border border-border rounded-2xl overflow-hidden transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                      <div className="bg-surface px-4 py-3 flex items-center justify-between border-b border-border">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">
                          Página {index + 1}
                        </span>
                        {pages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newPages = [...pages];
                              newPages.splice(index, 1);
                              textareaRefs.current.splice(index, 1);
                              setPages(newPages);
                            }}
                            className="text-muted hover:text-red-400 transition-colors p-1"
                            title="Eliminar página"
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
                        placeholder={`Redacta la edición para la página ${index + 1} de tu obra aquí...`}
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
                    <Plus size={16} /> Añadir Página
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Submit / Draft Buttons */}
              <div className="pt-6 flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isLoading}
                  className="flex-1 flex justify-center items-center gap-2 py-5 px-8 border border-border rounded-full hover:bg-surface transition-all text-xs font-black uppercase tracking-[0.2em] text-muted relative"
                >
                  {draftSaved ? (
                     <><CheckCircle2 className="w-4 h-4 text-primary" /> Guardado localmente</>
                  ) : (
                     <><Save className="w-4 h-4" /> Guardar Borrador</>
                  )}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 relative flex justify-center items-center gap-3 py-5 px-8 border border-transparent rounded-full shadow-editorial overflow-hidden group transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-white group-hover:bg-primary transition-colors duration-300" />
                  <span className="relative z-10 text-xs font-black uppercase tracking-[0.3em] text-black group-hover:text-white transition-colors duration-300 flex items-center gap-3">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Procesando Vínculos...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        {isModerator ? 'Aplicar Cambios a Obra' : 'Enviar Propuesta'}
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
