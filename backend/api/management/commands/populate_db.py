from django.core.management.base import BaseCommand
from faker import Faker
from api.models import Author, Publisher, Book, Review, Profile
from django.contrib.auth.models import User
import random

class Command(BaseCommand):
    help = 'Populate the database with random books, authors, and reviews'

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

        # Get users with profiles
        users = []
        for profile in Profile.objects.all():
            users.append(profile.user)

        if not users:
            self.stdout.write('No users found. Create some users first.')
            return

        # Create reviews
        review_count = 0
        max_attempts = 100  # Prevent infinite loop
        attempts = 0
        while review_count < 50 and attempts < max_attempts:
            user = random.choice(users)
            book = random.choice(books)
            if not Review.objects.filter(user=user, book=book).exists():
                Review.objects.create(
                    user=user,
                    book=book,
                    rating=random.randint(1, 5),
                    text=fake.text(),
                )
                review_count += 1
            attempts += 1
        self.stdout.write(f'Created {review_count} reviews')

        # Create diary entries
        from api.models import DiaryEntry
        diary_count = 0
        max_attempts = 200  # Prevent infinite loop
        attempts = 0
        while diary_count < 100 and attempts < max_attempts:
            user = random.choice(users)
            book = random.choice(books)
            if not DiaryEntry.objects.filter(user=user, book=book).exists():
                status = random.choice(['to-read', 'reading', 'read'])
                DiaryEntry.objects.create(
                    user=user,
                    book=book,
                    status=status,
                    read_date=fake.date_this_year() if status == 'read' else None,
                )
                diary_count += 1
            attempts += 1
        self.stdout.write(f'Created {diary_count} diary entries')

        self.stdout.write('Database populated successfully!')