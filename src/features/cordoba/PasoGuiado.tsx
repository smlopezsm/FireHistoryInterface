import { useEffect, useRef } from 'react';
import type { TooltipRenderProps } from 'react-joyride';

export const claseBotonPrincipalGuia = "inline-flex min-h-10 items-center justify-center rounded-md bg-[#B8EE68] px-3 py-2 text-sm font-semibold text-[#07100F] hover:bg-[#CBF58C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8EE68]";

const interactivos = 'button, input, select, a[href], [tabindex]';

export function PasoGuiado({ step, index, backProps, primaryProps, skipProps, isLastStep }: TooltipRenderProps) {
  const tarjeta = useRef<HTMLElement>(null);

  useEffect(() => {
    tarjeta.current?.focus({ preventScroll: true });
    const moverFoco = (evento: KeyboardEvent) => {
      if (evento.key !== 'Tab' || evento.defaultPrevented) return;
      const objetivo = step.target;
      const elemento = typeof objetivo === 'string' ? document.querySelector<HTMLElement>(objetivo)
        : typeof objetivo === 'function' ? objetivo()
        : objetivo instanceof HTMLElement ? objetivo : objetivo?.current;
      const elementos = [elemento, tarjeta.current].flatMap((raiz) => {
        if (!raiz) return [];
        const nodos = Array.from(raiz.querySelectorAll<HTMLElement>(interactivos));
        if (raiz instanceof HTMLElement && raiz.matches(interactivos)) nodos.unshift(raiz);
        return nodos.filter((nodo) => nodo.tabIndex >= 0 && !nodo.matches(':disabled') && nodo.getClientRects().length > 0);
      });
      if (!elementos.length) return;
      evento.preventDefault();
      const actual = elementos.findIndex((nodo) => nodo === document.activeElement);
      const siguiente = actual === -1
        ? (evento.shiftKey ? elementos.length - 1 : 0)
        : (actual + (evento.shiftKey ? -1 : 1) + elementos.length) % elementos.length;
      elementos[siguiente]?.focus();
    };
    window.addEventListener('keydown', moverFoco);
    return () => window.removeEventListener('keydown', moverFoco);
  }, [step.id, step.target]);

  return (
    <section
      ref={tarjeta}
      role="dialog"
      aria-labelledby="guia-cordoba-titulo"
      aria-describedby="guia-cordoba-contenido"
      tabIndex={-1}
      className="react-joyride__tooltip rounded-xl border border-[#34493F] bg-[#0D1816] p-4 text-[#EFF5ED] shadow-2xl outline-none"
      style={{ width: 'min(358px, calc(100vw - 28px))' }}
    >
      <h2 id="guia-cordoba-titulo">{step.title}</h2>
      <div id="guia-cordoba-contenido" className="mt-2 max-h-[min(29dvh,15rem)] overflow-y-auto lg:max-h-[min(42dvh,19rem)]">
        {step.content}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#21312D] pt-3 text-sm">
        {!isLastStep && <button type="button" className="mr-auto min-h-10 px-1 text-[#C8D3CE] underline underline-offset-4" {...skipProps} />}
        {index > 0 && <button type="button" className="min-h-10 rounded-md border border-[#34493F] px-3 hover:border-[#B8EE68]" {...backProps} />}
        <button type="button" className={claseBotonPrincipalGuia} {...primaryProps} />
      </div>
    </section>
  );
}
