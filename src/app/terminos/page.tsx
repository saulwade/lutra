import Link from "next/link";

export const metadata = {
  title: "Términos de uso — Lutra",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Volver al inicio
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-6">Términos de uso</h1>
          <p className="text-sm text-gray-500 mt-2">Última actualización: marzo 2025</p>
        </div>

        <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-6 text-gray-700">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Aceptación</h2>
            <p>
              Al crear una cuenta en Lutra, aceptas estos Términos de uso. Si no estás de acuerdo,
              no uses el servicio. Lutra es una herramienta de software diseñada para profesionales
              de la nutrición en México.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. Descripción del servicio</h2>
            <p>
              Lutra es una plataforma SaaS que permite a nutriólogos gestionar pacientes, crear planes
              alimenticios basados en el Sistema Mexicano de Alimentos Equivalentes (SMAE), generar
              documentos PDF y usar herramientas de asistencia con inteligencia artificial.
            </p>
            <p>
              El servicio no constituye consulta médica ni reemplaza el criterio clínico del profesional.
              La responsabilidad sobre la prescripción nutricional recae exclusivamente en el nutriólogo.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. Uso permitido</h2>
            <p>Puedes usar Lutra únicamente para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Gestionar tu práctica nutricional profesional</li>
              <li>Registrar y atender a tus propios pacientes</li>
              <li>Generar documentos clínicos para uso profesional</li>
            </ul>
            <p>Está prohibido usar Lutra para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Revender, sublicenciar o compartir tu cuenta con terceros</li>
              <li>Almacenar datos de pacientes de otro profesional sin autorización</li>
              <li>Cualquier actividad ilegal o que viole la legislación mexicana</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. Cuenta y seguridad</h2>
            <p>
              Eres responsable de mantener la confidencialidad de tu cuenta y contraseña.
              Debes notificarnos de inmediato si sospechas acceso no autorizado a tu cuenta.
              Lutra no se hace responsable por daños derivados del acceso no autorizado causado
              por negligencia del usuario.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Datos de pacientes</h2>
            <p>
              Los datos clínicos que ingreses pertenecen a ti y a tus pacientes. Lutra los almacena
              de forma segura para brindarte el servicio y no los comparte con terceros salvo lo
              requerido por ley. Consulta nuestra{" "}
              <Link href="/privacidad" className="text-[#974315] underline">
                Política de privacidad
              </Link>{" "}
              para más detalles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Inteligencia artificial</h2>
            <p>
              Las sugerencias generadas por la IA de Lutra son orientativas. No sustituyen el juicio
              clínico del nutriólogo. El profesional es el único responsable de la prescripción
              final entregada al paciente.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. Pagos y cancelación</h2>
            <p>
              El servicio se ofrece mediante suscripción mensual. Puedes cancelar en cualquier momento
              desde tu panel de ajustes. No se realizan reembolsos por períodos parciales una vez
              procesado el cobro del mes en curso.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">8. Disponibilidad</h2>
            <p>
              Lutra no garantiza disponibilidad ininterrumpida del servicio. Realizamos mantenimientos
              periódicos y podemos suspender el servicio por razones técnicas o de seguridad,
              notificando con anticipación cuando sea posible.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">9. Modificaciones</h2>
            <p>
              Podemos modificar estos términos con previo aviso de 15 días por correo electrónico.
              El uso continuado del servicio después de la notificación implica aceptación de los
              nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">10. Contacto</h2>
            <p>
              Para dudas sobre estos términos escríbenos a{" "}
              <a href="mailto:hola@lutra.mx" className="text-[#974315] underline">
                hola@lutra.mx
              </a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
