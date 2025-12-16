import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PreviewModalProps {
    open: boolean;
    onClose: () => void;
    fileName?: string;
    expenseId: number;  
    mime?: string;
}

export function PreviewModal({
    open,
    onClose,
    fileName,
    expenseId,
    mime,
}: PreviewModalProps) {
    
    const API = import.meta.env.PUBLIC_API_URL;
    const src = `${API}/api/expense/${expenseId}/receipt`;

    const isPdf = mime === "application/pdf" || (fileName?.toLowerCase().endsWith(".pdf") ?? false);
    const isImage = (mime?.startsWith("image/") ?? false);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center p-2">
                        <span>{fileName}</span>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Vista previa del comprobante en PDF.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 w-full h-full border rounded overflow-hidden">
                    {isPdf ? (
                        <iframe src={src} className="w-full h-full" title={fileName ?? "PDF"} />
                    ) : isImage ? (
                        <img
                        src={src}
                        alt={fileName ?? "Imagen"}
                        className="w-full max-h-full object-contain"
                        />
                    ) : (
                        <div className="p-4 text-sm text-gray-600 text-center">
                        No se puede previsualizar este tipo de archivo.
                        <div className="mt-2">
                            <a
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                            >
                            Abrir/descargar
                            </a>
                        </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
  );
}
