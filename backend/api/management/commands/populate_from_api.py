import os
import requests
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from api.models import Author, Publisher, Book

class Command(BaseCommand):
    help = 'Populate the database with books from Google Books API'

    def handle(self, *args, **options):
        self.stdout.write('Clearing existing book data...')
        Book.objects.all().delete()
        Author.objects.all().delete()
        Publisher.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('Existing data cleared.'))

        api_key = os.getenv('GOOGLE_API_KEY')
        base_url = 'https://www.googleapis.com/books/v1/volumes'
        
        # Search queries to get diverse books
        queries = ['fiction', 'non-fiction', 'science fiction', 'biography', 'history', 'fantasy', 'mystery', 'romance']
        books_created = 0
        max_books = 100
        
        for query in queries:
            if books_created >= max_books:
                break
                
            params = {
                'q': query,
                'maxResults': 40,  # API max is 40 per request
                'key': api_key
            }
            
            try:
                response = requests.get(base_url, params=params)
                response.raise_for_status()
                data = response.json()
                
                for item in data.get('items', []):
                    if books_created >= max_books:
                        break
                        
                    volume_info = item.get('volumeInfo', {})
                    
                    # Extract book data
                    title = volume_info.get('title', '')
                    authors = volume_info.get('authors', [])
                    publisher_name = volume_info.get('publisher', 'Unknown Publisher')
                    published_date = volume_info.get('publishedDate', '')
                    
                    # Normalize published_date to YYYY-MM-DD format
                    if published_date:
                        if len(published_date) == 4:  # Year only
                            published_date = f"{published_date}-01-01"
                        elif len(published_date) == 7:  # Year-Month
                            published_date = f"{published_date}-01"
                        elif len(published_date) == 10:  # Already YYYY-MM-DD
                            pass
                        else:
                            published_date = None  # Invalid format
                    else:
                        published_date = None
                    description = volume_info.get('description', '')
                    page_count = volume_info.get('pageCount', 0)
                    categories = volume_info.get('categories', [])
                    genre = categories[0] if categories else 'Unknown'
                    
                    # Get ISBN
                    isbn = None
                    for identifier in volume_info.get('industryIdentifiers', []):
                        if identifier.get('type') == 'ISBN_13':
                            isbn = identifier.get('identifier')
                            break
                        elif identifier.get('type') == 'ISBN_10' and not isbn:
                            isbn = identifier.get('identifier')
                    
                    # Get rating
                    average_rating = volume_info.get('averageRating')
                    ratings_count = volume_info.get('ratingsCount', 0)
                    
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
                        description=description[:500] if description else '',  # Truncate if too long
                        isbn=isbn,
                        genre=genre,
                        page_count=page_count,
                        publication_date=published_date,
                        publisher=publisher,
                        average_rating=average_rating if average_rating else None
                    )
                    
                    # Download cover image
                    image_links = volume_info.get('imageLinks', {})
                    cover_url = None
                    # Prefer larger image sizes
                    for size in ['extraLarge', 'large', 'medium', 'thumbnail']:
                        if image_links.get(size):
                            cover_url = image_links[size]
                            break
                    if cover_url:
                        try:
                            img_response = requests.get(cover_url)
                            img_response.raise_for_status()
                            # Create a safe filename from title
                            import re
                            safe_title = re.sub(r'[^\w\-_\. ]', '', title)[:50].strip().replace(' ', '_')
                            filename = f"{safe_title}.jpg"
                            book.cover.save(filename, ContentFile(img_response.content), save=True)
                            self.stdout.write(f'Saved cover for: {title}')
                        except requests.RequestException as e:
                            self.stdout.write(f'Failed to download cover for: {title} - {e}')
                    
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
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {books_created} books from Google Books API'))