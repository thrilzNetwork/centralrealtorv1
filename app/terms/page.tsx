import { LegalPage } from "@/components/themes/realtor-v1/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage title="Términos de Servicio">
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-medium text-[#262626]">1. Aceptación de los Términos</h2>
        <p>
          Al registrarse en Central Bolivia, usted acepta estos términos. El servicio es operado por Thirlz Network LLC (USA).
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-medium text-[#262626]">2. Descripción del Servicio</h2>
        <p>
          Central proporciona una plataforma de inteligencia inmobiliaria que incluye creación de portales, gestión de leads mediante IA, generación de contenido multimedia (Nano Banana Pro/Veo) y automatización de marketing.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-medium text-[#262626]">3. Suscripciones y Pagos</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Plan Pro:</strong> $49 USD/mes.</li>
          <li><strong>Plan Elite:</strong> $69 USD/mes.</li>
        </ul>
        <p className="mt-4">
          Los pagos son procesados de forma segura. El incumplimiento del pago resultará en la suspensión del acceso a las herramientas premium y la eliminación del portal tras el periodo de gracia.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-medium text-[#262626]">Cualquier disputa legal relacionada con Central Bolivia será regida por las leyes del estado donde reside Thirlz Network LLC en los Estados Unidos.</h2>
        <p>
          El servicio se proporciona "tal cual".
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-medium text-[#262626]">4. Uso de Inteligencia Artificial</h2>
        <p>
          Usted entiende que el contenido generado por IA (textos, videos y fotos) es una herramienta de apoyo. El usuario es responsable de revisar y validar la veracidad de la información de sus propiedades.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-medium text-[#262626]">5. Limitación de Responsabilidad</h2>
        <p>
          Thirlz Network LLC y su director, Alejandro Soria, no se hacen responsables por pérdidas de negocio o errores en el agendamiento derivados del uso de la tecnología.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-medium text-[#262626]">6. Jurisdicción</h2>
        <p>
          Cualquier disputa legal relacionada con Central Bolivia será regida por las leyes del estado donde reside Thirlz Network LLC en los Estados Unidos.
        </p>
      </section>
    </LegalPage>
  );
}
