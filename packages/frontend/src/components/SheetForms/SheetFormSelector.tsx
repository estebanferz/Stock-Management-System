import React, { useState, useCallback, useEffect } from 'react';
import { clientApp } from "@/lib/clientAPI"; 
import { Button } from "@/components/ui/button";
import { Search, ChevronRight } from 'lucide-react';
import { CustomSheet } from "@/components/CustomSheet";
import { SheetClose } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label";

interface SheetSelectorProps {
    type: 'client' | 'seller' | 'device';
    currentId: string;
    onSelect: (id: string) => void;
}

// -------------------------------------------------------------------------
// Componente de Búsqueda y Selección (El Sheet de la Izquierda)
// -------------------------------------------------------------------------
interface DataSearchSheetProps extends SheetSelectorProps {
    setIsOpen: (open: boolean) => void;
}

const DataSearchSheet: React.FC<DataSearchSheetProps> = ({ type, onSelect, setIsOpen }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Mapeo de la API (AJUSTA LOS ENDPOINTS: ej. client.all, seller.all, phone.all)
    const apiMap = {
        client: { endpoint: clientApp.client, nameKey: 'name', key: "client_id" },
        seller: { endpoint: clientApp.seller, nameKey: 'name', key: "seller_id"  },
        device: { endpoint: clientApp.phone, nameKey: 'name', key: "device_id"  },
    };
    const { endpoint, nameKey, key } = apiMap[type];

    const handleSearch = useCallback(async () => {
        setIsLoading(true);
        setResults([]);
        try {
            const result = await endpoint.all.get(); 
            const rawData = result.data as any; 
            const items = Array.isArray(rawData) ? rawData : rawData?.data || [];

            if (Array.isArray(items)) {
                const filtered = items.filter((item: any) =>
                    String(item[nameKey]).toLowerCase().includes(searchTerm.toLowerCase())
                );
                setResults(filtered);
            } else {
                setResults([]);
            }

        } catch (error) {
            console.error('Error searching:', error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, [endpoint, nameKey, searchTerm]);

    useEffect(() => {
        if (searchTerm === '') {
            handleSearch();
        }
    }, []);
    
    const selectItem = (item: any) => {
        onSelect(String(item[key]));
        setIsOpen(false);
    };
    

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Buscar {type}</h2>
            <div className="flex gap-2 mb-4">
                <Input
                    placeholder={`Buscar por ${nameKey}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch();
                    }}
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? 'Buscando...' : <><Search className="w-4 h-4 mr-2" /> Buscar</>}
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
                            <span>{item[nameKey]}</span>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                    ))
                ) : (
                    <p className="p-3 text-gray-500">
                        {searchTerm ? `No se encontraron ${type}s. Intenta buscar de nuevo.` : "Ingresa un término y presiona Buscar."}
                    </p>
                )}
            </div>
        </div>
    );
};


export function SheetSelector({ type, currentId, onSelect }: SheetSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [displayName, setDisplayName] = useState(`Seleccionar ${type}`);

    const apiMap = {
        client: { endpoint: clientApp.client, nameKey: 'name' },
        seller: { endpoint: clientApp.seller, nameKey: 'name' },
        device: { endpoint: clientApp.phone, nameKey: 'name' },
    };
    const { endpoint, nameKey } = apiMap[type];

    const fetchNameById = useCallback(async (id: string) => {
        if (!id || id === '0') {
            setDisplayName(`Seleccionar ${type}`);
            return;
        }
        try {
            const result = await endpoint({id: id}).get(); 
            if (result.data) {
                const itemData = result.data as Record<string, any>;
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
    // ------------------------------------------------------
    
    return (
        <CustomSheet
            side="right" 
            className="right-[380px]"
            isOpen={isOpen}
            isModal={false}
            zIndex={50}
            onOpenChange={setIsOpen}
            title={`Seleccionar ${type}`}
            trigger={triggerButton}
            description={`Busca y selecciona el ${type}`}
            content={
                <DataSearchSheet
                    type={type}
                    currentId={currentId}
                    onSelect={onSelect}
                    setIsOpen={setIsOpen}
                />
            }
            footer={
                <>
                    <Button type="submit">Agregar</Button>
                    <SheetClose asChild>
                    <Button variant="outline">Cancelar</Button>
                    </SheetClose>
                </>
            }
        />
        
    );
}