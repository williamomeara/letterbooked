from django.core.management.base import BaseCommand
from faker import Faker
from api.models import Author, Publisher, Book
import random

class Command(BaseCommand):
    help = 'Populate the database with fake books, authors, and publishers using Faker'

    def handle(self, *args, **options):
        fake = Faker()

        # Create authors
        authors = []
        for _ in range(10):
            author = Author.objects.create(
                name=fake.name(),
                bio=fake.text(),
                birth_date=fake.date_of_birth(minimum_age=20, maximum_age=80),
            )
            authors.append(author)
        self.stdout.write('Created 10 authors')

        # Create publishers
        publishers = []
        for _ in range(5):
            publisher = Publisher.objects.create(
                name=fake.company(),
                website=fake.url(),
            )
            publishers.append(publisher)
        self.stdout.write('Created 5 publishers')

        # Create books
        books = []
        for _ in range(20):
            book = Book.objects.create(
                title=fake.sentence(nb_words=4),
                publisher=random.choice(publishers),
                isbn=fake.isbn13(),
                publication_date=fake.date_this_century(),
                genre=random.choice(['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi']),
                description=fake.text(),
                page_count=random.randint(100, 1000),
            )
            book.authors.set(random.sample(authors, random.randint(1, 3)))
            books.append(book)
        self.stdout.write('Created 20 books')

        self.stdout.write('Database populated with books, authors, and publishers successfully!')