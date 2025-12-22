import { e as createComponent, f as createAstro, h as addAttribute, l as renderHead, k as renderComponent, n as renderSlot, r as renderTemplate } from './astro/server_CHQc_UcV.mjs';
import 'piccolore';
import { b as background, $ as $$Header, a as cn, f as formatPhoneE164, g as generalStringFormat, d as formatPaymentMethod, e as formatMoney, h as formatDate } from './formatters_DicF_a8O.mjs';
/* empty css                         */
/* empty css                         */
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import { Slot } from '@radix-ui/react-slot';
import * as LabelPrimitive from '@radix-ui/react-label';

const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  return renderTemplate`<html class="scroll-smooth" lang="en" data-astro-cid-sckkx6r4> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/png" href="/nowaste-icon.png"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title}</title>${renderHead()}</head> <body class="min-h-screen w-full" data-astro-cid-sckkx6r4> ${renderComponent($$result, "Header", $$Header, { "data-astro-cid-sckkx6r4": true })} <img id="background"${addAttribute(background.src, "src")} alt="" fetchpriority="high" data-astro-cid-sckkx6r4> <!-- Main content container --> <main class="min-h-screen w-full pt-[var(--header-height)]" data-astro-cid-sckkx6r4> <!-- Header container slot --> ${renderSlot($$result, $$slots["header-container"])} <!-- Main content area with column structure --> <div class="flex min-h-[calc(100vh-var(--header-height))] flex-col md:flex-row" data-astro-cid-sckkx6r4> <!-- First column --> <div class="w-full p-2 md:w-1/5 md:p-4" data-astro-cid-sckkx6r4> ${renderSlot($$result, $$slots["primer-columna"], renderTemplate` <!-- Contenido de la primera columna --> `)} </div> <!-- Main content column --> <div class="relative w-full p-2 md:w-3/5 md:p-4" data-astro-cid-sckkx6r4> ${renderSlot($$result, $$slots["default"], renderTemplate` <!-- Contenido principal --> `)} </div> <!-- Third column --> <div class="w-full p-2 md:w-1/5 md:p-4" data-astro-cid-sckkx6r4> ${renderSlot($$result, $$slots["tercer-columna"], renderTemplate` <!-- Contenido de la tercera columna --> `)} </div> </div> </main> </body></html>`;
}, "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/layouts/Layout.astro", void 0);

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";

const ActionPanel = () => {
  const [mode, setMode] = useState(null);
  useEffect(() => {
    const ev = new CustomEvent("action-mode-change", { detail: mode });
    window.dispatchEvent(ev);
  }, [mode]);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl shadow-lg bg-white border flex flex-col gap-4 sticky top-[var(--header-height)]", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-center", children: "Acciones" }),
    /* @__PURE__ */ jsx(
      Button,
      {
        variant: mode === "edit" ? "default" : "outline",
        className: "flex items-center gap-2",
        onClick: () => setMode((m) => m === "edit" ? null : "edit"),
        children: "Editar"
      }
    ),
    /* @__PURE__ */ jsx(
      Button,
      {
        variant: mode === "delete" ? "destructive" : "outline",
        className: "flex items-center gap-2",
        onClick: () => setMode((m) => m === "delete" ? null : "delete"),
        children: "Eliminar"
      }
    )
  ] });
};

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;
const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-200 data-[state=open]:duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm"
      }
    },
    defaultVariants: {
      side: "right"
    }
  }
);
const SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => /* @__PURE__ */ jsxs(SheetPortal, { children: [
  /* @__PURE__ */ jsx(SheetOverlay, {}),
  /* @__PURE__ */ jsxs(
    SheetPrimitive.Content,
    {
      ref,
      className: cn(sheetVariants({ side }), className),
      ...props,
      children: [
        /* @__PURE__ */ jsxs(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
        ] }),
        children
      ]
    }
  )
] }));
SheetContent.displayName = SheetPrimitive.Content.displayName;
const SheetHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    ),
    ...props
  }
);
SheetHeader.displayName = "SheetHeader";
const SheetFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
SheetFooter.displayName = "SheetFooter";
const SheetTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold text-foreground", className),
    ...props
  }
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
const SheetDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

