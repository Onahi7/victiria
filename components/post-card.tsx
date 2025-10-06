import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  coverImage: string | null;
  category: string | null;
  author: {
    name: string;
    avatar: string | null;
  };
  publishedAt: string;
}

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`} passHref>
      <Card className="w-full max-w-sm rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
        <CardContent className="p-0">
          <div className="relative">
            <Image
              src={post.coverImage || '/placeholder.jpg'}
              alt={post.title}
              width={400}
              height={250}
              className="object-cover w-full h-48"
            />
            <Badge className="absolute top-2 right-2">{post.category}</Badge>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold truncate h-14">{post.title}</h3>
            <div className="text-sm text-muted-foreground mt-2 flex items-center">
              <div className="flex items-center">
                <Avatar className="w-6 h-6 mr-2">
                  <AvatarImage src={post.author.avatar || undefined} alt={post.author.name} />
                  <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span>{post.author.name}</span>
              </div>
              <span className="mx-2">|</span>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
