import React from 'react';
import { Box, MapPin, Smartphone, Headphones, Package } from 'lucide-react';
import { generalStringFormat } from '@/utils/formatters';
interface Deposit {
  deposit_id: number;
  name: string;
  address?: string | null;
  stock_breakdown: {
    phones: number;
    headphones: number;
    accessories: number;
    total: number;
  };
}

export const DepositsCarousel: React.FC<{ deposits: Deposit[] }> = ({ deposits }) => {
  return (
    <div className="flex flex-nowrap overflow-x-auto gap-4 pb-4 pt-2 scrollbar-hide snap-x">
      {deposits.map((dep) => (
        <div 
          key={dep.deposit_id}
          className="min-w-[340px] bg-white p-4 rounded-2xl shadow-sm border border-gray-100 snap-start flex items-center justify-between hover:shadow-md transition-all"
        >
          {/* LADO IZQUIERDO: Info Básica */}
          <div className="flex flex-col gap-1 max-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-gray-50 rounded-lg text-mainColor">
                <Box size={18} />
              </div>
              <h3 className="font-bold text-gray-800 leading-tight truncate">{generalStringFormat(dep.name)}</h3>
            </div>
            <div className="flex items-center text-gray-400 text-[11px]">
              <MapPin size={12} className="mr-1 flex-shrink-0" />
              <span className="truncate">{dep.address || "Sin dirección"}</span>
            </div>
          </div>

          {/* DIVISOR VERTICAL */}
          <div className="h-10 w-[1px] bg-gray-100 mx-2" />

          {/* LADO DERECHO: Stock Discriminado */}
          <div className="flex flex-col gap-1.5 min-w-[100px]">
            {/* Celulares */}
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Smartphone size={12} />
                <span className="text-[10px] font-medium uppercase tracking-tight">Celulares</span>
              </div>
              <span className="text-xs font-bold text-gray-700">{dep.stock_breakdown.phones}</span>
            </div>

            {/* Audio/Auriculares */}
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Headphones size={12} />
                <span className="text-[10px] font-medium uppercase tracking-tight">Audio</span>
              </div>
              <span className="text-xs font-bold text-gray-700">{dep.stock_breakdown.headphones}</span>
            </div>

            {/* Accesorios */}
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Package size={12} />
                <span className="text-[10px] font-medium uppercase tracking-tight">Accesorios</span>
              </div>
              <span className="text-xs font-bold text-gray-700">{dep.stock_breakdown.accessories}</span>
            </div>
            
            {/* Total */}
            <div className="mt-1 pt-1 border-t border-gray-100 flex justify-between">
              <span className="text-[9px] font-black text-mainColor uppercase">Total Items</span>
              <span className="text-[10px] font-black text-mainColor">{dep.stock_breakdown.total}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};