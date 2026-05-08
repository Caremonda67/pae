// Boton para instalar la app (PWA).
// - En Android/Chrome usa el evento beforeinstallprompt: cuando el
//   navegador detecta que la app es instalable, aparece el boton y
//   al tocarlo se muestra la confirmacion de instalacion.
// - En iOS Safari no existe ese evento, asi que mostramos un aviso
//   con los pasos manuales (Compartir -> Agregar a pantalla de inicio).
// - Al instalarse (evento appinstalled) el boton desaparece.

import { useEffect, useState } from "react";

// ¿iOS? Safari no soporta beforeinstallprompt, solo guia manual.
function esIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function InstalarApp() {
  const [instalable, setInstalable] = useState(false);
  const [instalado, setInstalado] = useState(false);
  // El evento de instalacion se guarda para poder llamar a prompt()
  const [eventoPendiente, setEventoPendiente] = useState<Event | null>(null);
  // iOS: enseña las instrucciones al tocar el boton
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  useEffect(() => {
    // Android/Chrome: el navegador avisa cuando la app es instalable
    const alPoderInstalar = (e: Event) => {
      e.preventDefault();
      setEventoPendiente(e);
      setInstalable(true);
    };

    const alInstalar = () => setInstalado(true);

    window.addEventListener("beforeinstallprompt", alPoderInstalar);
    window.addEventListener("appinstalled", alInstalar);

    // iOS no dispara beforeinstallprompt: lo detectamos por user-agent
    if (esIOS()) setInstalable(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", alPoderInstalar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  const instalar = async () => {
    if (eventoPendiente) {
      // @ts-expect-error beforeinstallprompt tiene metodo prompt()
      await eventoPendiente.prompt();
      // @ts-expect-error idem
      const { outcome } = await eventoPendiente.userChoice;
      if (outcome === "accepted") setInstalado(true);
      setEventoPendiente(null);
      setInstalable(false);
      return;
    }
    // iOS: mostramos las instrucciones
    setMostrarAyuda(true);
  };

  // Oculto si ya se instalo o si el navegador no permite instalarla
  if (!instalable || instalado) return null;

  return (
    <div className="instalar-app" role="region" aria-label="Instalar la aplicación">
      {mostrarAyuda && (
        <div className="instalar-ayuda" role="alert">
          <strong>📲 Instalar PAE en tu celular</strong>
          <ol>
            <li>Toca el botón <strong>Compartir</strong> de Safari (el cuadrado con la flecha ↑).</li>
            <li>Desplázate y toca <strong>Agregar a pantalla de inicio</strong>.</li>
            <li>Confirma con <strong>Agregar</strong>. ¡Listo! 🎉</li>
          </ol>
          <button
            type="button"
            className="boton boton-secundario"
            onClick={() => setMostrarAyuda(false)}
          >
            Cerrar
          </button>
        </div>
      )}

      <button type="button" className="instalar-boton" onClick={instalar}>
        📲 Instalar la app
      </button>
    </div>
  );
}

export default InstalarApp;
