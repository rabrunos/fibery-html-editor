type IconOptions = { className?: string };

function iconClassAttr(options: IconOptions | undefined, fallback: string): string {
  const raw = String(options?.className || '').trim();
  const next = raw || fallback;
  return next.replace(/"/g, '&quot;');
}

function iconStrokeSvg(pathMarkup: string, options: IconOptions | undefined, fallbackClass: string): string {
  return `<svg class="${iconClassAttr(options, fallbackClass)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${pathMarkup}</svg>`;
}

function iconFillSvg(pathMarkup: string, options: IconOptions | undefined, fallbackClass: string): string {
  return `<svg class="${iconClassAttr(options, fallbackClass)}" viewBox="0 0 24 24" fill="currentColor">${pathMarkup}</svg>`;
}

function iconClose(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>', options, 'h-4 w-4');
}

function iconPlus(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>', options, 'h-4 w-4');
}

function iconSearch(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>', options, 'h-4 w-4');
}

function iconMoreVertical(options?: IconOptions): string {
  return iconFillSvg('<path d="M12 8.25a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM13.5 17.25a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/>', options, 'h-4 w-4');
}

function iconChevronLeft(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>', options, 'h-4 w-4');
}

function iconChevronRight(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5 15.75 12l-7.5 7.5"/>', options, 'h-4 w-4');
}

function iconChevronDown(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>', options, 'h-4 w-4');
}

function iconCode(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="m8 9-3 3 3 3m8-6 3 3-3 3M13 6l-2 12"/>', options, 'h-4 w-4');
}

function iconSettings(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.184 1.104c.07.423.354.779.75.944l.11.046c.394.168.844.12 1.199-.121l.927-.626a1.125 1.125 0 0 1 1.45.12l1.832 1.833c.389.389.44.996.12 1.45l-.626.927c-.24.355-.289.805-.121 1.199l.046.11c.165.396.521.68.944.75l1.104.184c.542.09.94.56.94 1.11v2.593c0 .55-.398 1.02-.94 1.11l-1.104.184c-.423.07-.779.354-.944.75l-.046.11c-.168.394-.12.844.121 1.199l.626.927c.32.454.269 1.061-.12 1.45l-1.833 1.832a1.125 1.125 0 0 1-1.45.12l-.927-.626a1.35 1.35 0 0 0-1.199-.121l-.11.046c-.396.165-.68.521-.75.944l-.184 1.104c-.09.542-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.184-1.104a1.35 1.35 0 0 0-.75-.944l-.11-.046a1.35 1.35 0 0 0-1.199.121l-.927.626a1.125 1.125 0 0 1-1.45-.12l-1.832-1.833a1.125 1.125 0 0 1-.12-1.45l.626-.927c.24-.355.289-.805.121-1.199l-.046-.11a1.35 1.35 0 0 0-.944-.75l-1.104-.184A1.125 1.125 0 0 1 1.5 15.797v-2.593c0-.55.398-1.02.94-1.11l1.104-.184c.423-.07.779-.354.944-.75l.046-.11c.168-.394.12-.844-.121-1.199l-.626-.927a1.125 1.125 0 0 1 .12-1.45l1.833-1.832a1.125 1.125 0 0 1 1.45-.12l.927.626c.355.24.805.289 1.199.121l.11-.046c.396-.165.68-.521.75-.944l.184-1.104Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>', options, 'h-4 w-4');
}

function hydrateCriticalIcons(): void {
  document.querySelectorAll<HTMLButtonElement>('button[data-icon="close"]').forEach((button) => {
    if (button.dataset.iconHydrated === '1') return;
    button.classList.add('inline-flex', 'items-center', 'justify-center');
    button.innerHTML = iconClose({ className: 'h-4 w-4' });
    button.dataset.iconHydrated = '1';
  });
}

const ICON_HELPERS = {
  iconClose,
  iconPlus,
  iconSearch,
  iconMoreVertical,
  iconChevronLeft,
  iconChevronRight,
  iconChevronDown,
  iconCode,
  iconSettings
};
void ICON_HELPERS;