function CustomSheet({
  title,
  description,
  children,
  footer,
  trigger,
  className,
  side = "right",
  isModal = true,
  isOpen,
  zIndex,
  onOpenChange,
  content,
  onInteractOutside,
  style
}) {
  return /* @__PURE__ */ jsxs(Sheet, { modal: isModal, open: isOpen, onOpenChange, children: [
    /* @__PURE__ */ jsx(SheetTrigger, { asChild: true, children: trigger ? trigger : /* @__PURE__ */ jsx(Button, { className: "flex justify-center items-center h-16 w-16 rounded-full bg-white text-gray-500 hover:bg-mainColor hover:opacity-90 hover:text-white text-3xl shadow-lg", children: "+" }) }),
    /* @__PURE__ */ jsxs(
      SheetContent,
      {
        onInteractOutside,
        style: {
          ...style ?? {},
          // Offset del nesting
          ...zIndex !== void 0 ? { zIndex } : {}
          // zIndex manual
        },
        side,
        className: `${className ?? "duration-300"} flex flex-col max-h-screen`,
        children: [
          /* @__PURE__ */ jsxs(SheetHeader, { className: "py-5 my-6", children: [
            /* @__PURE__ */ jsx(SheetTitle, { className: "font-semibold text-xl", children: title }),
            description && /* @__PURE__ */ jsx(SheetDescription, { children: description })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid flex-1 overflow-y-auto auto-rows-min gap-6 mb-10 pl-1 pr-4 py-1", children: children || content }),
          /* @__PURE__ */ jsx(SheetFooter, { children: footer ? footer : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Button, { type: "submit", children: "Save changes" }),
            /* @__PURE__ */ jsx(SheetClose, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "outline", children: "Close" }) })
          ] }) })
        ]
      }
    )
  ] });
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);
const Label = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  LabelPrimitive.Root,
  {
    ref,
    className: cn(labelVariants(), className),
    ...props
  }
));
Label.displayName = LabelPrimitive.Root.displayName;

const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";

function TruncatedDescription({ text, words = 2 }) {
  const [open, setOpen] = useState(false);
  const modalRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);
  const preview = text.split(" ").slice(0, words).join(" ") + (text.split(" ").length > words ? "..." : "");
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground transition",
        onClick: () => setOpen(true),
        children: [
          /* @__PURE__ */ jsx("span", { className: "truncate", children: preview }),
          /* @__PURE__ */ jsx("span", { className: "text-xs opacity-70", children: /* @__PURE__ */ jsx(
            "svg",
            {
              xmlns: "http://www.w3.org/2000/svg",
              viewBox: "0 0 24 24",
              width: "16",
              height: "16",
              children: /* @__PURE__ */ jsx("path", { d: "m12,16.074c-.4,0-.777-.156-1.061-.439l-5.281-5.281.707-.707,5.281,5.281c.189.189.518.189.707,0l5.281-5.281.707.707-5.281,5.281c-.283.283-.66.439-1.061.439Z" })
            }
          ) })
        ]
      }
    ),
    open && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150", children: /* @__PURE__ */ jsxs(
      "div",
      {
        ref: modalRef,
        className: "bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-xl max-w-md w-full animate-in zoom-in duration-200",
        children: [
          /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-3", children: "Descripción completa" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground whitespace-pre-line leading-relaxed", children: text }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setOpen(false),
              className: "mt-4 px-4 py-2 rounded-lg bg-gray-200 text-black hover:text-white hover:bg-mainColor w-full transition",
              children: "Cerrar"
            }
          )
        ]
      }
    ) })
  ] });
}

const Dialog = SheetPrimitive.Root;
const DialogPortal = SheetPrimitive.Portal;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = SheetPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxs(
    SheetPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs(SheetPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = SheetPrimitive.Content.displayName;
const DialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    ),
    ...props
  }
);
DialogHeader.displayName = "DialogHeader";
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Title,
  {
    ref,
    className: cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
DialogTitle.displayName = SheetPrimitive.Title.displayName;
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SheetPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = SheetPrimitive.Description.displayName;

function PreviewModal({
  open,
  onClose,
  fileName,
  expenseId,
  mime
}) {
  const API = undefined                              ;
  const src = `${API}/api/expense/${expenseId}/receipt`;
  const isPdf = mime === "application/pdf" || (fileName?.toLowerCase().endsWith(".pdf") ?? false);
  const isImage = mime?.startsWith("image/") ?? false;
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: onClose, children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-5xl h-[80vh] flex flex-col", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsx(DialogTitle, { className: "flex justify-between items-center p-2", children: /* @__PURE__ */ jsx("span", { children: fileName }) }),
      /* @__PURE__ */ jsx(DialogDescription, { className: "sr-only", children: "Vista previa del comprobante en PDF." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 w-full h-full border rounded overflow-hidden", children: isPdf ? /* @__PURE__ */ jsx("iframe", { src, className: "w-full h-full", title: fileName ?? "PDF" }) : isImage ? /* @__PURE__ */ jsx(
      "img",
      {
        src,
        alt: fileName ?? "Imagen",
        className: "w-full max-h-full object-contain"
      }
    ) : /* @__PURE__ */ jsxs("div", { className: "p-4 text-sm text-gray-600 text-center", children: [
      "No se puede previsualizar este tipo de archivo.",
      /* @__PURE__ */ jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsx(
        "a",
        {
          href: src,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-blue-600 underline",
          children: "Abrir/descargar"
        }
      ) })
    ] }) })
  ] }) });
}

