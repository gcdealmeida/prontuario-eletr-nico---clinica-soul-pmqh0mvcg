import React from 'react'
import { useParams } from 'react-router-dom'
import { ProgramaEditor } from '@/components/programas/ProgramaEditor'

export const ProgramaDetalhe: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  return <ProgramaEditor programaId={id} />
}
