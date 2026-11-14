/**
 * Converte um arquivo para data URL via FileReader nativo (sem dependências).
 * Usado pela visão multimodal do hook anexos_ia.js para ler imagens soltas e
 * como fallback quando o pdf.js de CDN não está disponível.
 */

export const LIMITE_DATA_URL = 6 * 1024 * 1024 // 6 MB de data URL (base64) por imagem

export function arquivoParaDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('falha_leitura_arquivo'))
    reader.readAsDataURL(file)
  })
}

export async function arquivoParaDataUrlComLimite(file: File | Blob): Promise<string> {
  const dataUrl = await arquivoParaDataUrl(file)
  if (dataUrl.length > LIMITE_DATA_URL) {
    throw new Error('ARQUIVO_MUITO_GRANDE')
  }
  return dataUrl
}
