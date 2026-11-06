import React from 'react'
import { LogoSOUL } from '@/components/LogoSOUL'
import { formatDataPTBR, formatCPF, formatTelefone } from '@/lib/constants'
import {
  calcularSubtotalItem,
  calcularTotalPrograma,
  formatarMoedaBRL,
  type ItemServicoProposta,
  type ProgramaTratamentoRecord,
} from '@/services/programasTratamento'

interface DocumentoPropostaTratamentoProps {
  programa: ProgramaTratamentoRecord
}

/**
 * Documento institucional SOUL — Proposta Comercial de Programa de Tratamento.
 * Mesma identidade visual do impresso A4 dos prontuários (logo, linha dourada,
 * blocos em bege #F7F2EC com borda #E9E1D2, tom #6A402D, rodapé institucional,
 * assinatura em Vinhedo/SP). Renderiza SOMENTE os dados inseridos pelo admin:
 * campos vazios saem como "—" ou a seção é omitida. Nada de markdown cru.
 */
export const DocumentoPropostaTratamento: React.FC<DocumentoPropostaTratamentoProps> = ({
  programa,
}) => {
  if (!programa) return null

  const pac = programa.expand?.paciente_id || {}
  const nomePaciente = programa.paciente_nome || pac.nome || '—'
  const cpfPaciente = pac.cpf ? formatCPF(pac.cpf) : ''
  const telefonePaciente = pac.telefone ? formatTelefone(pac.telefone) : ''
  const emailPaciente = pac.email || ''

  const itens: ItemServicoProposta[] = Array.isArray(programa.itens) ? programa.itens : []

  const somaSubtotais = itens.reduce((acc, it) => acc + calcularSubtotalItem(it), 0)
  const descontoGeralTipo = (programa.desconto_geral_tipo || 'nenhum') as
    | 'nenhum'
    | 'percentual'
    | 'valor'
  const descontoGeralValor = Number(programa.desconto_geral_valor) || 0
  const totalGeral = calcularTotalPrograma(itens, descontoGeralTipo, descontoGeralValor)

  const descontoGeralReal = Math.min(
    descontoGeralTipo === 'percentual'
      ? (somaSubtotais * descontoGeralValor) / 100
      : descontoGeralValor,
    somaSubtotais,
  )

  const descontoGeralTexto =
    descontoGeralTipo === 'percentual'
      ? `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(descontoGeralValor)}%`
      : descontoGeralTipo === 'valor'
        ? `R$ ${formatarMoedaBRL(descontoGeralValor)}`
        : ''

  const periodoTexto = programa.data_inicio
    ? `${formatDataPTBR(programa.data_inicio)}${
        programa.data_fim ? ` a ${formatDataPTBR(programa.data_fim)}` : ''
      }`
    : ''
  const semanasTexto =
    programa.duracao_semanas && Number(programa.duracao_semanas) > 0
      ? `${programa.duracao_semanas} ${programa.duracao_semanas === 1 ? 'semana' : 'semanas'}`
      : ''

  const condicoes = (programa.condicoes || '').trim()

  return (
    <div
      className="bg-white text-[#1F1B18] w-full font-montserrat text-[10pt] leading-relaxed mx-auto print:p-0 print:m-0"
      style={{
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      {/* CABEÇALHO INSTITUCIONAL */}
      <header className="pt-2 pb-4 text-center space-y-3">
        <div className="flex justify-center items-center py-1">
          <LogoSOUL variant="full" size="md" theme="light" className="mx-auto" />
        </div>
        <div className="w-full h-[1px]" style={{ backgroundColor: '#D5AE6F' }} />
      </header>

      {/* TÍTULO */}
      <div className="text-center space-y-1 mb-6">
        <h1
          className="font-soul font-semibold tracking-wide text-[#6A402D] uppercase"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '22pt',
            lineHeight: 1.2,
          }}
        >
          PROPOSTA DE PROGRAMA DE TRATAMENTO
        </h1>
        <p className="font-montserrat italic text-[#B86545] text-[10.5pt]">
          Clínica SOUL — Saúde e Bem Estar
        </p>
        <div className="w-16 h-[1px] mx-auto mt-2" style={{ backgroundColor: '#D5AE6F' }} />
      </div>

      {/* BLOCO PACIENTE */}
      <div
        className="p-4 mb-6 rounded-lg text-[9.5pt] leading-relaxed page-break-inside-avoid"
        style={{
          backgroundColor: '#F7F2EC',
          border: '1px solid #E9E1D2',
        }}
      >
        <div className="font-montserrat font-bold text-[10pt] uppercase tracking-wider text-[#6A402D] mb-2 pb-1 border-b border-[#D5AE6F]/30">
          PACIENTE
        </div>
        <div className="space-y-1.5 text-[#5F544F]">
          <div>
            <strong className="text-[#6A402D]">Nome:</strong>{' '}
            <span className="text-[#1F1B18] font-medium text-[10pt]">{nomePaciente}</span>
            {cpfPaciente && (
              <span className="text-gray-500 font-mono text-[8.5pt]"> (CPF: {cpfPaciente})</span>
            )}
          </div>
          {(telefonePaciente || emailPaciente) && (
            <div className="flex flex-wrap items-center gap-x-2">
              {telefonePaciente && (
                <span>
                  <strong className="text-[#6A402D]">Contato:</strong>{' '}
                  <span className="text-[#1F1B18] font-mono">{telefonePaciente}</span>
                </span>
              )}
              {telefonePaciente && emailPaciente && <span>|</span>}
              {emailPaciente && (
                <span>
                  <strong className="text-[#6A402D]">E-mail:</strong>{' '}
                  <span className="text-[#1F1B18]">{emailPaciente}</span>
                </span>
              )}
            </div>
          )}
          <div>
            <strong className="text-[#6A402D]">Data da proposta:</strong>{' '}
            <span className="text-[#1F1B18]">{formatDataPTBR(programa.created)}</span>
          </div>
        </div>
      </div>

      {/* PROGRAMA E PERÍODO */}
      <section className="mb-6 page-break-inside-avoid">
        <h2
          className="font-soul font-bold text-[13pt] text-[#6A402D] uppercase tracking-wide"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {programa.titulo || 'Programa de Tratamento'}
        </h2>
        {(periodoTexto || semanasTexto) && (
          <p className="text-[9.5pt] text-[#5F544F] mt-1">
            <strong className="text-[#6A402D]">Período / vigência:</strong>{' '}
            {[periodoTexto, semanasTexto].filter(Boolean).join(' • ') || '—'}
          </p>
        )}
        <div className="w-full h-[1px] mt-2 mb-3" style={{ backgroundColor: '#E9E1D2' }} />
      </section>

      {/* TABELA DE SERVIÇOS */}
      <section className="mb-6 page-break-inside-avoid">
        <h3 className="font-montserrat font-bold text-[10.5pt] text-[#6A402D] mb-2 uppercase tracking-wide">
          Serviços Compreendidos no Programa
        </h3>
        {itens.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[9pt]">
              <thead>
                <tr className="bg-[#F7F2EC] text-[#6A402D] font-bold border-b border-[#E9E1D2]">
                  <th className="py-2 px-3 text-left">Serviço</th>
                  <th className="py-2 px-2 text-center w-20">Qtd.</th>
                  <th className="py-2 px-2 text-right w-28">Valor Unitário</th>
                  <th className="py-2 px-2 text-center w-24">Desconto</th>
                  <th className="py-2 px-3 text-right w-28">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item, idx) => {
                  const sub = calcularSubtotalItem(item)
                  const bruto = (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0)
                  const descTexto =
                    item.tipoDesconto === 'percentual' && Number(item.desconto) > 0
                      ? `${formatarMoedaBRL(item.desconto)}%`
                      : item.tipoDesconto === 'valor' && Number(item.desconto) > 0
                        ? `R$ ${formatarMoedaBRL(item.desconto)}`
                        : '—'
                  return (
                    <tr key={idx} className="border-b border-[#F0EAE0]">
                      <td className="py-2 px-3 text-[#1F1B18] font-medium">{item.nome || '—'}</td>
                      <td className="py-2 px-2 text-center font-mono">{item.quantidade || '—'}</td>
                      <td className="py-2 px-2 text-right font-mono">
                        R$ {formatarMoedaBRL(item.valorUnitario)}
                      </td>
                      <td className="py-2 px-2 text-center text-[#5F544F]">{descTexto}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-[#6A402D]">
                        R$ {formatarMoedaBRL(sub)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#E9E1D2]">
                  <td colSpan={4} className="py-2 px-3 text-right font-semibold text-[#5F544F]">
                    Subtotal dos serviços
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-[#1F1B18]">
                    R$ {formatarMoedaBRL(somaSubtotais)}
                  </td>
                </tr>
                {descontoGeralTipo !== 'nenhum' && descontoGeralValor > 0 && (
                  <tr>
                    <td colSpan={4} className="py-2 px-3 text-right font-semibold text-[#5F544F]">
                      Desconto geral ({descontoGeralTexto})
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-[#B86545]">
                      − R$ {formatarMoedaBRL(descontoGeralReal)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td
                    colSpan={4}
                    className="py-3 px-3 text-right font-montserrat font-bold text-[11pt] text-[#6A402D] uppercase tracking-wide"
                  >
                    Investimento Total
                  </td>
                  <td
                    className="py-3 px-3 text-right font-bold text-[13pt] text-[#6A402D]"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    R$ {formatarMoedaBRL(totalGeral)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-[#5F544F] italic text-[9.5pt]">— Nenhum serviço incluído —</p>
        )}
      </section>

      {/* CONDIÇÕES / OBSERVAÇÕES */}
      {condicoes && (
        <section className="mb-6 page-break-inside-avoid">
          <h3 className="font-montserrat font-bold text-[10.5pt] text-[#6A402D] mb-2 uppercase tracking-wide">
            Condições e Observações
          </h3>
          <div
            className="p-4 rounded-lg text-[9.5pt] leading-relaxed whitespace-pre-line text-[#5F544F]"
            style={{
              backgroundColor: '#F7F2EC',
              border: '1px solid #E9E1D2',
            }}
          >
            {condicoes}
          </div>
        </section>
      )}

      {/* ASSINATURAS */}
      <section className="pt-10 mt-12 page-break-inside-avoid">
        <div className="flex flex-col sm:flex-row justify-between gap-12 max-w-2xl mx-auto">
          <div className="flex-1 text-center">
            <div className="border-t border-[#6A402D] pt-2 mx-6">
              <p className="font-montserrat font-bold text-[9.5pt] text-[#6A402D]">
                Clínica SOUL — Saúde e Bem Estar
              </p>
              <p className="font-montserrat text-[8.5pt] text-[#5F544F]">
                Responsável pela proposta
              </p>
            </div>
          </div>
          <div className="flex-1 text-center">
            <div className="border-t border-[#6A402D] pt-2 mx-6">
              <p className="font-montserrat font-bold text-[9.5pt] text-[#6A402D]">
                {nomePaciente !== '—' ? nomePaciente : 'Cliente'}
              </p>
              <p className="font-montserrat text-[8.5pt] text-[#5F544F]">
                De acordo com o programa proposto
              </p>
            </div>
          </div>
        </div>
        <p className="text-center font-montserrat text-[9pt] text-[#5F544F] pt-8">
          Vinhedo,{' '}
          {new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </section>

      {/* RODAPÉ INSTITUCIONAL */}
      <footer className="pt-6 mt-10 border-t border-[#D5AE6F]/40 flex flex-col sm:flex-row items-center justify-between text-[8.5pt] text-[#5F544F] font-montserrat print:hidden">
        <p>Clínica SOUL • Saúde e Bem Estar | (19)9 9895-0080 • @clinicasoul.saudeebemestar</p>
        <p className="font-medium text-[#6A402D]">Proposta Comercial — Programa de Tratamento</p>
      </footer>

      {/* Rodapé fixo de impressão por página (mesma mecânica dos prontuários) */}
      <div id="rodape-fixo-prontuario-soul" aria-hidden="true">
        <span className="rodape-linha-institucional">
          Clínica SOUL • Saúde e Bem Estar | (19)9 9895-0080 • @clinicasoul.saudeebemestar
        </span>
        <span className="rodape-pagina">Página 1</span>
      </div>
    </div>
  )
}

export default DocumentoPropostaTratamento
