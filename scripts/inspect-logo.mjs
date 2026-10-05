import https from 'node:https'
import fs from 'node:fs'

const url =
  'https://dagtlwojkqyivnjgveda.supabase.co/storage/v1/object/public/message-attachments/53b2f9ee-ee31-4630-a588-9a86ff3a6242/logogradiente-d4737.jpg'

https
  .get(url, (res) => {
    const chunks = []
    res.on('data', (c) => chunks.push(c))
    res.on('end', () => {
      const buf = Buffer.concat(chunks)
      console.log('Image fetched! Size in bytes:', buf.length)
      fs.writeFileSync('public/logogradiente-oficial.jpg', buf)
      console.log('Saved to public/logogradiente-oficial.jpg')
    })
  })
  .on('error', (err) => {
    console.error('Error fetching image:', err)
  })
