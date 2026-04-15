import { LegalPage } from "@/components/themes/realtor-v1/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de Privacidad">
      <p className="font-medium text-[#6B7565] italic mb-8">
        Última actualización: 15 de Abril, 2026
      </p>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-medium text-[#262626]">1. Introducción</h2>
        <p>
          Central Bolivia (el "Servicio"), operado por Thirlz Network LLC, una compañía constituida en los Estados Unidos, y dirigida por Alejandro Soria, se compromete a proteger su privacidad. Esta política describe cómo manejamos sus datos.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-medium text-[#262626]">2. Información que Recopilamos a través de Google</h2>
        <p>Al utilizar el inicio de sesión de Google, Central solicita acceso a:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Perfil de Google:</strong> Nombre y correo electrónico para crear su cuenta.</li>
          <li><strong>Google Calendar:</strong> Para sincronizar su disponibilidad y agendar visitas de clientes automáticamente.</li>
          <li><strong>Gmail:</strong> Para enviar notificaciones de prospectos (leads) directamente a su bandeja de entrada.</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-medium text-[#262626]">3. Uso de los Datos</h2>
        <p>
          Solo utilizamos el acceso a sus herramientas de Google para facilitar la operatividad de su portal inmobiliario. Central Bolivia no vende, alquila ni comparte sus datos personales o los de sus clientes con terceros.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-medium text-[#262626]">4. Seguridad de los Datos</h2>
        <p>
          Implementamos medidas de seguridad de nivel empresarial para proteger su información. Al ser operados por Thirlz Network LLC en EE.UU., seguimos estándares internacionales de protección de datos.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-medium text-[#262626]">5. Sus Derechos</h2>
        <p>
          Usted puede revocar el acceso de Central a su cuenta de Google en cualquier momento desde la configuración de seguridad de su cuenta de Google.
        </p>
      </section>
    </LegalPage>
  );
}
