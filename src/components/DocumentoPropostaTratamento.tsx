import React from 'react'
import { LogoSOUL } from '@/components/LogoSOUL'
import { formatDataPTBR, formatCPF, formatTelefone } from '@/lib/constants'
import {
  calcularSubtotalItem,
  calcularTotalPrograma,
  formatarMoedaBRL,
  getCapaFotoUrl,
  parseCapaConfig,
  type CapaFotoConfig,
  type ItemServicoProposta,
  type ProgramaTratamentoRecord,
} from '@/services/programasTratamento'

interface DocumentoPropostaTratamentoProps {
  programa: ProgramaTratamentoRecord
}

/** Estilo da foto da capa a partir dos ajustes (posição/zoom/intensidade) */
export function estiloFotoCapa(cfg: CapaFotoConfig): React.CSSProperties {
  const largura = 100 * Math.max(1, cfg.z || 1)
  const deslocX = ((cfg.x ?? 50) / 100 - 0.5) * (largura - 100)
  const deslocY = ((cfg.y ?? 50) / 100 - 0.5) * (largura - 100)
  return {
    position: 'absolute',
    inset: 0,
    width: `${largura}%`,
    height: '100%',
    objectFit: 'cover',
    transform: `translate(calc(-50% + ${deslocX}px), calc(-50% + ${deslocY}px))`,
    left: '50%',
    top: '50%',
    opacity: Math.min(1, Math.max(0.15, (cfg.o ?? 100) / 100)),
  }
}

/** Página 1 (capa A4): fundo #f7f2eb, foto à direita, título e paciente à esquerda */
const CapaProposta: React.FC<{ programa: ProgramaTratamentoRecord }> = ({ programa }) => {
  const cfg = parseCapaConfig(programa.capa_config)
  const fotoUrl = getCapaFotoUrl(programa)
  const nomePaciente = programa.paciente_nome || programa.expand?.paciente_id?.nome || 'Cliente'

  return (
    <div
      className="capa-proposta-soul relative overflow-hidden"
      style={{ width: 794, height: 1123, backgroundColor: '#f7f2eb', color: '#3e2b1f' }}
    >
      {/* Foto da capa (metade direita, com ajustes) */}
      {fotoUrl && (
        <div className="absolute inset-y-0 right-0 overflow-hidden" style={{ width: 484 }}>
          <img src={fotoUrl} alt="" style={estiloFotoCapa(cfg)} crossOrigin="anonymous" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to right, #f7f2eb 0%, rgba(247,242,235,0.55) 18%, rgba(247,242,235,0) 60%)',
            }}
          />
        </div>
      )}

      {/* Conteúdo da capa (coluna esquerda) */}
      <div className="absolute inset-0 flex flex-col" style={{ padding: '56px 48px 40px' }}>
        <div style={{ width: 120 }}>
          <LogoSOUL variant="full" size="sm" theme="light" />
        </div>

        <div style={{ marginTop: 96, maxWidth: 300 }}>
          <p
            className="uppercase"
            style={{ fontSize: 11, letterSpacing: 3, color: '#B86545', fontWeight: 700 }}
          >
            Proposta de Tratamento
          </p>
          <h1
            className="uppercase"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 44,
              lineHeight: 1.1,
              fontWeight: 600,
              marginTop: 14,
              whiteSpace: 'pre-line',
            }}
          >
            {programa.titulo || 'Programa de Tratamento'}
          </h1>
          <div style={{ width: 54, height: 2, backgroundColor: '#C9A46A', marginTop: 22 }} />
          {(programa.mes_referencia || '').trim() && (
            <p style={{ marginTop: 18, fontSize: 13, letterSpacing: 1, color: '#6A402D' }}>
              {programa.mes_referencia}
            </p>
          )}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <p
            style={{
              fontSize: 10,
              letterSpacing: 2.4,
              color: '#B08A55',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            Preparado para
          </p>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 30,
              fontWeight: 600,
              marginTop: 6,
            }}
          >
            {nomePaciente}
          </p>
          <p style={{ marginTop: 14, fontSize: 10.5, color: '#6A402D' }}>
            Clínica SOUL — Saúde e Bem Estar
          </p>
          <p style={{ marginTop: 2, fontSize: 9.5, color: '#8A7A6E' }}>
            Vinhedo/SP • (19)9 9895-0080 • @clinicasoul.saudeebemestar
          </p>
        </div>
      </div>
    </div>
  )
}

