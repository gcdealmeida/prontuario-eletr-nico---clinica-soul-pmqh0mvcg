import React from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ModalAlertaSaidaProps {
  open: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export const ModalAlertaSaida: React.FC<ModalAlertaSaidaProps> = ({
  open,
  title = 'Dados clínicos não salvos',
  description = 'Você possui dados preenchidos neste formulário que ainda não foram gravados no servidor. Se sair agora, você poderá perder o que digitou. Deseja realmente sair desta tela?',
  confirmText = 'Sim, sair sem salvar',
  cancelText = 'Continuar editando',
  onConfirm,
  onCancel,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={(val) => !val && onCancel()}>
      <AlertDialogContent className="rounded-2xl max-w-md border-[#E9E1D2] bg-white shadow-2xl">
        <AlertDialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5 text-amber-600">
            <span className="p-2 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </span>
            <AlertDialogTitle className="text-base font-bold text-[#4A322A]">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs text-[#73574A] leading-relaxed pt-1">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-3 gap-2">
          <AlertDialogCancel
            onClick={onCancel}
            className="rounded-xl text-xs font-semibold border-gray-200 hover:bg-gray-100"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
