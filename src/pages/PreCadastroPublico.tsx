import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  CheckCircle2,
  Loader2,
  User,
  Calendar,
  MapPin,
  FileBadge,
  Phone,
  Mail,
  HelpCircle,
  Stethoscope,
  Heart,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { LogoSOUL } from '@/components/LogoSOUL'
import { submitPreCadastro } from '@/services/pacientes'

export default function PreCadastroPublico() {
  const { token } = useParams<{ token?: string }>()

  // Garantir metatags e título da aba dinâmicos para a página pública de Pré-Avaliação da SOUL
  React.useEffect(() => {
    document.title = 'Pré-Avaliação - Clínica Soul'

    const setMetaTag = (selector: string, attr: string, value: string) => {
      let tag = document.querySelector(selector)
      if (!tag) {
        tag = document.createElement('meta')
        const [attrName] = selector.replace(/[[\]'"]/g, '').split('=')
        tag.setAttribute(attrName, selector.split('=')[1]?.replace(/['"]/g, '') || '')
        document.head.appendChild(tag)
      }
      tag.setAttribute(attr, value)
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const imageUrl = `${origin}/og-soul-pre-avaliacao-v2.png?v=0.0.55`

    setMetaTag('meta[property="og:type"]', 'content', 'website')
    setMetaTag('meta[property="og:site_name"]', 'content', 'Clínica SOUL')
    setMetaTag('meta[property="og:title"]', 'content', 'Pré-Avaliação - Clínica Soul')
    setMetaTag(
      'meta[property="og:description"]',
      'content',
      'Pré-Avaliação na Clínica SOUL — Saúde, Bem-Estar e Fisioterapia Integrada. Preencha seus dados para abertura do seu prontuário.',
    )
    setMetaTag('meta[property="og:image"]', 'content', imageUrl)
    setMetaTag('meta[property="og:image:secure_url"]', 'content', imageUrl)
    setMetaTag('meta[property="og:image:type"]', 'content', 'image/png')
    setMetaTag('meta[property="og:image:width"]', 'content', '1200')
    setMetaTag('meta[property="og:image:height"]', 'content', '630')
    setMetaTag(
      'meta[property="og:image:alt"]',
      'content',
      'Pré-Avaliação Clínica SOUL — Saúde e Bem-Estar',
    )
    setMetaTag('meta[property="og:url"]', 'content', `${origin}/pre-cadastro`)
    setMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image')
    setMetaTag('meta[name="twitter:title"]', 'content', 'Pré-Avaliação - Clínica Soul')
    setMetaTag(
      'meta[name="twitter:description"]',
      'content',
      'Pré-Avaliação na Clínica SOUL — Saúde, Bem-Estar e Fisioterapia Integrada. Preencha seus dados para abertura do seu prontuário.',
    )
    setMetaTag('meta[name="twitter:image"]', 'content', imageUrl)
  }, [])

  // Form states
  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')

  // Perguntas específicas pedidas pelo usuário
  const [origem, setOrigem] = useState<'Indicação' | 'Google' | 'Instagram' | 'Outro'>('Indicação')
  const [origemOutro, setOrigemOutro] = useState('')
  const [motivoProcura, setMotivoProcura] = useState('')
  const [limitacoesIncomodo, setLimitacoesIncomodo] = useState('')
  const [tratamentosAnteriores, setTratamentosAnteriores] = useState('')
  const [resultadoEsperado, setResultadoEsperado] = useState('')
  const [diagnosticoMedico, setDiagnosticoMedico] = useState('')

  // UI status
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Formatação automática CPF e Telefone
  const handleCpfChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11)
    if (raw.length <= 3) setCpf(raw)
    else if (raw.length <= 6) setCpf(`${raw.slice(0, 3)}.${raw.slice(3)}`)
    else if (raw.length <= 9) setCpf(`${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`)
    else setCpf(`${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9, 11)}`)
  }

  const handleTelefoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11)
    if (raw.length <= 2) setTelefone(raw ? `(${raw}` : '')
    else if (raw.length <= 7) setTelefone(`(${raw.slice(0, 2)}) ${raw.slice(2)}`)
    else setTelefone(`(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`)
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!nome.trim()) errs.nome = 'Nome completo é obrigatório.'
    if (!telefone.trim()) errs.telefone = 'Telefone para contato é obrigatório.'
    if (!motivoProcura.trim())
      errs.motivoProcura = 'Por favor, informe o real motivo que te trouxe.'
    if (!limitacoesIncomodo.trim())
      errs.limitacoesIncomodo = 'Por favor, informe o que tem te incomodado ou limitado.'
    if (!resultadoEsperado.trim())
      errs.resultadoEsperado = 'Por favor, informe qual resultado espera.'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      window.scrollTo({ top: 300, behavior: 'smooth' })
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      const origemFinal =
        origem === 'Outro' && origemOutro.trim() ? `Outro: ${origemOutro.trim()}` : origem

      await submitPreCadastro({
        nome: nome.trim(),
        cpf: cpf.trim() || undefined,
        data_nascimento: dataNascimento ? `${dataNascimento} 00:00:00.000Z` : undefined,
        telefone: telefone.trim(),
        endereco: endereco.trim() || undefined,
        email: email.trim() || undefined,
        origem_como_chegou: origemFinal,
        motivo_procura: motivoProcura.trim(),
        limitacoes_incomodo: limitacoesIncomodo.trim(),
        tratamentos_anteriores: tratamentosAnteriores.trim() || 'Não informou',
        resultado_esperado: resultadoEsperado.trim(),
        diagnostico_medico: diagnosticoMedico.trim() || 'Não tenho / não sei',
      })

      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      console.error('Erro ao enviar pré-cadastro:', err)
      const dataErrors = err?.data?.data
      if (dataErrors?.cpf) {
        setErrors({ cpf: 'Este CPF já consta cadastrado em nossa base.' })
      } else {
        setErrors({
          global:
            err?.message ||
            'Ocorreu um erro ao enviar suas informações. Por favor, tente novamente.',
        })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#33221C] flex flex-col justify-between selection:bg-[#E3C89A]/40 selection:text-[#33221C]">
      {/* Top Banner Decorativo */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#8C6527] via-[#C9A46A] to-[#E3C89A]" />

      <main className="flex-1 py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Logo oficial da Clínica SOUL — Regra: variante full (símbolo em cima, texto em baixo, sem distorção) */}
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <LogoSOUL variant="full" size="lg" theme="light" />
            <div className="max-w-lg space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#33221C] tracking-tight">
                Pré-Avaliação do Paciente
              </h1>
              <p className="text-sm text-[#73574A] font-light leading-relaxed">
                Preencha seus dados cadastrais e principais motivos da consulta. Suas respostas
                chegam diretamente à nossa equipe clínica para a abertura prévia do seu prontuário.
              </p>
            </div>
          </div>

          {/* Tela de confirmação amigável pós-envio */}
          {submitted ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E9E1D2] shadow-sm text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-[#FAF5EE] border-2 border-[#C9A46A] text-[#8C6527] flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9 text-[#8C6527]" />
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-2xl font-serif font-bold text-[#33221C]">
                  Recebemos sua pré-avaliação!
                </h2>
                <p className="text-sm text-[#73574A] leading-relaxed">
                  Agradecemos a confiança na Clínica SOUL. Seus dados já foram registrados em nosso
                  sistema clínico e, em breve, entraremos em contato para confirmar seu agendamento
                  e dar continuidade ao seu cuidado integral.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF5EE] border border-[#E9E1D2] text-xs text-[#73574A] text-left space-y-1.5">
                <div className="font-semibold text-[#8C6527] flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Informações Seguras
                </div>
                <p>
                  Paciente: <strong className="text-[#33221C]">{nome}</strong>
                </p>
                <p>
                  Contato: <strong className="text-[#33221C]">{telefone}</strong>
                </p>
                <p className="text-[11px] text-gray-500 pt-1">
                  Seus dados estão protegidos de acordo com a LGPD e são exclusivos para a condução
                  do seu atendimento na Clínica SOUL.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    setSubmitted(false)
                    setNome('')
                    setCpf('')
                    setDataNascimento('')
                    setTelefone('')
                    setEmail('')
                    setEndereco('')
                    setMotivoProcura('')
                    setLimitacoesIncomodo('')
                    setTratamentosAnteriores('')
                    setResultadoEsperado('')
                    setDiagnosticoMedico('')
                  }}
                  variant="outline"
                  className="rounded-xl border-[#E9E1D2] text-[#73574A] hover:bg-[#FAF5EE] text-xs"
                >
                  Enviar outra pré-avaliação
                </Button>
              </div>
            </div>
          ) : (
            /* Formulário público */
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E9E1D2] shadow-sm space-y-8"
            >
              {errors.global && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800">
                  {errors.global}
                </div>
              )}

              {/* SEÇÃO 1: DADOS CADASTRAIS BÁSICOS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E9E1D2]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FAF5EE] text-[#8C6527] font-bold text-xs border border-[#E3C89A]/50">
                    1
                  </span>
                  <h3 className="text-base font-bold text-[#33221C]">Dados Pessoais e Contato</h3>
                </div>

                <div className="space-y-3.5">
                  {/* Nome Completo */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#5C4033] flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-[#8C6527]" />
                      Nome completo *
                    </Label>
                    <Input
                      required
                      placeholder="Seu nome completo"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="h-11 rounded-xl border-[#E9E1D2] focus-visible:ring-[#C9A46A] bg-[#FAF8F5]/50 text-sm"
                    />
                    {errors.nome && <p className="text-xs text-red-600">{errors.nome}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Data de Nascimento */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#5C4033] flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#8C6527]" />
                        Data de nascimento
                      </Label>
                      <Input
                        type="date"
                        value={dataNascimento}
                        onChange={(e) => setDataNascimento(e.target.value)}
                        className="h-11 rounded-xl border-[#E9E1D2] focus-visible:ring-[#C9A46A] bg-[#FAF8F5]/50 text-sm"
                      />
                    </div>

                    {/* CPF */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#5C4033] flex items-center gap-1.5">
                        <FileBadge className="h-3.5 w-3.5 text-[#8C6527]" />
                        CPF
                      </Label>
                      <Input
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={(e) => handleCpfChange(e.target.value)}
                        className="h-11 rounded-xl border-[#E9E1D2] focus-visible:ring-[#C9A46A] bg-[#FAF8F5]/50 text-sm font-mono"
                      />
                      {errors.cpf && <p className="text-xs text-red-600">{errors.cpf}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Telefone / Contato */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#5C4033] flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-[#8C6527]" />
                        Telefone / WhatsApp *
                      </Label>
                      <Input
                        required
                        placeholder="(00) 00000-0000"
                        value={telefone}
                        onChange={(e) => handleTelefoneChange(e.target.value)}
                        className="h-11 rounded-xl border-[#E9E1D2] focus-visible:ring-[#C9A46A] bg-[#FAF8F5]/50 text-sm font-mono"
                      />
                      {errors.telefone && <p className="text-xs text-red-600">{errors.telefone}</p>}
                    </div>

                    {/* E-mail (opcional) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#5C4033] flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-[#8C6527]" />
                        E-mail
                      </Label>
                      <Input
                        type="email"
                        placeholder="seu.email@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-xl border-[#E9E1D2] focus-visible:ring-[#C9A46A] bg-[#FAF8F5]/50 text-sm"
                      />
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#5C4033] flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[#8C6527]" />
                      Endereço
                    </Label>
                    <Input
                      placeholder="Rua, número, bairro, cidade - estado"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      className="h-11 rounded-xl border-[#E9E1D2] focus-visible:ring-[#C9A46A] bg-[#FAF8F5]/50 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: COMO CHEGOU ATÉ NÓS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E9E1D2]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FAF5EE] text-[#8C6527] font-bold text-xs border border-[#E3C89A]/50">
                    2
                  </span>
                  <h3 className="text-base font-bold text-[#33221C]">Como chegou até nós? *</h3>
                </div>

                <RadioGroup
                  value={origem}
                  onValueChange={(val: any) => setOrigem(val)}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1"
                >
                  {[
                    { id: 'ind', val: 'Indicação', label: 'Indicação' },
                    { id: 'goo', val: 'Google', label: 'Google' },
                    { id: 'ins', val: 'Instagram', label: 'Instagram' },
                    { id: 'out', val: 'Outro', label: 'Outro' },
                  ].map((item) => (
                    <label
                      key={item.val}
                      htmlFor={item.id}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all text-xs font-semibold ${
                        origem === item.val
                          ? 'border-[#C9A46A] bg-[#FAF5EE] text-[#8C6527] shadow-xs'
                          : 'border-[#E9E1D2] bg-white text-[#73574A] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <RadioGroupItem value={item.val} id={item.id} className="text-[#8C6527]" />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </RadioGroup>

                {origem === 'Outro' && (
                  <div className="pt-1.5 animate-in fade-in duration-200">
                    <Input
                      placeholder="Por favor, especifique como nos conheceu..."
                      value={origemOutro}
                      onChange={(e) => setOrigemOutro(e.target.value)}
                      className="h-10 rounded-xl border-[#E9E1D2] bg-[#FAF8F5]/50 text-xs sm:text-sm"
                    />
                  </div>
                )}
              </div>

              {/* SEÇÃO 3: ANAMNESE E MOTIVAÇÃO CLÍNICA */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E9E1D2]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FAF5EE] text-[#8C6527] font-bold text-xs border border-[#E3C89A]/50">
                    3
                  </span>
                  <h3 className="text-base font-bold text-[#33221C]">
                    Histórico Clínico e Motivação
                  </h3>
                </div>

                {/* Pergunta 1: Por que veio até aqui / qual real motivo que te trouxe? */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#5C4033] leading-snug block">
                    Por que veio até aqui? Qual o real motivo que te trouxe? *
                  </Label>
                  <Textarea
                    required
                    rows={3}
                    placeholder="Conte em detalhes a sua queixa, desconforto ou dor principal..."
                    value={motivoProcura}
                    onChange={(e) => setMotivoProcura(e.target.value)}
                    className="rounded-xl border-[#E9E1D2] focus-visible:ring-[#C9A46A] bg-[#FAF8F5]/50 text-xs sm:text-sm resize-none"
                  />
                  {errors.motivoProcura && (
                    <p className="text-xs text-red-600">{errors.motivoProcura}</p>
                  )}
                </div>

                {/* Pergunta 2: O que te incomoda ou o que tem acontecido com você que tem te limitado para fazer algo? */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#5C4033] leading-snug block">
                    O que te incomoda ou o que tem acontecido com você que tem te limitado para
                    fazer algo? *
                  </Label>
                  <Textarea
                    required
                    rows={3}
                    placeholder="Ex: Não consigo ficar muito tempo em pé, parei de praticar meu esporte, dor ao dormir ou trabalhar..."
                    value={limitacoesIncomodo}
                    onChange={(e) => setLimitacoesIncomodo(e.target.value)}
                    className="rounded-xl border-[#E9E1D2] focus-visible:ring-[#C9A46A] bg-[#FAF8F5]/50 text-xs sm:text-sm resize-none"
                  />
                  {errors.limitacoesIncomodo && (
                    <p className="text-xs text-red-600">{errors.limitacoesIncomodo}</p>
                  )}
                </div>

                {/* Pergunta 3: Já tentou fazer alguma coisa para melhorar (tratamento)? Qual? */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#5C4033] leading-snug block">
                    Já tentou fazer alguma coisa para melhorar (tratamento)? Qual?
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="Ex: Tomei remédio, fiz 10 sessões de fisioterapia tradicional, acupuntura, repouso... ou 'Não tentei nada ainda'."
                    value={tratamentosAnteriores}
                    onChange={(e) => setTratamentosAnteriores(e.target.value)}
                    className="rounded-xl border-[#E9E1D2] focus-visible:ring-[#C9A46A] bg-[#FAF8F5]/50 text-xs sm:text-sm resize-none"
                  />
                </div>

                {/* Pergunta 4: Qual resultado espera? */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#5C4033] leading-snug block">
                    Qual resultado espera? *
                  </Label>
                  <Textarea
                    required
                    rows={2}
                    placeholder="Ex: Voltar a correr 5km sem dor, trabalhar sem desconforto, recuperar amplitude de movimento..."
                    value={resultadoEsperado}
                    onChange={(e) => setResultadoEsperado(e.target.value)}
                    className="rounded-xl border-[#E9E1D2] focus-visible:ring-[#C9A46A] bg-[#FAF8F5]/50 text-xs sm:text-sm resize-none"
                  />
                  {errors.resultadoEsperado && (
                    <p className="text-xs text-red-600">{errors.resultadoEsperado}</p>
                  )}
                </div>

                {/* Pergunta 5: Qual diagnóstico médico? */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#5C4033] leading-snug flex items-center justify-between">
                    <span>Qual diagnóstico médico?</span>
                    <span className="text-[11px] font-normal text-gray-500">
                      (pode ser "Não tenho / não sei")
                    </span>
                  </Label>
                  <Input
                    placeholder="Ex: Tendinite, hérnia de disco L4-L5, ou 'Não tenho diagnóstico médico'"
                    value={diagnosticoMedico}
                    onChange={(e) => setDiagnosticoMedico(e.target.value)}
                    className="h-11 rounded-xl border-[#E9E1D2] focus-visible:ring-[#C9A46A] bg-[#FAF8F5]/50 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="pt-4 border-t border-[#E9E1D2] flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[11px] text-[#73574A] text-center sm:text-left flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#8C6527] shrink-0" />
                  Seus dados são transmitidos de forma segura para o prontuário SOUL.
                </p>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#C9A46A] via-[#B88E52] to-[#A37839] hover:brightness-105 text-[#33221C] font-bold rounded-xl h-12 px-8 text-sm shadow-md border border-[#DFBF8E]/40 flex items-center justify-center gap-2 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-[#33221C]" />
                      Gravando pré-avaliação...
                    </>
                  ) : (
                    <>
                      Enviar Pré-Avaliação
                      <ArrowRight className="h-4 w-4 text-[#33221C]" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Rodapé com Identidade SOUL */}
          <footer className="text-center text-xs text-[#73574A] py-4 space-y-1">
            <p className="font-serif font-semibold text-[#8C6527]">
              Clínica SOUL — Saúde e Bem-Estar
            </p>
            <p className="text-[11px] text-[#8C6527]/70">
              Sistema de Avaliação e Prontuário Multidisciplinar
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}
