import QRCode from 'qrcode'

export async function generateQRDataURL(extinguisherId: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/inspect/extinguisher/${extinguisherId}`
  return QRCode.toDataURL(url, { width: 200, margin: 1 })
}
