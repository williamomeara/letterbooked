from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Master command to populate the database with different data sources'

    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            type=str,
            choices=['fake', 'openlibrary', 'google'],
            default='fake',
            help='Data source: fake (default), openlibrary, or google'
        )
        parser.add_argument(
            '--with-users',
            action='store_true',
            help='Also create users and reviews after populating books'
        )

    def handle(self, *args, **options):
        source = options['source']
        with_users = options['with_users']

        self.stdout.write(self.style.SUCCESS(f'Populating database from source: {source}'))

        if source == 'fake':
            self.stdout.write('Creating fake books, authors, and publishers...')
            call_command('populate_db')

        elif source == 'openlibrary':
            self.stdout.write('Fetching real books from OpenLibrary API...')
            call_command('populate_from_openlibrary')

        elif source == 'google':
            self.stdout.write('Fetching real books from Google Books API...')
            call_command('populate_from_api')

        if with_users:
            self.stdout.write('Creating users and reviews...')
            call_command('populate_users_reviews')

        self.stdout.write(self.style.SUCCESS('Database population complete!'))

        # Print summary
        from api.models import Book, Author, Publisher, Review
        from django.contrib.auth.models import User

        book_count = Book.objects.count()
        author_count = Author.objects.count()
        publisher_count = Publisher.objects.count()
        user_count = User.objects.count()
        review_count = Review.objects.count()

        self.stdout.write(self.style.SUCCESS('\nSummary:'))
        self.stdout.write(f'  Books: {book_count}')
        self.stdout.write(f'  Authors: {author_count}')
        self.stdout.write(f'  Publishers: {publisher_count}')
        self.stdout.write(f'  Users: {user_count}')
        self.stdout.write(f'  Reviews: {review_count}')