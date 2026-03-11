import { Feather, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ManifestoPage() {
  return (
    <div className="min-h-screen bg-background py-32 px-4 sm:px-6 lg:px-8 font-sans antialiased text-text selection:bg-primary/30 selection:text-white">
      <article className="max-w-3xl mx-auto">
        
        {/* Header */}
        <header className="mb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-12">
            <Feather size={12} />
            Fundación
          </div>
          <h1 className="text-5xl md:text-8xl font-serif font-bold tracking-tighter mb-8 leading-[0.9]">
            The Aethel <br />
            <span className="text-primary italic font-light">Manifesto.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted font-serif leading-relaxed max-w-2xl mx-auto">
            La literatura no debe ser estática. Es un ente vivo que evoluciona con el conocimiento humano.
          </p>
        </header>

        {/* Content Body */}
        <div className="prose prose-invert prose-lg md:prose-xl mx-auto prose-p:font-serif prose-p:leading-loose prose-p:text-neutral-300 prose-headings:font-serif prose-headings:font-bold prose-headings:tracking-tight">
          
          <h2>I. El Fin del Papel Estático</h2>
          <p>
            Durante siglos, un libro impreso ha representado el final de un pensamiento. Una vez encuadernado, las ideas quedan congeladas en el tiempo, vulnerables a la obsolescencia. En Aethel, creemos que un libro debe ser el <em>comienzo</em> de una conversación, no su conclusión definitiva.
          </p>

          <h2>II. Inteligencia Colectiva</h2>
          <p>
            Ninguna obra es verdaderamente obra de un solo autor. El conocimiento humano se construye sobre las iteraciones de mentes pasadas. Aethel democratiza el mantenimiento de la sabiduría, permitiendo que la comunidad refine, corrija y expanda los textos existentes mediante nuestro sistema de <strong>Edición Colaborativa</strong>.
          </p>

          <h2>III. Curaduría sobre Ruido</h2>
          <p>
            La libertad total engendra caos. Para mantener la integridad de nuestra biblioteca global, cada contribución pasa por el rigor de nuestros Guardianes (Moderadores). No censuramos ideas, pero exigimos claridad, precisión y valor estético en cada línea de código, en cada párrafo de texto.
          </p>
          
          <blockquote className="border-l-2 border-primary pl-6 my-12 italic text-2xl text-white font-light">
            "Aethel es un jardín digital. Las ideas florecen aquí, pero requieren de jardineros diligentes para no ahogarse en maleza."
          </blockquote>

          <h2>IV. Estética como Función</h2>
          <p>
            La presentación de las ideas importa tanto como las ideas mismas. Rechazamos el diseño utilitario y carente de alma que plaga la web moderna. La lectura debe ser una experiencia inmersiva, casi ceremonial. El ritmo tipográfico, los márgenes generosos y el mínimo de distracciones visuales son nuestros principios inquebrantables de diseño.
          </p>

          <h2>V. Open Source Knowledge</h2>
          <p>
            Toda la obra aprobada en Aethel pertenece a la humanidad. Aspiramos a ser el repositorio definitivo del pensamiento moderno en evolución constante.
          </p>

        </div>

        {/* Call to Action */}
        <div className="mt-32 pt-16 border-t border-border flex flex-col items-center text-center">
          <h3 className="text-3xl font-serif font-semibold mb-6">Únete al Gremio</h3>
          <p className="text-muted max-w-md mx-auto mb-10">
            Si compartes nuestra visión, conviértete en autor o curador. La biblioteca necesita nuevas voces.
          </p>
          <div className="flex flex-col sm:flex-row gap-6">
            <Link 
              href="/publish"
              className="inline-flex justify-center items-center gap-2 px-8 py-4 bg-white text-black text-xs font-black uppercase tracking-widest rounded-full hover:bg-primary hover:text-white transition-all shadow-editorial group"
            >
              Publicar una Obra
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/library"
              className="inline-flex justify-center items-center gap-2 px-8 py-4 border border-border text-xs font-black uppercase tracking-widest rounded-full hover:bg-surface transition-all group text-muted hover:text-white"
            >
              Explorar el Archivo
            </Link>
          </div>
        </div>

      </article>
    </div>
  );
}