/** Página 2 (proposta, A4): fundo #faf6f0 — apresentação, serviços, condições */
const PaginaProposta: React.FC<{ programa: ProgramaTratamentoRecord }> = ({ programa }) => {
  const pac = programa.expand?.paciente_id
  const nomePaciente = programa.paciente_nome || pac?.nome || '—'
  const cpfPaciente = pac?.cpf ? formatCPF(pac.cpf) : ''
  const telefonePaciente = pac?.telefone ? formatTelefone(pac.telefone) : ''
  const emailPaciente = pac?.email || ''

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

  const apresentacao = (programa.texto_apresentacao || '').trim()
  const introducao = (programa.texto_introducao || '').trim()
  const condicoesPagamento = (programa.condicoes_pagamento || programa.condicoes || '').trim()
  const observacoes = (programa.observacoes || '').trim()

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: 794, height: 1123, backgroundColor: '#faf6f0', color: '#3e2b1f' }}
    >
      <div
        style={{
          padding: '44px 46px 30px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Cabeçalho */}
        <div className="flex items-end gap-4" style={{ marginBottom: 22 }}>
          <div style={{ width: 104, flexShrink: 0 }}>
            <LogoSOUL variant="full" size="sm" theme="light" />
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: 9.5,
                letterSpacing: 2.6,
                color: '#B08A55',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Programa de Tratamento
            </p>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 25,
                fontWeight: 600,
                lineHeight: 1.15,
                whiteSpace: 'pre-line',
              }}
            >
              {programa.titulo || 'Programa de Tratamento'}
            </p>
            {(periodoTexto || semanasTexto) && (
              <p style={{ fontSize: 10.5, color: '#6A402D', marginTop: 4 }}>
                {[periodoTexto, semanasTexto].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>
        </div>
        <div style={{ height: 1, backgroundColor: '#D5AE6F', opacity: 0.6, marginBottom: 24 }} />

        {/* Cliente */}
        <div
          style={{
            backgroundColor: '#f3ede2',
            border: '1px solid #E9E1D2',
            borderRadius: 10,
            padding: '14px 18px',
            marginBottom: 24,
            fontSize: 10.5,
          }}
        >
          <p
            style={{
              fontSize: 9,
              letterSpacing: 2,
              color: '#B08A55',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Cliente
          </p>
          <p style={{ fontWeight: 600, fontSize: 12.5 }}>
            {nomePaciente}
            {cpfPaciente && (
              <span style={{ fontWeight: 400, fontSize: 9.5, color: '#8A7A6E' }}>
                {' '}
                · CPF {cpfPaciente}
              </span>
            )}
          </p>
          {(telefonePaciente || emailPaciente) && (
            <p style={{ fontSize: 10, color: '#6A402D', marginTop: 2 }}>
              {[telefonePaciente, emailPaciente].filter(Boolean).join(' • ')}
            </p>
          )}
        </div>

        {/* Apresentação */}
        {apresentacao && (
          <div style={{ marginBottom: 24 }}>
            <p
              style={{
                fontSize: 9,
                letterSpacing: 2,
                color: '#B08A55',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Apresentação
            </p>
            <p style={{ fontSize: 11, lineHeight: 1.75, whiteSpace: 'pre-line' }}>{apresentacao}</p>
          </div>
        )}

        {/* Introdução / objetivos */}
        {introducao && (
          <div style={{ marginBottom: 24 }}>
            <p
              style={{
                fontSize: 9,
                letterSpacing: 2,
                color: '#B08A55',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              O Programa
            </p>
            <p style={{ fontSize: 11, lineHeight: 1.75, whiteSpace: 'pre-line' }}>{introducao}</p>
          </div>
        )}

        {/* Tabela de serviços */}
        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              fontSize: 9,
              letterSpacing: 2,
              color: '#B08A55',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Serviços compreendidos
          </p>
          {itens.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr style={{ backgroundColor: '#f3ede2', color: '#6A402D', fontWeight: 700 }}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #E9E1D2' }}>
                    Serviço
                  </td>
                  <td
                    style={{
                      padding: '8px 6px',
                      borderBottom: '1px solid #E9E1D2',
                      textAlign: 'center',
                      width: 44,
                    }}
                  >
                    Qtd.
                  </td>
                  <td
                    style={{
                      padding: '8px 6px',
                      borderBottom: '1px solid #E9E1D2',
                      textAlign: 'right',
                      width: 74,
                    }}
                  >
                    Unitário
                  </td>
                  <td
                    style={{
                      padding: '8px 6px',
                      borderBottom: '1px solid #E9E1D2',
                      textAlign: 'center',
                      width: 62,
                    }}
                  >
                    Desc.
                  </td>
                  <td
                    style={{
                      padding: '8px 10px',
                      borderBottom: '1px solid #E9E1D2',
                      textAlign: 'right',
                      width: 80,
                    }}
                  >
                    Subtotal
                  </td>
                </tr>
              </thead>
              <tbody>
                {itens.map((item, idx) => {
                  const sub = calcularSubtotalItem(item)
                  const descTexto =
                    item.tipoDesconto === 'percentual' && Number(item.desconto) > 0
                      ? `${formatarMoedaBRL(item.desconto)}%`
                      : item.tipoDesconto === 'valor' && Number(item.desconto) > 0
                        ? `R$ ${formatarMoedaBRL(item.desconto)}`
                        : '—'
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #EFE7DA' }}>
                      <td style={{ padding: '7px 10px' }}>{item.nome || '—'}</td>
                      <td style={{ padding: '7px 6px', textAlign: 'center' }}>
                        {item.quantidade || '—'}
                      </td>
                      <td style={{ padding: '7px 6px', textAlign: 'right' }}>
                        R$ {formatarMoedaBRL(item.valorUnitario)}
                      </td>
                      <td style={{ padding: '7px 6px', textAlign: 'center', color: '#6A402D' }}>
                        {descTexto}
                      </td>
                      <td
                        style={{
                          padding: '7px 10px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: '#6A402D',
                        }}
                      >
                        R$ {formatarMoedaBRL(sub)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                {descontoGeralTipo !== 'nenhum' && descontoGeralValor > 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ padding: '8px 10px', textAlign: 'right', color: '#6A402D' }}
                    >
                      Desconto geral ({descontoGeralTexto})
                    </td>
                    <td
                      style={{
                        padding: '8px 10px',
                        textAlign: 'right',
                        color: '#B86545',
                        fontWeight: 600,
                      }}
                    >
                      − R$ {formatarMoedaBRL(descontoGeralReal)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '10px 10px',
                      textAlign: 'right',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      fontSize: 11,
                      color: '#6A402D',
                    }}
                  >
                    Investimento total
                  </td>
                  <td
                    style={{
                      padding: '10px',
                      textAlign: 'right',
                      fontWeight: 700,
                      fontSize: 15,
                      color: '#6A402D',
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                    }}
                  >
                    R$ {formatarMoedaBRL(totalGeral)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p style={{ fontSize: 10.5, fontStyle: 'italic', color: '#8A7A6E' }}>
              — Nenhum serviço incluído —
            </p>
          )}
        </div>

        {/* Condições de pagamento */}
        {condicoesPagamento && (
          <div style={{ marginBottom: 20 }}>
            <p
              style={{
                fontSize: 9,
                letterSpacing: 2,
                color: '#B08A55',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Condições de pagamento
            </p>
            <p style={{ fontSize: 10.5, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {condicoesPagamento}
            </p>
          </div>
        )}

        {/* Observações */}
        {observacoes && (
          <div style={{ marginBottom: 20 }}>
            <p
              style={{
                fontSize: 9,
                letterSpacing: 2,
                color: '#B08A55',
                fontWeight: 700,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Observações
            </p>
            <p style={{ fontSize: 10.5, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{observacoes}</p>
          </div>
        )}

        {/* Assinaturas */}
        <div style={{ marginTop: 'auto', paddingTop: 18 }}>
          <div className="flex justify-between" style={{ gap: 40 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #3e2b1f', paddingTop: 6, margin: '0 18px' }}>
                <p style={{ fontSize: 10, fontWeight: 700 }}>Clínica SOUL — Saúde e Bem Estar</p>
                <p style={{ fontSize: 8.5, color: '#8A7A6E' }}>Responsável pela proposta</p>
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #3e2b1f', paddingTop: 6, margin: '0 18px' }}>
                <p style={{ fontSize: 10, fontWeight: 700 }}>
                  {nomePaciente !== '—' ? nomePaciente : 'Cliente'}
                </p>
                <p style={{ fontSize: 8.5, color: '#8A7A6E' }}>De acordo com o programa proposto</p>
              </div>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: 9, color: '#8A7A6E', marginTop: 22 }}>
            Vinhedo,{' '}
            {new Date().toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p style={{ textAlign: 'center', fontSize: 8.5, color: '#B08A55', marginTop: 14 }}>
            Clínica SOUL • Saúde e Bem Estar | (19)9 9895-0080 • @clinicasoul.saudeebemestar
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Documento institucional SOUL — Proposta Comercial de Programa de Tratamento.
 * Capa (página 1) com foto ajustável + página 2 com proposta completa.
 * Também é a PRÉVIA ao vivo no formulário (encolhida por transform).
 * Renderiza SOMENTE os dados inseridos pelo admin: campos vazios omitem a seção.
 */
export const DocumentoPropostaTratamento: React.FC<DocumentoPropostaTratamentoProps> = ({
  programa,
}) => {
  if (!programa) return null

  return (
    <div
      className="documento-proposta-soul"
      style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
      data-documento-proposta="1"
    >
      <CapaProposta programa={programa} />
      <PaginaProposta programa={programa} />
    </div>
  )
}

export default DocumentoPropostaTratamento
