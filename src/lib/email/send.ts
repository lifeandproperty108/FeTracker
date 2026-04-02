import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string
  subject: string
  react: React.ReactElement
}) {
  const { data, error } = await resend.emails.send({
    from: 'FE Tracker <notifications@fetracker.com>',
    to,
    subject,
    react,
  })

  if (error) throw error
  return data
}
