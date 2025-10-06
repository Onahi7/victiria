import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin } from 'lucide-react';

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  coverImage: string | null;
  slug: string;
  type: 'Online' | 'In-Person';
}

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <Link href={`/events/${event.slug}`} passHref>
      <Card className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
        <CardContent className="p-0">
          <div className="relative">
            <Image
              src={event.coverImage || '/placeholder.jpg'}
              alt={event.title}
              width={400}
              height={250}
              className="object-cover w-full h-48"
            />
            <Badge className="absolute top-2 right-2">{event.type}</Badge>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold truncate">{event.title}</h3>
            <div className="text-sm text-muted-foreground mt-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{event.location}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
