/**
 * Privacy Policy Page
 *
 * Spanish language privacy policy template.
 * Branding is configured via APP_CONFIG (lib/config/app.ts).
 * Customize legal content as needed for your jurisdiction.
 */

import type { Metadata } from 'next';
import { APP_CONFIG } from '@/config/app';

export const metadata: Metadata = {
  title: `Política de Privacidad | ${APP_CONFIG.name}`,
  description: `Política de privacidad y protección de datos de ${APP_CONFIG.name}`,
};

export default function PrivacyPolicyPage() {
  return (
    <article className="prose text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary max-w-none">
      <h1>Política de Privacidad</h1>

      <p className="lead">Última actualización: {APP_CONFIG.dates.updated}</p>

      <p>
        En <strong>{APP_CONFIG.company}</strong> (&quot;nosotros&quot;, &quot;nuestro&quot; o
        &quot;la Empresa&quot;), operador de <strong>{APP_CONFIG.name}</strong>, nos comprometemos a
        proteger tu privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos,
        divulgamos y protegemos tu información cuando utilizas nuestro servicio.
      </p>

      {/* ================================================================= */}
      <h2>1. Información que Recopilamos</h2>

      <h3>1.1 Información que nos proporcionas</h3>
      <ul>
        <li>
          <strong>Información de cuenta:</strong> nombre, dirección de correo electrónico,
          contraseña (encriptada)
        </li>
        <li>
          <strong>Información de perfil:</strong> foto de perfil, preferencias
        </li>
        <li>
          <strong>Comunicaciones:</strong> mensajes que nos envías a través de soporte
        </li>
      </ul>

      <h3>1.2 Información recopilada automáticamente</h3>
      <ul>
        <li>
          <strong>Datos de uso:</strong> páginas visitadas, acciones realizadas, tiempo de uso
        </li>
        <li>
          <strong>Información del dispositivo:</strong> tipo de navegador, sistema operativo,
          dirección IP
        </li>
        <li>
          <strong>Cookies:</strong> identificadores únicos para mejorar tu experiencia
        </li>
      </ul>

      <h3>1.3 Información de terceros</h3>
      <p>
        Si inicias sesión mediante proveedores como Google, recibimos información básica de tu
        perfil según los permisos que otorgues.
      </p>

      {/* ================================================================= */}
      <h2>2. Cómo Usamos tu Información</h2>

      <p>Utilizamos la información recopilada para:</p>
      <ul>
        <li>Proporcionar, mantener y mejorar nuestros servicios</li>
        <li>Procesar transacciones y enviar notificaciones relacionadas</li>
        <li>Responder a tus comentarios, preguntas y solicitudes de soporte</li>
        <li>Enviar comunicaciones de marketing (con tu consentimiento)</li>
        <li>Detectar, investigar y prevenir actividades fraudulentas</li>
        <li>Cumplir con obligaciones legales</li>
      </ul>

      {/* ================================================================= */}
      <h2>3. Compartir Información</h2>

      <p>
        <strong>No vendemos tu información personal.</strong> Podemos compartir información en las
        siguientes circunstancias:
      </p>

      <ul>
        <li>
          <strong>Proveedores de servicios:</strong> empresas que nos ayudan a operar (hosting,
          análisis, email)
        </li>
        <li>
          <strong>Cumplimiento legal:</strong> cuando la ley lo requiera o para proteger nuestros
          derechos
        </li>
        <li>
          <strong>Transferencias comerciales:</strong> en caso de fusión, adquisición o venta de
          activos
        </li>
        <li>
          <strong>Con tu consentimiento:</strong> cuando nos autorices explícitamente
        </li>
      </ul>

      {/* ================================================================= */}
      <h2>4. Cookies y Tecnologías Similares</h2>

      <p>Utilizamos cookies para:</p>
      <ul>
        <li>Mantener tu sesión iniciada</li>
        <li>Recordar tus preferencias</li>
        <li>Analizar el uso del servicio</li>
        <li>Personalizar contenido</li>
      </ul>

      <p>
        Puedes configurar tu navegador para rechazar cookies, aunque esto puede afectar la
        funcionalidad del servicio.
      </p>

      {/* ================================================================= */}
      <h2>5. Seguridad de Datos</h2>

      <p>
        Implementamos medidas de seguridad técnicas y organizativas para proteger tu información,
        incluyendo:
      </p>
      <ul>
        <li>Encriptación de datos en tránsito (HTTPS/TLS)</li>
        <li>Encriptación de contraseñas (bcrypt)</li>
        <li>Acceso restringido a datos personales</li>
        <li>Monitoreo de seguridad continuo</li>
      </ul>

      <p>
        Sin embargo, ningún método de transmisión o almacenamiento es 100% seguro. No podemos
        garantizar seguridad absoluta.
      </p>

      {/* ================================================================= */}
      <h2>6. Tus Derechos</h2>

      <p>Dependiendo de tu ubicación, puedes tener derecho a:</p>
      <ul>
        <li>
          <strong>Acceso:</strong> solicitar copia de tus datos personales
        </li>
        <li>
          <strong>Rectificación:</strong> corregir datos inexactos
        </li>
        <li>
          <strong>Eliminación:</strong> solicitar la eliminación de tus datos
        </li>
        <li>
          <strong>Portabilidad:</strong> recibir tus datos en formato estructurado
        </li>
        <li>
          <strong>Oposición:</strong> oponerte al procesamiento de tus datos
        </li>
        <li>
          <strong>Restricción:</strong> limitar cómo usamos tus datos
        </li>
      </ul>

      <p>
        Para ejercer estos derechos, contáctanos en{' '}
        <a href={`mailto:${APP_CONFIG.email.privacy}`}>{APP_CONFIG.email.privacy}</a>.
      </p>

      {/* ================================================================= */}
      <h2>7. Retención de Datos</h2>

      <p>
        Conservamos tu información mientras mantengas una cuenta activa o según sea necesario para
        proporcionarte servicios. También podemos retener información para cumplir con obligaciones
        legales, resolver disputas y hacer cumplir nuestros acuerdos.
      </p>

      {/* ================================================================= */}
      <h2>8. Transferencias Internacionales</h2>

      <p>
        Tu información puede ser transferida y almacenada en servidores ubicados fuera de tu país de
        residencia. Al usar nuestro servicio, consientes estas transferencias.
      </p>

      {/* ================================================================= */}
      <h2>9. Menores de Edad</h2>

      <p>
        Nuestro servicio no está dirigido a menores de 13 años. No recopilamos intencionalmente
        información de niños. Si descubrimos que hemos recopilado información de un menor, la
        eliminaremos.
      </p>

      {/* ================================================================= */}
      <h2>10. Cambios a esta Política</h2>

      <p>
        Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios
        significativos publicando la nueva política en esta página y actualizando la fecha de
        &quot;última actualización&quot;.
      </p>

      <p>
        Te recomendamos revisar esta política regularmente para estar informado sobre cómo
        protegemos tu información.
      </p>

      {/* ================================================================= */}
      <h2>11. Contacto</h2>

      <p>Si tienes preguntas sobre esta Política de Privacidad, contáctanos:</p>

      <ul>
        <li>
          <strong>Email:</strong>{' '}
          <a href={`mailto:${APP_CONFIG.email.privacy}`}>{APP_CONFIG.email.privacy}</a>
        </li>
        <li>
          <strong>Empresa:</strong> {APP_CONFIG.company}
        </li>
        <li>
          <strong>País:</strong> {APP_CONFIG.country}
        </li>
      </ul>

      {/* ================================================================= */}
      <hr />

      <p className="text-muted-foreground text-sm">
        Esta política cumple con los requisitos generales de GDPR y CCPA. Consulta con un abogado
        para asegurar cumplimiento específico en tu jurisdicción.
      </p>
    </article>
  );
}
