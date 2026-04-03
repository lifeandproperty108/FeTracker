import { cookies } from 'next/headers'

export async function getSelectedOrgId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('selected_org_id')?.value ?? null
}
