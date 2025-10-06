import PreordersList from '@/components/preorders-list'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book Preorders - Victoria Publishing House',
  description: 'Get early access to upcoming book releases at special preorder prices. Secure your copies before they hit the shelves.',
  keywords: 'book preorders, early access, upcoming releases, special prices, Victoria Publishing House',
}

export default function PreordersPage() {
  return <PreordersList />
}
