/**
 * Conversão de arquivo para data URL (base64) com FileReader — API nativa do
 * navegador, sem dependência externa. O data URL é enviado ao hook
 * /backend/v1/anexos/analisar-ia no campo 'arquivo_base64', que o usa para a
 * visão multimodal quando o documento não tem texto extraível
 * (PDF escaneado) ou quando já é uma imagem.
 *
 * Limite de 6 MB de arquivo: um PDF escaneado de 6 MB vira um data URL de
 * ~8 MB em base64, que a IA de visão aceita sem risco do timeout de 30 s
 * observado em runtime com payloads maiores.
 */

const TAMANHO_MAX_BYTES = 6 * 1024 * 1024

export function arquivoParaDataUrl(file: File | Blob): Promise<string | null> {
  if (file.size > TAMANHO_MAX_BYTES) return Promise.resolve(null)

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}
