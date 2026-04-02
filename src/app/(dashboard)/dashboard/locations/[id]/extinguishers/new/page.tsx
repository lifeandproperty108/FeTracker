import { ExtinguisherForm } from '@/components/extinguishers/extinguisher-form'

export default async function NewExtinguisherPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Extinguisher</h1>
        <p className="text-muted-foreground">
          Add a new fire extinguisher to this location.
        </p>
      </div>
      <ExtinguisherForm locationId={id} />
    </div>
  )
}
