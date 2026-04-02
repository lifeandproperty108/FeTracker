import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string
  subject: string
  react: React.ReactElement
}) {
  const { data, error } = await getResend().emails.send({
    from: 'FE Tracker <notifications@fetracker.com>',
    to,
    subject,
    react,
  })

  if (error) throw error
  return data
}
