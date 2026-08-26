type Props = {
  title: string
  body?: string
}

export default function AdminEmptyState({ title, body }: Props) {
  return (
    <div className="admin-empty-state">
      <div className="admin-empty-title">{title}</div>
      {body ? <div className="admin-empty-body">{body}</div> : null}
    </div>
  )
}
