/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-19.
 * Iconos de trazo para la navegación y el inicio. No sustituyen texto.
 */
export default function Icono({ nombre }) {
  return (
    <svg className="icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {nombre === 'casa' ? <path d="M4 10.5 12 4l8 6.5V20H15v-6H9v6H4z" /> : null}
      {nombre === 'lupa' ? (
        <>
          <circle cx="11" cy="11" r="6" />
          <path d="m20 20-3.5-3.5" />
        </>
      ) : null}
      {nombre === 'documento' ? (
        <path d="M7 3.5h7l5 5V20.5H7zM14 3.5V9h5.5" />
      ) : null}
      {nombre === 'personas' ? (
        <>
          <circle cx="9" cy="8" r="2.2" />
          <path d="M4.5 18.5c.6-2.6 2.4-4 4.5-4s3.9 1.4 4.5 4" />
          <circle cx="16" cy="8.5" r="1.8" />
          <path d="M15.2 14.6c1.6.3 2.8 1.4 3.3 3.4" />
        </>
      ) : null}
      {nombre === 'calendario' ? (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3.5v3M16 3.5v3M4 10h16" />
        </>
      ) : null}
      {nombre === 'carpeta' ? <path d="M3.5 7.5h6l2 2H20.5V19H3.5z" /> : null}
      {nombre === 'corazon' ? (
        <path d="M12 19s-7-4.2-7-8.2A3.6 3.6 0 0 1 12 8a3.6 3.6 0 0 1 7 2.8C19 14.8 12 19 12 19z" />
      ) : null}
      {nombre === 'grafico' ? <path d="M5 19V10M12 19V5M19 19v-7" /> : null}
      {nombre === 'ajuste' ? (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3.5v2.2M12 18.3v2.2M4.8 6.8l1.6 1.6M17.6 15.6l1.6 1.6" />
          <path d="M3.5 12h2.2M18.3 12h2.2M4.8 17.2l1.6-1.6M17.6 8.4l1.6-1.6" />
        </>
      ) : null}
      {nombre === 'aviso' ? (
        <>
          <path d="M12 4.5 20 19H4z" />
          <path d="M12 10v4M12 16.5h.01" />
        </>
      ) : null}
    </svg>
  );
}
