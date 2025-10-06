"use client";

import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookCard, Book } from './book-card';
import { Button } from './ui/button';
import Link from 'next/link';

export function BooksAccordion() {
  const [latestBooks, setLatestBooks] = useState<Book[]>([]);
  const [topRatedBooks, setTopRatedBooks] = useState<Book[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooks(sortBy: string, setter: React.Dispatch<React.SetStateAction<Book[]>>) {
      try {
        const response = await fetch(`/api/books?sortBy=${sortBy}&limit=6`);
        const data = await response.json();
        if (data.success) {
          setter(data.data.books);
        }
      } catch (error) {
        console.error(`Failed to fetch ${sortBy} books:`, error);
      }
    }

    async function fetchAllBooks() {
      setLoading(true);
      await Promise.all([
        fetchBooks('createdAt', setLatestBooks),
        fetchBooks('averageRating', setTopRatedBooks),
        fetchBooks('salesCount', setFeaturedBooks)
      ]);
      setLoading(false);
    }

    fetchAllBooks();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-center mb-8 md:mb-12 lg:mb-16 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
          Explore Our Collection
        </h2>
        <Accordion type="single" collapsible defaultValue="item-1" className="w-full md:hidden">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-xl font-semibold">Latest Releases</AccordionTrigger>
            <AccordionContent>
              <div className="flex overflow-x-auto space-x-4 p-2">
                {latestBooks.map(book => (
                  <div key={book.id} className="min-w-[250px]">
                    <BookCard book={book} />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-xl font-semibold">Top Rated Books</AccordionTrigger>
            <AccordionContent>
              <div className="flex overflow-x-auto space-x-4 p-2">
                {topRatedBooks.map(book => (
                  <div key={book.id} className="min-w-[250px]">
                    <BookCard book={book} />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-xl font-semibold">Featured Books</AccordionTrigger>
            <AccordionContent>
              <div className="flex overflow-x-auto space-x-4 p-2">
                {featuredBooks.map(book => (
                  <div key={book.id} className="min-w-[250px]">
                    <BookCard book={book} />
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="hidden md:block">
           <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-xl font-semibold">Latest Releases</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {latestBooks.map(book => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-xl font-semibold">Top Rated Books</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topRatedBooks.map(book => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-xl font-semibold">Featured Books</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredBooks.map(book => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
        </div>

        <div className="text-center mt-8">
            <Button asChild size="lg">
                <Link href="/books">View All Books</Link>
            </Button>
        </div>
      </div>
    </section>
  );
}
