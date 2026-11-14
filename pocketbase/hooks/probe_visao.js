/// <reference path="../pb_data/types.d.ts" />
// TEMPORÁRIO: sonda da chamada multimodal $ai.chat (image_url data URL).
// Busca uma foto real e pede ao modelo para descrevê-la. Remover após validar.

routerAdd('GET', '/backend/v1/probe-visao', (e) => {
  // Codificador base64 puro-JS sobre string binária (chars 0-255) — a JSVM
  // do PocketBase não expõe btoa nem $security.base64Encode.
  function base64DeBinario(binario) {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    let resultado = ''
    for (let i = 0; i < binario.length; i += 3) {
      const b1 = binario.charCodeAt(i)
      const b2 = i + 1 < binario.length ? binario.charCodeAt(i + 1) : 0
      const b3 = i + 2 < binario.length ? binario.charCodeAt(i + 2) : 0
      resultado += CHARS[b1 >> 2]
      resultado += CHARS[((b1 & 3) << 4) | (b2 >> 4)]
      resultado += i + 1 < binario.length ? CHARS[((b2 & 15) << 2) | (b3 >> 6)] : '='
      resultado += i + 2 < binario.length ? CHARS[b3 & 63] : '='
    }
    return resultado
  }

  try {
    const resp = $http.send({
      url: 'https://img.usecurling.com/p/400/300?q=apple',
      method: 'GET',
      headers: {},
      body: '',
    })
    const binario = String(resp.body || '')
    console.log('PROBE: foto baixada, chars=', binario.length)
    const b64 = base64DeBinario(binario)
    const reply = $ai.chat({
      model: 'fast',
      messages: [
        {
          role: 'system',
          content:
            'Responda em português com UMA palavra: o que aparece na imagem? Se não conseguir ver a imagem, responda exatamente "NAO VEJO".',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'O que aparece nesta imagem?' },
            { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + b64 } },
          ],
        },
      ],
    })
    return e.json(200, {
      ok: true,
      bytesFoto: binario.length,
      resposta: (reply.choices?.[0]?.message?.content || '').slice(0, 200),
    })
  } catch (err) {
    console.log('PROBE visão falhou:', err)
    return e.json(500, { ok: false, erro: String(err && err.message ? err.message : err) })
  }
})
