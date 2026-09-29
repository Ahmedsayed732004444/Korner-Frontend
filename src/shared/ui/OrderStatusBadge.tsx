import { useTranslation } from 'react-i18next'
import { orderStatusTone, type OrderStatus } from '@/shared/lib/orderStatus'
import { Badge } from './Badge'

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useTranslation()
  return <Badge tone={orderStatusTone(status)}>{t(`track.status.${status}`)}</Badge>
}
