/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Home, Key, Building, LandPlot, Sprout, Compass, MapPin, ArrowRight, MessageSquare, Phone, Mail } from 'lucide-react';

const heroImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuClb07bVTByuZ9pL9J41luA88c_TiHxBqpbl6DADYR89Ki4RXBs1Vd9kUI9DPImCVrA4sDSF4lqDCren6n88d7DakLEBnxUId0SKH22lHwncfDCjlQ84fD9FTvMkoMMd_iHcgUv0QaFXkNUTeCBT_N1kvkBGI10C5gytnHz_7QPV9DeagZXAG7KjJ1KSzr3B7y9MkBoucXc-HjyDGY8Dy0ImABKknFvsAZZ8YLEX4puEuRpcotjFsk2gGi3zS3gQFzcMkdiDwFWELs",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1920&auto=format&fit=crop"
];

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md">
        <div className="flex justify-between items-center px-4 md:px-8 py-4 w-full max-w-screen-2xl mx-auto">
          <div className="font-headline text-xl tracking-[0.2em] text-primary">
            <img src="https://i.postimg.cc/T3gg4NRs/Black-White-Minimal-Simple-Modern-Classic-Photography-Studio-Salt-Logo.png" alt="Logo" className="h-12 md:h-16" />
          </div>
          <div className="hidden md:flex items-center space-x-10">
            <a className="font-label uppercase tracking-widest text-xs text-primary border-b border-primary pb-1" href="#">Ventas</a>
            <a className="font-label uppercase tracking-widest text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Rentas</a>
            <a className="font-label uppercase tracking-widest text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Terrenos</a>
            <a className="font-label uppercase tracking-widest text-xs text-on-surface-variant hover:text-primary transition-colors" href="#">Proyectos</a>
          </div>
          <div className="flex items-center gap-4">
            <a className="hidden md:block bg-primary text-on-primary font-label px-6 py-2 text-xs uppercase tracking-widest hover:bg-primary-container transition-all" href="https://wa.me/59175507570" target="_blank">
              Contactar
            </a>
            <Menu className="text-primary cursor-pointer md:hidden" />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative h-screen w-full flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode='wait'>
            <motion.img
              key={currentIndex}
              className="w-full h-full object-cover"
              src={heroImages[currentIndex]}
              alt="Luxury property"
              referrerPolicy="no-referrer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-r from-surface/80 to-transparent"></div>
        </div>
        <div className="relative z-10 px-6 md:px-24 max-w-5xl py-24">
          <h1 className="font-headline text-4xl md:text-[83px] text-on-surface leading-[1.1] tracking-tight mb-6">
            Raúl Aponte - <span className="italic text-primary">Tu Experto</span> Inmobiliario en Century 21
          </h1>
          <p className="font-body text-lg md:text-[22px] text-on-surface-variant font-light max-w-2xl mb-12 tracking-wide">
            Redefiniendo el estándar de la propiedad raíz en Bolivia a través de un servicio arquitectónico y curado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a className="bg-primary text-on-primary font-label px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-primary-container transition-all text-center" href="https://wa.me/59175507570" target="_blank">
              Contactar Ahora
            </a>
            <a className="border border-outline-variant bg-white/5 backdrop-blur-md text-on-surface font-label px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-white/10 transition-all text-center" href="#properties">
              Ver Portafolio
            </a>
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section className="py-32 px-8 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="font-headline text-4xl md:text-5xl mb-4">Portafolio de Servicios</h2>
            <div className="w-12 h-px bg-primary mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Home, title: 'Venta de Casas', desc: 'Selección curada de residencias de lujo en las zonas más exclusivas.' },
              { icon: Key, title: 'Renta', desc: 'Gestión premium de arrendamientos para perfiles ejecutivos.' },
              { icon: Building, title: 'Departamentos', desc: 'Lofts y penthouses diseñados para el estilo de vida cosmopolita.' },
              { icon: LandPlot, title: 'Terrenos Urbanos', desc: 'Espacios estratégicos para desarrollos inmobiliarios de vanguardia.' },
              { icon: Sprout, title: 'Terrenos Agrícolas', desc: 'Oportunidades de inversión en tierras productivas y de expansión.' },
              { icon: Compass, title: 'Proyectos Inmobiliarios', desc: 'Comercialización exclusiva de nuevos desarrollos y preventas.' },
            ].map((service, i) => (
              <div key={i} className="bg-surface-container p-12 flex flex-col items-center text-center group hover:bg-surface-container-high transition-colors duration-500">
                <service.icon className="text-primary text-5xl mb-6 group-hover:scale-110 transition-transform duration-500" size={48} />
                <h3 className="font-headline text-xl mb-4">{service.title}</h3>
                <p className="font-body text-sm text-on-surface-variant font-light leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section className="py-32 bg-surface" id="properties">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-2xl">
              <span className="font-label text-xs uppercase tracking-[0.3em] text-primary mb-4 block">Propiedades Destacadas</span>
              <h2 className="font-headline text-5xl">Curaduría Exclusiva</h2>
            </div>
            <a className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant hover:text-primary transition-colors flex items-center gap-2" href="#">
              Ver todas las propiedades <ArrowRight size={16} />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
              { title: 'Residencia Los Olivos', price: '$1,250,000', location: 'Santa Cruz, Bolivia', beds: '4 Hab', baths: '5 Baños', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZUdUDId3hBWtXMUoL559nGO37cXNuWYdZbHvzQAWgWbSCC6DyaOnJxKro7Qd5Wb3ruAKNqn3s6KcjpWue7-iRep05SRb0tbqq33BIHlDNnEgYSG5bjF5d5FX0HeekeViZHvYjAXHXx-NdXLM9zWQGc9URFTKjtqZDlcU1tyxiY-kYkx7RK7Mh2wqBRRFK3JmAnDbvkD3kZEJKEJITKregvDH0fsAKeqycTyfnITo60lOI2t93YmiC-zyMnAtytolZyK9A2JAbLvw' },
              { title: 'Penthouse Skyview', price: '$890,000', location: 'Equipetrol, Santa Cruz', beds: '3 Hab', baths: '4 Baños', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFBpHkS8zlJPJLI4dy5cLrdpp_sftHZCZjGodR5ZSNJn4GQ6pO_i8lHxPCDRAqK7jkrUWGz8owRJ24rOhdtTNDi8R82pJL6Z-SE88d5tMpgSlJlw24MBUPqlyEH_Y_vdLUpGWheG6SK9UKbrTFkwTAIBb3xHlkDko_pB3cxjAWLBT30RdCIIQqHEZls5Jf74iWbhAe3C_LfK8PghPVLrzFMrZkJrHSCtw_KVFMB1Ijs3I9BM0TmUKOg_BOxVmUnluSA2e4JGd_m6I' },
              { title: 'Casa de Lujo en Equipetrol', price: '$1,000,000', location: 'Equipetrol, Santa Cruz', beds: '6 Suites', baths: 'Dependencia', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop' },
              { title: 'Departamento Condominio Curupau III', price: '$115,000', location: 'Santa Cruz, Bolivia', beds: '3 Hab', baths: '2 Baños', img: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1000&auto=format&fit=crop' },
            ].map((prop, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="relative overflow-hidden mb-6 aspect-[4/3] bg-surface-container-highest">
                  <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={prop.img} alt={prop.title} referrerPolicy="no-referrer" />
                  <div className="absolute top-6 left-6 bg-primary text-on-primary font-label px-4 py-2 text-xs uppercase tracking-widest font-bold">
                    {prop.price}
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-headline text-2xl mb-2">{prop.title}</h3>
                    <p className="font-body text-on-surface-variant text-sm flex items-center gap-1">
                      <MapPin size={14} /> {prop.location}
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs font-label uppercase tracking-widest text-primary/70">
                    <span>{prop.beds}</span>
                    <span>{prop.baths}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-32 px-6 md:px-8 bg-surface-container">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-headline text-3xl md:text-6xl mb-6 md:mb-8">¿Listo para encontrar su próxima inversión?</h2>
          <p className="font-body text-lg md:text-xl text-on-surface-variant mb-10 md:mb-12 font-light leading-relaxed">
            Raúl Aponte le ofrece asesoría personalizada respaldada por el sello internacional de Century 21.
          </p>
          <a className="inline-flex items-center gap-4 bg-primary text-on-primary font-label px-8 md:px-12 py-4 md:py-5 text-sm uppercase tracking-[0.3em] hover:bg-primary-container transition-all" href="https://wa.me/59175507570" target="_blank">
            Hablar por WhatsApp
            <MessageSquare size={20} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-lowest py-20 px-8 border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-8">
            <div className="text-primary font-headline text-xl tracking-widest">
              RAÚL APONTE | CENTURY 21
            </div>
            <p className="font-body text-sm text-on-surface-variant font-light leading-relaxed max-w-xs">
              Consultor de bienes raíces de lujo especializado en el mercado boliviano. Elevando cada transacción a una experiencia de arte.
            </p>
          </div>
          <div className="space-y-8">
            <h4 className="font-headline text-lg text-primary">Contacto</h4>
            <div className="space-y-4 font-body text-on-surface-variant text-sm font-light">
              <p className="flex items-center gap-3"><Phone size={16} className="text-primary" /> +591 75507570</p>
              <p className="flex items-center gap-3"><Mail size={16} className="text-primary" /> raul.aponte@century21.bo</p>
              <p className="flex items-center gap-3"><MapPin size={16} className="text-primary" /> Santa Cruz, Bolivia</p>
            </div>
          </div>
          <div className="space-y-8">
            <h4 className="font-headline text-lg text-primary">Navegación</h4>
            <div className="grid grid-cols-1 gap-4 font-label text-xs uppercase tracking-widest text-on-surface-variant">
              <a href="#">Ventas</a>
              <a href="#">Rentas</a>
              <a href="#">Terrenos</a>
              <a href="#">Proyectos</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
