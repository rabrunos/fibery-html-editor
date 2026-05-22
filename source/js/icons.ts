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

function iconFillSvg20(pathMarkup: string, options: IconOptions | undefined, fallbackClass: string): string {
  return `<svg class="${iconClassAttr(options, fallbackClass)}" viewBox="0 0 20 20" fill="currentColor">${pathMarkup}</svg>`;
}

function iconClose(options?: IconOptions): string {
  return iconFillSvg('<path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/>', options, 'h-4 w-4');
}

function iconPlus(options?: IconOptions): string {
  return iconFillSvg('<path fill-rule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd"/>', options, 'h-4 w-4');
}

function iconSearch(options?: IconOptions): string {
  return iconFillSvg('<path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clip-rule="evenodd"/>', options, 'h-4 w-4');
}

function iconSettings(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>', options, 'h-4 w-4');
}

function iconMoreVertical(options?: IconOptions): string {
  return iconFillSvg('<path fill-rule="evenodd" d="M10.5 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm0 6a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clip-rule="evenodd"/>', options, 'h-4 w-4');
}

function iconMoreHorizontal(options?: IconOptions): string {
  return iconFillSvg('<path fill-rule="evenodd" d="M4.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" clip-rule="evenodd"/>', options, 'h-4 w-4');
}

function iconChevronLeft(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>', options, 'h-4 w-4');
}

function iconChevronRight(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>', options, 'h-4 w-4');
}

function iconChevronDown(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>', options, 'h-4 w-4');
}

function iconRefresh(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>', options, 'h-4 w-4');
}

function iconEye(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>', options, 'h-4 w-4');
}

function iconCode(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"/>', options, 'h-4 w-4');
}

function iconSplit(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m-7.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z"/>', options, 'h-4 w-4');
}

function iconCopy(options?: IconOptions): string {
  return iconFillSvg20('<path d="M12.668 10.667c0-.71 0-1.204-.031-1.588a2.4 2.4 0 0 0-.113-.615l-.055-.13a1.84 1.84 0 0 0-.676-.731l-.127-.072c-.158-.08-.37-.137-.745-.168-.384-.031-.877-.031-1.588-.031H6.5c-.711 0-1.204 0-1.588.031a2.4 2.4 0 0 0-.615.113l-.13.055a1.84 1.84 0 0 0-.731.676l-.07.127c-.081.158-.138.37-.169.745-.031.384-.032.877-.032 1.588V13.5c0 .711 0 1.204.032 1.588.031.376.088.587.168.745l.07.126c.177.288.43.522.732.676l.13.056c.144.052.333.089.615.112.384.031.877.032 1.588.032h2.833c.71 0 1.204 0 1.588-.032.376-.031.587-.088.745-.168l.127-.07c.287-.177.522-.43.676-.732l.055-.13c.052-.144.09-.333.113-.615.031-.384.031-.877.031-1.588zm1.33 1.998c.455-.002.803-.005 1.09-.028.376-.031.587-.088.745-.168l.126-.071c.288-.177.522-.43.676-.732l.056-.13a2.4 2.4 0 0 0 .112-.615c.031-.384.032-.877.032-1.588V6.5c0-.711 0-1.204-.032-1.588a2.4 2.4 0 0 0-.112-.615l-.056-.13a1.84 1.84 0 0 0-.676-.731l-.126-.07c-.158-.081-.37-.138-.745-.169-.384-.031-.877-.032-1.588-.032h-2.833c-.71 0-1.204.001-1.588.032-.282.023-.471.06-.615.112l-.13.056a1.84 1.84 0 0 0-.731.676l-.072.126c-.08.158-.137.37-.168.745-.023.287-.027.635-.029 1.09h1.999c.689 0 1.246 0 1.696.036.458.038.865.117 1.242.309l.217.122c.496.304.9.74 1.165 1.26l.067.143c.144.337.21.698.242 1.099.037.45.036 1.007.036 1.696zm4.167-3.332c0 .689 0 1.246-.036 1.696-.033.401-.098.762-.242 1.099l-.067.143c-.265.52-.67.956-1.165 1.26l-.219.122c-.376.192-.782.271-1.24.309-.337.027-.734.031-1.2.033-.003.467-.007.864-.034 1.201-.033.401-.098.762-.242 1.098l-.067.142c-.265.522-.669.958-1.165 1.262l-.217.122c-.377.192-.784.271-1.242.309-.45.037-1.007.036-1.696.036H6.5c-.69 0-1.246 0-1.696-.036-.4-.033-.762-.098-1.098-.242l-.143-.067a3.17 3.17 0 0 1-1.261-1.165l-.122-.219c-.192-.376-.271-.782-.309-1.24-.037-.45-.036-1.007-.036-1.696v-2.833c0-.689 0-1.246.036-1.696.038-.458.117-.865.309-1.242l.122-.217c.304-.496.74-.9 1.261-1.165l.143-.067c.336-.144.697-.21 1.098-.242.337-.027.733-.032 1.2-.034.002-.467.007-.863.034-1.2.037-.458.117-.864.309-1.24l.122-.22c.304-.495.74-.899 1.26-1.164l.143-.067c.337-.144.698-.21 1.099-.242.45-.037 1.007-.036 1.696-.036H13.5c.69 0 1.246 0 1.696.036.458.038.864.117 1.24.309l.22.122c.495.304.899.74 1.164 1.261l.067.143c.144.336.21.697.242 1.098.037.45.036 1.007.036 1.696z"/>', options, 'h-3.5 w-3.5');
}

function iconHistory(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>', options, 'h-4 w-4');
}

function iconProjectClosed(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"/>', options, 'h-4 w-4');
}

function iconProjectOpen(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776"/>', options, 'h-4 w-4');
}

function iconProjectAdd(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"/>', options, 'h-4 w-4');
}

function iconFocus(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/>', options, 'h-4 w-4');
}

function iconWarning(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"/>', options, 'h-4 w-4');
}

function iconSave(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25"/>', options, 'h-4 w-4');
}

function iconUpdate(options?: IconOptions): string {
  return iconStrokeSvg('<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"/>', options, 'h-4 w-4');
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
  iconSettings,
  iconMoreVertical,
  iconMoreHorizontal,
  iconChevronLeft,
  iconChevronRight,
  iconChevronDown,
  iconRefresh,
  iconEye,
  iconCode,
  iconSplit,
  iconCopy,
  iconHistory,
  iconProjectClosed,
  iconProjectOpen,
  iconProjectAdd,
  iconFocus,
  iconWarning,
  iconSave,
  iconUpdate,
};
void ICON_HELPERS;
