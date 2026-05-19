/**
 * Terms of Service Page
 *
 * Spanish language terms of service template.
 * Branding is configured via APP_CONFIG (lib/config/app.ts).
 * Customize legal content as needed for your jurisdiction.
 */

import type { Metadata } from 'next';
import { APP_CONFIG } from '@/config/app';

export const metadata: Metadata = {
  title: `Términos de Servicio | ${APP_CONFIG.name}`,
  description: `Términos y condiciones de uso de ${APP_CONFIG.name}`,
};

export default function TermsOfServicePage() {
  return (
    <article className="prose text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary max-w-none">
      <h1>Términos de Servicio</h1>

      <p className="lead">Última actualización: {APP_CONFIG.dates.updated}</p>

      <p>
        Bienvenido a <strong>{APP_CONFIG.name}</strong>. Estos Términos de Servicio
        (&quot;Términos&quot;) rigen tu acceso y uso de los servicios, sitio web y aplicaciones
        (colectivamente, el &quot;Servicio&quot;) operados por <strong>{APP_CONFIG.company}</strong>{' '}
        (&quot;nosotros&quot;, &quot;nuestro&quot; o &quot;la Empresa&quot;).
      </p>

      <p>
        <strong>
          Al acceder o usar el Servicio, aceptas estar sujeto a estos Términos. Si no estás de
          acuerdo, no utilices el Servicio.
        </strong>
      </p>

      {/* ================================================================= */}
      <h2>1. Aceptación de Términos</h2>

      <p>Al crear una cuenta o usar el Servicio, confirmas que:</p>
      <ul>
        <li>Tienes al menos 18 años de edad o la mayoría de edad legal en tu jurisdicción</li>
        <li>Tienes la capacidad legal para aceptar estos Términos</li>
        <li>Has leído y comprendido nuestra Política de Privacidad</li>
        <li>Usarás el Servicio de manera legal y conforme a estos Términos</li>
      </ul>

      {/* ================================================================= */}
      <h2>2. Descripción del Servicio</h2>

      <p>
        {APP_CONFIG.name} proporciona [descripción breve del servicio]. Nos reservamos el derecho de
        modificar, suspender o discontinuar cualquier aspecto del Servicio en cualquier momento.
      </p>

      {/* ================================================================= */}
      <h2>3. Registro y Cuenta</h2>

      <h3>3.1 Creación de cuenta</h3>
      <p>
        Para acceder a ciertas funcionalidades, debes crear una cuenta proporcionando información
        precisa y completa.
      </p>

      <h3>3.2 Seguridad de la cuenta</h3>
      <p>Eres responsable de:</p>
      <ul>
        <li>Mantener la confidencialidad de tus credenciales</li>
        <li>Todas las actividades realizadas bajo tu cuenta</li>
        <li>Notificarnos inmediatamente sobre uso no autorizado</li>
      </ul>

      <h3>3.3 Una cuenta por persona</h3>
      <p>
        Cada usuario debe mantener una sola cuenta. Las cuentas múltiples pueden resultar en
        suspensión.
      </p>

      {/* ================================================================= */}
      <h2>4. Uso Aceptable</h2>

      <p>Al usar el Servicio, aceptas NO:</p>
      <ul>
        <li>Violar leyes aplicables o derechos de terceros</li>
        <li>Enviar spam, malware o contenido malicioso</li>
        <li>Intentar acceder sin autorización a sistemas o datos</li>
        <li>Interferir con el funcionamiento del Servicio</li>
        <li>Suplantar identidad de personas u organizaciones</li>
        <li>Usar el Servicio para actividades ilegales o fraudulentas</li>
        <li>Recopilar información de otros usuarios sin consentimiento</li>
        <li>Eludir medidas de seguridad o limitaciones de uso</li>
      </ul>

      {/* ================================================================= */}
      <h2>5. Contenido del Usuario</h2>

      <h3>5.1 Tu contenido</h3>
      <p>
        Retienes todos los derechos sobre el contenido que publicas. Al publicar contenido, nos
        otorgas una licencia mundial, no exclusiva, libre de regalías para usar, reproducir,
        modificar y mostrar dicho contenido en conexión con el Servicio.
      </p>

      <h3>5.2 Responsabilidad del contenido</h3>
      <p>
        Eres el único responsable del contenido que publicas. No respaldamos ni garantizamos la
        precisión del contenido de usuarios.
      </p>

      <h3>5.3 Contenido prohibido</h3>
      <p>No publiques contenido que:</p>
      <ul>
        <li>Sea ilegal, difamatorio, obsceno o amenazante</li>
        <li>Infrinja derechos de propiedad intelectual</li>
        <li>Contenga información personal de terceros sin consentimiento</li>
        <li>Promueva odio, discriminación o violencia</li>
      </ul>

      {/* ================================================================= */}
      <h2>6. Propiedad Intelectual</h2>

      <h3>6.1 Nuestros derechos</h3>
      <p>
        El Servicio, incluyendo su diseño, código, logotipos, marcas y contenido (excluyendo
        contenido de usuarios), son propiedad de {APP_CONFIG.company} y están protegidos por leyes
        de propiedad intelectual.
      </p>

      <h3>6.2 Licencia limitada</h3>
      <p>
        Te otorgamos una licencia limitada, no exclusiva, no transferible para usar el Servicio para
        fines personales o comerciales según lo permitido por estos Términos.
      </p>

      <h3>6.3 Restricciones</h3>
      <p>No puedes:</p>
      <ul>
        <li>Copiar, modificar o distribuir el Servicio</li>
        <li>Descompilar, realizar ingeniería inversa o desensamblar el software</li>
        <li>Usar nuestras marcas sin autorización escrita</li>
      </ul>

      {/* ================================================================= */}
      <h2>7. Pagos y Facturación</h2>

      <p>Si el Servicio incluye funciones de pago:</p>
      <ul>
        <li>Los precios se muestran en la moneda indicada</li>
        <li>Los pagos se procesan a través de proveedores externos seguros</li>
        <li>Las suscripciones se renuevan automáticamente hasta cancelación</li>
        <li>Los reembolsos se manejan según nuestra política de reembolsos</li>
      </ul>

      {/* ================================================================= */}
      <h2>8. Terminación</h2>

      <h3>8.1 Por tu parte</h3>
      <p>
        Puedes cerrar tu cuenta en cualquier momento desde la configuración de tu perfil o
        contactándonos.
      </p>

      <h3>8.2 Por nuestra parte</h3>
      <p>Podemos suspender o terminar tu acceso si:</p>
      <ul>
        <li>Violas estos Términos</li>
        <li>Tu conducta perjudica a otros usuarios o al Servicio</li>
        <li>Lo requiere la ley</li>
        <li>Discontinuamos el Servicio</li>
      </ul>

      <h3>8.3 Efectos de la terminación</h3>
      <p>
        Tras la terminación, perderás acceso al Servicio. Podemos eliminar tu contenido según
        nuestra política de retención de datos.
      </p>

      {/* ================================================================= */}
      <h2>9. Exención de Garantías</h2>

      <p>
        <strong>
          EL SERVICIO SE PROPORCIONA &quot;TAL CUAL&quot; Y &quot;SEGÚN DISPONIBILIDAD&quot;, SIN
          GARANTÍAS DE NINGÚN TIPO, EXPRESAS O IMPLÍCITAS.
        </strong>
      </p>

      <p>No garantizamos que:</p>
      <ul>
        <li>El Servicio sea ininterrumpido o libre de errores</li>
        <li>Los defectos serán corregidos</li>
        <li>El Servicio cumpla tus expectativas específicas</li>
      </ul>

      {/* ================================================================= */}
      <h2>10. Limitación de Responsabilidad</h2>

      <p>
        <strong>
          EN LA MEDIDA MÁXIMA PERMITIDA POR LA LEY, {APP_CONFIG.company.toUpperCase()} NO SERÁ
          RESPONSABLE POR DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENTES O PUNITIVOS,
          INCLUYENDO PÉRDIDA DE BENEFICIOS, DATOS O BUENA VOLUNTAD.
        </strong>
      </p>

      <p>
        Nuestra responsabilidad total no excederá la cantidad que hayas pagado por el Servicio en
        los últimos 12 meses, o $100 USD, lo que sea mayor.
      </p>

      {/* ================================================================= */}
      <h2>11. Indemnización</h2>

      <p>
        Aceptas indemnizar y mantener indemne a {APP_CONFIG.company}, sus directores, empleados y
        agentes de cualquier reclamación, daño o gasto (incluyendo honorarios de abogados) que surja
        de:
      </p>
      <ul>
        <li>Tu uso del Servicio</li>
        <li>Tu violación de estos Términos</li>
        <li>Tu violación de derechos de terceros</li>
        <li>Tu contenido</li>
      </ul>

      {/* ================================================================= */}
      <h2>12. Cambios a los Términos</h2>

      <p>
        Podemos modificar estos Términos en cualquier momento. Los cambios entrarán en vigor al
        publicarse en el Servicio. El uso continuado después de cambios constituye aceptación de los
        nuevos Términos.
      </p>

      <p>
        Para cambios significativos, intentaremos notificarte por email o mediante aviso en el
        Servicio.
      </p>

      {/* ================================================================= */}
      <h2>13. Ley Aplicable y Jurisdicción</h2>

      <p>
        Estos Términos se rigen por las leyes de <strong>{APP_CONFIG.country}</strong>, sin
        considerar sus disposiciones sobre conflictos de leyes.
      </p>

      <p>
        Cualquier disputa se resolverá en los tribunales de {APP_CONFIG.country}, y ambas partes
        consienten a la jurisdicción de dichos tribunales.
      </p>

      {/* ================================================================= */}
      <h2>14. Disposiciones Generales</h2>

      <ul>
        <li>
          <strong>Acuerdo completo:</strong> Estos Términos constituyen el acuerdo completo entre tú
          y nosotros.
        </li>
        <li>
          <strong>Divisibilidad:</strong> Si alguna disposición es inválida, las demás permanecen en
          vigor.
        </li>
        <li>
          <strong>Renuncia:</strong> La falta de ejercicio de un derecho no constituye renuncia al
          mismo.
        </li>
        <li>
          <strong>Cesión:</strong> No puedes ceder estos Términos sin nuestro consentimiento.
        </li>
      </ul>

      {/* ================================================================= */}
      <h2>15. Contacto</h2>

      <p>Para preguntas sobre estos Términos:</p>

      <ul>
        <li>
          <strong>Email:</strong>{' '}
          <a href={`mailto:${APP_CONFIG.email.legal}`}>{APP_CONFIG.email.legal}</a>
        </li>
        <li>
          <strong>Empresa:</strong> {APP_CONFIG.company}
        </li>
        <li>
          <strong>Sitio web:</strong> {APP_CONFIG.url}
        </li>
        <li>
          <strong>País:</strong> {APP_CONFIG.country}
        </li>
      </ul>

      {/* ================================================================= */}
      <hr />

      <p className="text-muted-foreground text-sm">
        Estos términos son una plantilla general. Consulta con un abogado para asegurar cumplimiento
        legal en tu jurisdicción específica.
      </p>
    </article>
  );
}
