import Link from "next/link";

export const metadata = {
  title: "Política de privacidad — Lutra",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Volver al inicio
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-6">Política de privacidad</h1>
          <p className="text-sm text-gray-500 mt-2">Última actualización: marzo 2025</p>
        </div>

        <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-6 text-gray-700">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Responsable del tratamiento</h2>
            <p>
              Lutra es el responsable del tratamiento de tus datos personales, de conformidad con la
              Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)
              y su Reglamento, vigentes en los Estados Unidos Mexicanos.
            </p>
            <p>
              Contacto del responsable:{" "}
              <a href="mailto:hola@lutra.mx" className="text-[#974315] underline">
                hola@lutra.mx
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. Datos que recopilamos</h2>
            <p>Recopilamos los siguientes datos personales:</p>
            <p className="font-medium text-gray-800 mt-3">Del nutriólogo (titular de la cuenta):</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nombre completo</li>
              <li>Correo electrónico</li>
              <li>Cédula profesional</li>
              <li>Nombre del consultorio o clínica</li>
              <li>Datos de facturación (cuando aplique)</li>
            </ul>
            <p className="font-medium text-gray-800 mt-3">De los pacientes registrados por el nutriólogo:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nombre y datos de contacto (correo, teléfono)</li>
              <li>Datos antropométricos (peso, talla, composición corporal)</li>
              <li>Historia clínica y antecedentes de salud</li>
              <li>Planes de alimentación y recordatorios dietéticos</li>
              <li>Notas de consulta</li>
            </ul>
            <p className="mt-2">
              <strong>Nota importante:</strong> Los datos de los pacientes son ingresados directamente
              por el nutriólogo. Lutra actúa como encargado del tratamiento respecto a esos datos,
              cuyo responsable es el propio nutriólogo frente a sus pacientes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. Finalidades del tratamiento</h2>
            <p>Usamos tus datos para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Crear y gestionar tu cuenta de usuario</li>
              <li>Brindarte las funcionalidades de la plataforma</li>
              <li>Procesar pagos y emitir comprobantes</li>
              <li>Enviarte comunicaciones del servicio (actualizaciones, alertas de seguridad)</li>
              <li>Mejorar la plataforma mediante análisis de uso agregado y anonimizado</li>
            </ul>
            <p className="mt-2">
              No vendemos ni compartimos tus datos personales con terceros para fines de marketing.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. Transferencia de datos</h2>
            <p>
              Podemos transferir tus datos a proveedores de tecnología que nos apoyan en la operación
              del servicio (almacenamiento en la nube, autenticación, procesamiento de pagos), quienes
              están obligados contractualmente a tratar la información de forma confidencial y segura.
              Estas transferencias son necesarias para la prestación del servicio.
            </p>
            <p className="mt-2">
              No realizamos transferencias internacionales de datos personales sensibles sin tu
              consentimiento expreso, salvo las inherentes al uso de servicios de infraestructura
              globales (cómputo en la nube).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Seguridad</h2>
            <p>
              Implementamos medidas técnicas y organizativas para proteger tus datos:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Transmisión cifrada (HTTPS/TLS)</li>
              <li>Autenticación segura con verificación de identidad</li>
              <li>Acceso restringido a datos por nutriólogo (cada usuario solo ve sus propios pacientes)</li>
              <li>Copias de seguridad automáticas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Derechos ARCO</h2>
            <p>
              Como titular de datos personales tienes derecho a Acceder, Rectificar, Cancelar u
              Oponerte al tratamiento de tus datos (derechos ARCO). Para ejercerlos, escríbenos a{" "}
              <a href="mailto:hola@lutra.mx" className="text-[#974315] underline">
                hola@lutra.mx
              </a>{" "}
              con el asunto "Derechos ARCO". Atenderemos tu solicitud en un plazo máximo de 20 días
              hábiles conforme a la LFPDPPP.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. Cookies</h2>
            <p>
              Lutra utiliza cookies de sesión necesarias para el funcionamiento del servicio
              (autenticación de usuario). No utilizamos cookies de rastreo publicitario de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">8. Retención de datos</h2>
            <p>
              Conservamos tus datos mientras tu cuenta esté activa. Al cancelar tu cuenta, eliminamos
              tus datos en un plazo de 30 días, salvo obligación legal de conservarlos por un período
              mayor.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">9. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política en cualquier momento. Te notificaremos por correo
              electrónico con al menos 15 días de anticipación cuando los cambios sean significativos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">10. Contacto</h2>
            <p>
              Para cualquier consulta sobre privacidad o el tratamiento de tus datos:{" "}
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
