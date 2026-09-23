import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { db } from '../../../core/db/schema'
import type { Person } from '../../../core/db/types'
import { toast } from '../../../core/feedback/feedback'
import { Button } from '../../../ui/primitives/Button'
import { TextArea, TextField } from '../../../ui/primitives/Field'
import { Page } from '../../../ui/primitives/Page'
import { personCardText } from '../personCard'

export function PersonEdit() {
  const { t } = useTranslation('people')
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const person = useLiveQuery(() => db.people.get(id), [id])
  const [p, setP] = useState<Person>()
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (person) setP(person)
  }, [person])

  if (person === undefined && !p) return null
  if (!p) return <Page title={t('notFound')} back="/m/people" />

  const set = (k: keyof Person) => (e: { target: { value: string } }) => setP({ ...p, [k]: e.target.value })

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!p) return
    const text = personCardText(p)
    await db.transaction('rw', db.people, db.cards, async () => {
      await db.people.put(p)
      if (p.cardId) await db.cards.update(p.cardId, text)
    })
    toast(t('updated'))
    navigate('/m/people')
  }

  async function remove() {
    if (!p) return
    await db.transaction('rw', db.people, db.cards, db.reviews, async () => {
      if (p.cardId) {
        await db.reviews.where('cardId').equals(p.cardId).delete()
        await db.cards.delete(p.cardId)
      }
      await db.people.delete(p.id)
    })
    toast(t('deleted'))
    navigate('/m/people')
  }

  return (
    <Page title={p.name} back="/m/people">
      <form onSubmit={save} className="flex flex-col gap-6">
        <TextField label={t('name')} value={p.name} onChange={set('name')} required />
        <TextField label={t('whereMet')} value={p.whereMet} onChange={set('whereMet')} required />
        <TextField label={t('trait')} value={p.trait} onChange={set('trait')} required />
        <TextArea label={t('conversation')} value={p.conversation} onChange={set('conversation')} rows={3} />
        <TextField label={t('nameImageShort')} value={p.nameImage} onChange={set('nameImage')} />
        <TextArea label={t('linkImage')} value={p.linkImage} onChange={set('linkImage')} rows={3} />
        <Button type="submit" block>
          {t('saveChanges')}
        </Button>
      </form>
      <div className="mt-10 border-t border-line pt-6">
        {!confirmDelete ? (
          <Button variant="danger" block onClick={() => setConfirmDelete(true)}>
            {t('delete')}
          </Button>
        ) : (
          <div className="flex flex-col gap-3" role="alert">
            <p>{t('deleteConfirm', { name: p.name })}</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
                {t('cancel')}
              </Button>
              <Button variant="danger" onClick={remove}>
                {t('deleteYes')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Page>
  )
}
