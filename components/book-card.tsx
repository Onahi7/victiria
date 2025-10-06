import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  priceUsd?: number;
  priceNgn?: number;
  coverImage?: string; // Legacy field
  frontCoverImage?: string;
  backCoverImage?: string;
  category: string;
  slug: string;
  averageRating?: number;
  reviewCount?: number;
}

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  // Prevent navigation if slug is undefined or invalid
  const href = book.slug && book.slug !== 'undefined' ? `/books/${book.slug}` : '#'
  
  return (
    <Link href={href} passHref>
      <Card className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
        <CardContent className="p-0">
          <div className="relative">
            <Image
              src={book.frontCoverImage || book.coverImage || '/placeholder.jpg'}
              alt={book.title}
              width={400}
              height={500}
              className="object-cover w-full h-64"
            />
            <Badge className="absolute top-2 left-2">{book.category}</Badge>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold truncate">{book.title}</h3>
            <p className="text-sm text-muted-foreground">{book.author}</p>
            <p className="text-lg font-bold mt-2">
              {book.priceNgn && book.priceUsd ? (
                <>
                  <span className="text-sm">₦{Number(book.priceNgn).toLocaleString()}</span>
                  <span className="text-muted-foreground mx-1">|</span>
                  <span className="text-sm">${Number(book.priceUsd).toLocaleString()}</span>
                </>
              ) : book.priceNgn ? (
                `₦${Number(book.priceNgn).toLocaleString()}`
              ) : book.priceUsd ? (
                `$${Number(book.priceUsd).toLocaleString()}`
              ) : (
                `₦${book.price.toLocaleString()}`
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
