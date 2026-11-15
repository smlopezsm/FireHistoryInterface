import React, { useEffect, useRef, useState } from 'react';

interface CargarAlVerProps {
  /** Lo que se muestra hasta que el contenedor entra en pantalla (mismo tamaño, sin saltos). */
  esqueleto: React.ReactNode;
  children: React.ReactNode;
  /** Margen para empezar a cargar un poco antes de que se vea. */
  margen?: string;
  className?: string;
}

/**
 * Monta `children` recién cuando el contenedor se acerca a la pantalla. Sirve para
 * diferir módulos pesados (el globo con MapLibre, ~300 kB gzip). Sin IntersectionObserver
 * (navegadores viejos, pruebas) monta enseguida.
 */
export const CargarAlVer: React.FC<CargarAlVerProps> = ({ esqueleto, children, margen = '200px', className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (visible || !ref.current || typeof IntersectionObserver === 'undefined') return;
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { rootMargin: margen },
    );
    observador.observe(ref.current);
    return () => observador.disconnect();
  }, [visible, margen]);

  return (
    <div ref={ref} className={className}>
      {visible ? children : esqueleto}
    </div>
  );
};
