import os
import requests
import random
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from api.models import Author, Publisher, Book, Genre

class Command(BaseCommand):
    help = 'Populate the database with popular fantasy books from Open Library API'

    def handle(self, *args, **options):
        self.stdout.write('Clearing existing book data...')
        Book.objects.all().delete()
        Author.objects.all().delete()
        Publisher.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('Existing data cleared.'))

        base_url = 'https://openlibrary.org/search.json'
        
        # Search queries to get popular fantasy books
        queries = ['fantasy novel', 'fantasy bestseller', 'popular fantasy novel', 'epic fantasy novel']
        books_created = 0
        max_books = 100
        
        for query in queries:
            if books_created >= max_books:
                break
                
            params = {
                'q': query,
                'limit': 50,  # Max per request
                'offset': 0
            }
            
            try:
                response = requests.get(base_url, params=params)
                response.raise_for_status()
                data = response.json()
                
                docs = data.get('docs', [])
                
                for doc in docs:
                    if books_created >= max_books:
                        break
                    
                    # Extract book data
                    title = doc.get('title', '')
                    authors = doc.get('author_name', [])
                    publisher_name = doc.get('publisher', ['Unknown Publisher'])[0] if doc.get('publisher') else 'Unknown Publisher'
                    published_date = doc.get('first_publish_year')
                    if published_date and isinstance(published_date, int) and 1000 <= published_date <= 2100:
                        published_date = f"{published_date}-01-01"  # Normalize to YYYY-MM-DD
                    else:
                        published_date = None
                    description = doc.get('description', {}).get('value', '') if isinstance(doc.get('description'), dict) else doc.get('description', '')
                    page_count = doc.get('number_of_pages_median', 0)
                    # Random genres for variety
                    possible_genres = ['Fantasy', 'Science Fiction', 'Adventure', 'Mystery', 'Romance', 'Horror', 'Thriller', 'Historical Fiction', 'Young Adult', 'Children\'s Literature']
                    num_genres = random.randint(1, 3)
                    genres = random.sample(possible_genres, num_genres)
                    
                    # Get ISBN
                    isbn = doc.get('isbn', [None])[0] if doc.get('isbn') else None
                    
                    # Get rating (Open Library uses user ratings)
                    average_rating = doc.get('ratings_average')
                    ratings_count = doc.get('ratings_count', 0)
                    
                    # Skip if not popular enough
                    if average_rating and (average_rating < 3.0 or ratings_count < 5):
                        continue
                    
                    # Skip if no title or already exists
                    if not title or Book.objects.filter(title=title).exists():
                        continue
                    
                    # Create or get publisher
                    publisher, _ = Publisher.objects.get_or_create(
                        name=publisher_name,
                        defaults={'website': ''}
                    )
                    
                    # Create book
                    book = Book.objects.create(
                        title=title,
                        description=description[:500] if description else '',
                        isbn=isbn,
                        page_count=page_count,
                        publication_date=published_date,
                        publisher=publisher,
                        average_rating=average_rating if average_rating else None
                    )
                    
                    # Add genres
                    for genre_name in genres:
                        if genre_name:  # Skip empty
                            genre, _ = Genre.objects.get_or_create(name=genre_name)
                            book.genres.add(genre)
                    
                    # Store cover URL from Open Library (no download needed)
                    cover_id = doc.get('cover_i')
                    if cover_id:
                        # Use Open Library's CDN for cover images - no storage needed
                        book.cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"
                        book.save()
                        self.stdout.write(f'Set cover URL for: {title}')
                    
                    # Create authors
                    for author_name in authors:
                        author, _ = Author.objects.get_or_create(
                            name=author_name,
                            defaults={'bio': '', 'birth_date': None, 'death_date': None}
                        )
                        book.authors.add(author)
                    
                    books_created += 1
                    self.stdout.write(f'Created book: {title}')
                    
            except requests.RequestException as e:
                self.stdout.write(self.style.ERROR(f'Error fetching data for query "{query}": {e}'))
                continue
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {books_created} popular fantasy books from Open Library API'))