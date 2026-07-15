export const dynamic = 'force-dynamic'

import { PREVIEW_MODE } from '@/lib/preview'
import { FeedbackView } from './feedback-view'

export default function FeedbackPage() {
  return <FeedbackView preview={PREVIEW_MODE} />
}
