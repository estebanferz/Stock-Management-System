import React, { useState, useCallback, useEffect } from "react";
import { clientApp } from "@/lib/clientAPI";
import { Button } from "@/components/ui/button";
import { Search, ChevronRight } from "lucide-react";
import { CustomSheet } from "@/components/CustomSheet";
import { Input } from "@/components/ui/input";
import { generalStringFormat, translateType } from "@/utils/formatters";

interface SheetSelectorProps {
  type: "client" | "seller" | "device" | "technician" | "provider" | "device_repair";
  currentId: string;
  onSelect: (id: string, price?: string) => void;
  depth?: number;
  parentZIndex?: number;
}

interface DataSearchSheetProps extends SheetSelectorProps {
  setIsOpen: (open: boolean) => void;
}

//formatter
const fmt = (v: unknown) => generalStringFormat(String(v ?? ""));

const DataSearchSheet: React.FC<DataSearchSheetProps> = ({ type, onSelect, setIsOpen }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const apiMap = {
    client: { endpoint: clientApp.client, nameKey: "name", key: "client_id" },
    seller: { endpoint: clientApp.seller, nameKey: "name", key: "seller_id" },
    device: { endpoint: clientApp.phone, nameKey: "name", key: "device_id" },
    device_repair: { endpoint: clientApp.phone, nameKey: "name", key: "device_id" },
    technician: { endpoint: clientApp.technician, nameKey: "name", key: "technician_id" },
    provider: { endpoint: clientApp.provider, nameKey: "name", key: "provider_id" },
  } as const;

  const { endpoint, nameKey, key } = apiMap[type];

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setResults([]);

    try {
      let result;
      if (type === "device") {
        result = await endpoint.all.get({ query: { sold: "false", is_deleted: false } });
      } else if (type == "device_repair"){
        result = await endpoint.all.get({ query: { is_deleted: false } });
      } else {
        result = await endpoint.all.get({ query: { is_deleted: false } });
      }

      const rawData = result.data as any;
      const items = Array.isArray(rawData) ? rawData : rawData?.data || [];

      if (Array.isArray(items)) {
        const filtered = items.filter((item: any) =>
          String(item[nameKey] ?? "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
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
  }, [endpoint, nameKey, searchTerm, type]);

  useEffect(() => {
    if (searchTerm === "") handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectItem = (item: any) => {
    onSelect(String(item[key]), String(item.price));
    setIsOpen(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Buscar {translateType(type)}</h2>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder={`Buscar por ${nameKey}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? "Buscando..." : (
            <>
              <Search className="w-4 h-4 mr-2" /> Buscar
            </>
          )}
        </Button>
      </div>

      <div className="h-96 overflow-y-auto border rounded-lg">
        {isLoading ? (
          <p className="p-3 text-center text-gray-500">Cargando...</p>
        ) : results.length > 0 ? (
          results.map((item) => (
            <div
              key={item[key]}
              className="p-3 border-b cursor-pointer hover:bg-blue-50/50 flex justify-between items-center"
              onClick={() => selectItem(item)}
            >
              <span>{fmt(item[nameKey])}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          ))
        ) : (
          <p className="p-3 text-gray-500">
            {searchTerm
              ? `No se encontraron ${type}s. Intenta buscar de nuevo.`
              : "Ingresa un término y presiona Buscar."}
          </p>
        )}
      </div>
    </div>
  );
};

export function SheetSelector({
  type,
  currentId,
  onSelect,
  depth = 1,
  parentZIndex,
}: SheetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState(`Seleccionar ${type}`);

  const apiMap = {
    client: { endpoint: clientApp.client, nameKey: "name" },
    seller: { endpoint: clientApp.seller, nameKey: "name" },
    device: { endpoint: clientApp.phone, nameKey: "name" },
    device_repair: { endpoint: clientApp.phone, nameKey: "name" },
    technician: { endpoint: clientApp.technician, nameKey: "name" },
    provider: { endpoint: clientApp.provider, nameKey: "name" },
  } as const;

  const { endpoint, nameKey } = apiMap[type];

  const fetchNameById = useCallback(
    async (id: string) => {
      if (!id || id === "0") {
        setDisplayName(`Seleccionar ${translateType(type)}`);
        return;
      }
      try {
        const result = await endpoint({ id }).get();
        if (result.data) {
          const itemData = result.data as Record<string, any>;
          setDisplayName(`${fmt(itemData[nameKey])}`);
        } else {
          setDisplayName(`ID ${id} no encontrado`);
        }
      } catch {
        setDisplayName(`ID ${id} (Error)`);
      }
    },
    [type, endpoint, nameKey]
  );

  useEffect(() => {
    fetchNameById(currentId);
  }, [currentId, fetchNameById]);

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-between font-normal"
      onClick={() => setIsOpen(true)}
    >
      {displayName}
      <Search className="w-4 h-4 ml-2" />
    </Button>
  );
  const baseZ = parentZIndex ?? 100;
  const selectorZ = baseZ + 2 + depth * 2;

  return (
    <CustomSheet
      side="right"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      title={`Seleccionar ${translateType(type)}`}
      trigger={triggerButton}
      description={`Busca y selecciona el ${translateType(type)}`}
      isNested={true}
      depth={depth}
      isModal={false}
      zIndex={selectorZ}

      content={
        <DataSearchSheet
          type={type}
          currentId={currentId}
          onSelect={onSelect}
          depth={depth}
          parentZIndex={baseZ}
          setIsOpen={setIsOpen}
        />
      }
      footer={<></>}
    />
  );
}
