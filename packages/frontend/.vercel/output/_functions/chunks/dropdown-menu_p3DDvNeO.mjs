import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { c as clientApp, a as cn } from './formatters_DicF_a8O.mjs';
import { C as CustomSheet, B as Button, I as Input } from './TableWrapper_C4p9y2vA.mjs';
import { Search, ChevronRight, Check, Circle } from 'lucide-react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

const DataSearchSheet = ({ type, onSelect, setIsOpen }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const apiMap = {
    client: { endpoint: clientApp.client, nameKey: "name", key: "client_id" },
    seller: { endpoint: clientApp.seller, nameKey: "name", key: "seller_id" },
    device: { endpoint: clientApp.phone, nameKey: "name", key: "device_id" },
    technician: { endpoint: clientApp.technician, nameKey: "name", key: "technician_id" },
    provider: { endpoint: clientApp.provider, nameKey: "name", key: "provider_id" }
  };
  const { endpoint, nameKey, key } = apiMap[type];
  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setResults([]);
    try {
      let result;
      if (type == "device") {
        result = await endpoint.all.get({ query: { sold: "false", is_deleted: false } });
      } else {
        result = await endpoint.all.get({ query: { is_deleted: false } });
      }
      const rawData = result.data;
      const items = Array.isArray(rawData) ? rawData : rawData?.data || [];
      if (Array.isArray(items)) {
        const filtered = items.filter(
          (item) => String(item[nameKey]).toLowerCase().includes(searchTerm.toLowerCase())
        );
        setResults(filtered);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Error searching:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, nameKey, searchTerm]);
  useEffect(() => {
    if (searchTerm === "") {
      handleSearch();
    }
  }, []);
  const selectItem = (item) => {
    onSelect(String(item[key]), String(item.price));
    setIsOpen(false);
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
    /* @__PURE__ */ jsxs("h2", { className: "text-xl font-semibold mb-4", children: [
      "Buscar ",
      type
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-4", children: [
      /* @__PURE__ */ jsx(
        Input,
        {
          placeholder: `Buscar por ${nameKey}...`,
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") handleSearch();
          }
        }
      ),
      /* @__PURE__ */ jsx(Button, { onClick: handleSearch, disabled: isLoading, children: isLoading ? "Buscando..." : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 mr-2" }),
        " Buscar"
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "h-96 overflow-y-auto border rounded-lg", children: isLoading ? /* @__PURE__ */ jsx("p", { className: "p-3 text-center text-gray-500", children: "Cargando..." }) : results.length > 0 ? results.map((item) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "p-3 border-b cursor-pointer hover:bg-blue-50/50 flex justify-between items-center",
        onClick: () => selectItem(item),
        children: [
          /* @__PURE__ */ jsx("span", { children: item[nameKey] }),
          /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4 text-gray-400" })
        ]
      },
      item[key]
    )) : /* @__PURE__ */ jsx("p", { className: "p-3 text-gray-500", children: searchTerm ? `No se encontraron ${type}s. Intenta buscar de nuevo.` : "Ingresa un término y presiona Buscar." }) })
  ] });
};
function SheetSelector({ type, currentId, onSelect, depth = 1 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState(`Seleccionar ${type}`);
  const apiMap = {
    client: { endpoint: clientApp.client, nameKey: "name" },
    seller: { endpoint: clientApp.seller, nameKey: "name" },
    device: { endpoint: clientApp.phone, nameKey: "name" },
    technician: { endpoint: clientApp.technician, nameKey: "name", key: "technician_id" },
    provider: { endpoint: clientApp.provider, nameKey: "name", key: "provider_id" }
  };
  const { endpoint, nameKey } = apiMap[type];
  const fetchNameById = useCallback(async (id) => {
    if (!id || id === "0") {
      setDisplayName(`Seleccionar ${type}`);
      return;
    }
    try {
      const result = await endpoint({ id }).get();
      if (result.data) {
        const itemData = result.data;
        setDisplayName(`${itemData[nameKey]} (ID: ${id})`);
      } else {
        setDisplayName(`ID ${id} no encontrado`);
      }
    } catch (error) {
      setDisplayName(`ID ${id} (Error)`);
    }
  }, [type, endpoint, nameKey]);
  useEffect(() => {
    fetchNameById(currentId);
  }, [currentId, fetchNameById]);
  const triggerButton = /* @__PURE__ */ jsxs(
    Button,
    {
      type: "button",
      variant: "outline",
      className: "w-full justify-between font-normal",
      onClick: () => setIsOpen(true),
      children: [
        displayName,
        /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 ml-2" })
      ]
    }
  );
  const offset = depth * 380;
  return /* @__PURE__ */ jsx(
    CustomSheet,
    {
      side: "right",
      style: { right: `${offset}px` },
      isOpen,
      isModal: false,
      zIndex: 50,
      onOpenChange: setIsOpen,
      title: `Seleccionar ${type}`,
      trigger: triggerButton,
      description: `Busca y selecciona el ${type}`,
      content: /* @__PURE__ */ jsx(
        DataSearchSheet,
        {
          type,
          currentId,
          onSelect,
          setIsOpen
        }
      ),
      footer: /* @__PURE__ */ jsx(Fragment, {})
    }
  );
}

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.SubTrigger,
  {
    ref,
    className: cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx(ChevronRight, { className: "ml-auto" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
const DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.SubContent,
  {
    ref,
    className: cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-[9999] max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
const DropdownMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.CheckboxItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
const DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(
  DropdownMenuPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx("span", { className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Circle, { className: "h-2 w-2 fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Label,
  {
    ref,
    className: cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DropdownMenuPrimitive.Separator,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

export { DropdownMenu as D, SheetSelector as S, DropdownMenuTrigger as a, DropdownMenuContent as b, DropdownMenuItem as c };
