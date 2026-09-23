import { useLiveQuery } from 'dexie-react-hooks'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import type { MemoryCard } from '../../../core/db/types'
import { db } from '../../../core/db/schema'
import { toast } from '../../../core/feedback/feedback'
import { addCard } from '../../../core/srs/scheduler'
import { Button } from '../../../ui/primitives/Button'
import { TextArea, Toggle } from '../../../ui/primitives/Field'
import { Page } from '../../../ui/primitives/Page'

export function CardEdit() {
  const { id } = useParams()
  // En "nueva" no hay nada que cargar; al editar, undefined = cargando y null = no existe.
  const card = useLiveQuery(async () => (id ? ((await db.cards.get(id)) ?? null) : null), [id])
  if (id && card === undefined) return null
  return <CardForm key={id ?? 'new'} card={card ?? null} />
}

function CardForm({ card }: { card: MemoryCard | null }) {
  const { t } = useTranslation('recall')
  const navigate = useNavigate()
  const [front, setFront] = useState(card?.front ?? '')
  const [back, setBack] = useState(card?.back ?? '')
  const [suspended, setSuspended] = useState(card?.suspended ?? false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isPerson = card?.kind === 'person'

  async function save(e: FormEvent) {
    e.preventDefault()
    if (card) {
      await db.cards.update(card.id, { front: front.trim(), back: back.trim(), suspended })
      toast(t('saved'))
    } else {
      await addCard('fact', front.trim(), back.trim())
      toast(t('created'), 'success')
    }
    navigate('/m/recall')
  }

  async function remove() {
    if (!card) return
    await db.transaction('rw', db.cards, db.reviews, async () => {
      await db.reviews.where('cardId').equals(card.id).delete()
      await db.cards.delete(card.id)
    })
    toast(t('deleted'))
    navigate('/m/recall')
  }

  return (
    <Page title={card ? t('editTitle') : t('newTitle')} lead={card ? undefined : t('newLead')} back="/m/recall">
      <form onSubmit={save} className="flex flex-col gap-6">
        {isPerson ? (
          <p className="rounded-xl bg-panel-2 p-4 text-ink-dim">{t('personEditHint')}</p>
        ) : (
          <>
            <TextArea label={t('frontLabel')} hint={t('frontHint')} value={front} onChange={(e) => setFront(e.target.value)} rows={3} required />
            <TextArea label={t('backLabel')} hint={t('backHint')} value={back} onChange={(e) => setBack(e.target.value)} rows={4} required />
          </>
        )}
        {card && <Toggle label={t('suspend')} hint={t('suspendHint')} checked={suspended} onChange={setSuspended} />}
        <Button type="submit" block disabled={!isPerson && (!front.trim() || !back.trim())}>
          {card ? t('save') : t('create')}
        </Button>
      </form>
      {card && (
        <div className="mt-10 border-t border-line pt-6">
          {!confirmDelete ? (
            <Button variant="danger" block onClick={() => setConfirmDelete(true)}>
              {t('delete')}
            </Button>
          ) : (
            <div className="flex flex-col gap-3" role="alert">
              <p>{t('deleteConfirm')}</p>
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
      )}
    </Page>
  )
}