function ReceiptCell({ fileName, expenseId, mime }) {
  const [open, setOpen] = useState(false);
  if (!fileName) {
    return /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: "—" });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs truncate max-w-[120px]", children: fileName ?? "Comprobante" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "text-blue-600 hover:text-blue-800",
          onClick: () => setOpen(true),
          title: "Ver comprobante",
          children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", id: "Outline", viewBox: "0 0 24 24", width: "14", height: "14", children: [
            /* @__PURE__ */ jsx("path", { d: "M23.271,9.419C21.72,6.893,18.192,2.655,12,2.655S2.28,6.893.729,9.419a4.908,4.908,0,0,0,0,5.162C2.28,17.107,5.808,21.345,12,21.345s9.72-4.238,11.271-6.764A4.908,4.908,0,0,0,23.271,9.419Zm-1.705,4.115C20.234,15.7,17.219,19.345,12,19.345S3.766,15.7,2.434,13.534a2.918,2.918,0,0,1,0-3.068C3.766,8.3,6.781,4.655,12,4.655s8.234,3.641,9.566,5.811A2.918,2.918,0,0,1,21.566,13.534Z" }),
            /* @__PURE__ */ jsx("path", { d: "M12,7a5,5,0,1,0,5,5A5.006,5.006,0,0,0,12,7Zm0,8a3,3,0,1,1,3-3A3,3,0,0,1,12,15Z" })
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      PreviewModal,
      {
        open,
        onClose: () => setOpen(false),
        fileName: fileName ?? void 0,
        expenseId,
        mime: mime ?? void 0
      }
    )
  ] });
}

