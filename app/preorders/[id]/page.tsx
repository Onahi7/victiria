import PreorderDetail from '@/components/preorder-detail'
import { Metadata } from 'next'

interface PreorderPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: PreorderPageProps): Promise<Metadata> {
  try {
    const { id } = await params
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/preorders/${id}`, {
      cache: 'no-store'
    })
    
    if (response.ok) {
      const result = await response.json()
      const preorder = result.data
      
      return {
        title: `Preorder: ${preorder.book.title} - Victoria Publishing House`,
        description: `Preorder ${preorder.book.title} by ${preorder.book.author} at the special price of $${preorder.preorderPrice}. ${preorder.description}`,
        keywords: `${preorder.book.title}, ${preorder.book.author}, book preorder, early access, ${preorder.book.genre}`,
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
  }

  return {
    title: 'Book Preorder - Victoria Publishing House',
    description: 'Preorder upcoming book releases at special prices.',
  }
}

export default async function PreorderPage({ params }: PreorderPageProps) {
  const { id } = await params
  return <PreorderDetail preorderId={id} />
}