function CustomTable({
  data,
  columns,
  visibleColumns: visibleColumnsExternal,
  onVisibleColumnsChange,
  isActionMode = false,
  onEdit,
  onDelete
}) {
  const [pdfPreview, setPdfPreview] = useState({
    open: false
  });
  const getColKey = (col) => col.accessorKey || col.key;
  const [visibleColumnsInternal, setVisibleColumnsInternal] = useState(
    Object.fromEntries(columns.map((col) => [getColKey(col), true]))
  );
  const visibleColumns = visibleColumnsExternal ?? visibleColumnsInternal;
  const RENDERERS = {
    date: (v) => formatDate(v),
    money: (v) => formatMoney(v),
    yesno: (v) => v ? "Sí" : "No",
    paymentMethod: (v) => formatPaymentMethod(v),
    general: (v) => generalStringFormat(v),
    phone: (v) => formatPhoneE164(v),
    description: (v) => /* @__PURE__ */ jsx(TruncatedDescription, { text: v }),
    receipt: (_v, row) => /* @__PURE__ */ jsx(
      ReceiptCell,
      {
        fileName: row.receipt_original_name,
        expenseId: row.expense_id,
        mime: row.receipt_mime
      }
    )
  };
  const getRenderer = (col) => {
    if (col.render && typeof col.render === "function") return col.render;
    if (col.renderKey && RENDERERS[col.renderKey]) return RENDERERS[col.renderKey];
    return null;
  };
  return /* @__PURE__ */ jsx("div", { className: "w-full text-center", children: /* @__PURE__ */ jsx("div", { className: "h-80 bg-white overflow-auto  border rounded-lg relative", children: /* @__PURE__ */ jsxs("table", { className: "w-full table-auto", children: [
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
      columns.filter((col) => visibleColumns[getColKey(col)]).map((col) => /* @__PURE__ */ jsx(
        "th",
        {
          className: "sticky top-0 z-10 bg-gray-100 px-4 py-2 font-semibold text-gray-700 border-b",
          children: col.header
        },
        getColKey(col)
      )),
      isActionMode && /* @__PURE__ */ jsx(
        "th",
        {
          className: "\n                  sticky top-0 right-0\n                  z-30\n                  bg-gray-200\n                  px-2\n                  shadow-[inset_10px_0_10px_-10px_rgba(0,0,0,0.25)]\n                ",
          children: "Acción"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsx("tbody", { children: data.map((row, i) => /* @__PURE__ */ jsxs(
      "tr",
      {
        className: "bg-white hover:bg-gray-50 border-b align-middle",
        children: [
          columns.filter((col) => visibleColumns[getColKey(col)]).map((col) => {
            const colKey = getColKey(col);
            const value = row[colKey];
            const renderer = getRenderer(col);
            return /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-sm text-gray-600", children: renderer ? renderer(value, row) : String(value ?? "") }, colKey);
          }),
          isActionMode && /* @__PURE__ */ jsx(
            "td",
            {
              className: "\n                    sticky right-0\n                    z-20\n                    bg-white\n                    shadow-[inset_10px_0_10px_-10px_rgba(0,0,0,0.15)]\n                  ",
              children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-center items-center", children: [
                onEdit && /* @__PURE__ */ jsx(
                  "button",
                  {
                    className: "w-8 h-8 flex items-center justify-center rounded hover:bg-blue-100 text-blue-600 hover:text-blue-800",
                    onClick: () => onEdit(row),
                    children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", id: "Layer_1", "data-name": "Layer 1", viewBox: "0 0 24 24", width: "20", height: "20", children: /* @__PURE__ */ jsx("path", { d: "M22.94,1.061c-1.368-1.367-3.76-1.365-5.124,0L1.611,17.265c-1.039,1.04-1.611,2.421-1.611,3.89v2.346c0,.276,.224,.5,.5,.5H2.846c1.47,0,2.851-.572,3.889-1.611L22.86,6.265c.579-.581,.953-1.262,1.08-1.972,.216-1.202-.148-2.381-1-3.232ZM6.028,21.682c-.85,.851-1.979,1.318-3.182,1.318H1v-1.846c0-1.202,.468-2.332,1.318-3.183L15.292,4.999l3.709,3.709L6.028,21.682ZM22.956,4.116c-.115,.642-.5,1.138-.803,1.441l-2.444,2.444-3.709-3.709,2.525-2.525c.986-.988,2.718-.99,3.709,0,.617,.617,.88,1.473,.723,2.349Z" }) })
                  }
                ),
                onDelete && /* @__PURE__ */ jsx(
                  "button",
                  {
                    className: "w-8 h-8 flex items-center justify-center rounded hover:bg-red-100 text-red-600 hover:text-red-800",
                    onClick: () => onDelete(row),
                    children: /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", id: "Layer_1", "data-name": "Layer 1", viewBox: "0 0 24 24", width: "20", height: "20", children: /* @__PURE__ */ jsx("path", { d: "M21.5,4h-3.551c-.252-2.244-2.139-4-4.449-4h-3c-2.31,0-4.197,1.756-4.449,4H2.5c-.276,0-.5,.224-.5,.5s.224,.5,.5,.5h1.5v14.5c0,2.481,2.019,4.5,4.5,4.5h7c2.481,0,4.5-2.019,4.5-4.5V5h1.5c.276,0,.5-.224,.5-.5s-.224-.5-.5-.5ZM10.5,1h3c1.758,0,3.204,1.308,3.449,3H7.051c.245-1.692,1.691-3,3.449-3Zm8.5,18.5c0,1.93-1.57,3.5-3.5,3.5h-7c-1.93,0-3.5-1.57-3.5-3.5V5h14v14.5ZM10,10.5v7c0,.276-.224,.5-.5,.5s-.5-.224-.5-.5v-7c0-.276,.224-.5,.5-.5s.5,.224,.5,.5Zm5,0v7c0,.276-.224,.5-.5,.5s-.5-.224-.5-.5v-7c0-.276,.224-.5,.5-.5s.5,.224,.5,.5Z" }) })
                  }
                )
              ] })
            }
          )
        ]
      },
      row.id ?? i
    )) })
  ] }) }) });
}

function TableWrapper({ data, columns, onEdit, onDelete }) {
  const [actionMode, setActionMode] = useState(null);
  useEffect(() => {
    const onChange = (e) => {
      setActionMode(e.detail ?? null);
    };
    window.addEventListener("action-mode-change", onChange);
    return () => window.removeEventListener("action-mode-change", onChange);
  }, []);
  return /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
    CustomTable,
    {
      data,
      columns,
      isActionMode: !!actionMode,
      onEdit: actionMode === "edit" ? (row) => onEdit?.(row) : void 0,
      onDelete: actionMode === "delete" ? (row) => onDelete?.(row) : void 0
    }
  ) });
}

export { $$Layout as $, ActionPanel as A, Button as B, CustomSheet as C, Input as I, Label as L, SheetClose as S, TableWrapper as T };
