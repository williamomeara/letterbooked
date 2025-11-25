import os
import random
import string
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db.models import Avg
from api.models import Book, Review, ReviewLike

class Command(BaseCommand):
    help = 'Populate the database with random users and reviews'

    def handle(self, *args, **options):
        self.stdout.write('Creating random users...')
        
        # Create 100 random users
        users_created = 0
        for i in range(100):
            username = f'user_{i+1}'
            email = f'user{i+1}@example.com'
            password = 'password123'
            
            if not User.objects.filter(username=username).exists():
                User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=f'First{i+1}',
                    last_name=f'Last{i+1}'
                )
                users_created += 1
        
        self.stdout.write(self.style.SUCCESS(f'Created {users_created} users.'))

        # Get all books and users
        books = list(Book.objects.all())
        users = list(User.objects.all())
        
        if not books:
            self.stdout.write(self.style.WARNING('No books found. Please populate books first.'))
            return
        
        if not users:
            self.stdout.write(self.style.WARNING('No users found.'))
            return

        self.stdout.write('Creating random reviews...')
        
        reviews_created = 0
        # For each book, create 0-5 random reviews
        for book in books:
            num_reviews = random.randint(0, 20)
            selected_users = random.sample(users, min(num_reviews, len(users)))
            
            for user in selected_users:
                # Skip if review already exists
                if Review.objects.filter(user=user, book=book).exists():
                    continue
                
                # Random rating 1.0 to 5.0 in 0.5 increments
                rating = round(random.uniform(1.0, 5.0) * 2) / 2
                
                # 70% chance of having review text, 30% blank
                has_text = random.random() < 0.7
                text = ''
                if has_text:
                    # Generate random review text
                    adjectives = ['amazing', 'great', 'terrible', 'boring', 'exciting', 'wonderful', 'disappointing', 'brilliant', 'awful', 'fantastic']
                    nouns = ['story', 'plot', 'characters', 'writing', 'ending', 'beginning', 'middle', 'world-building', 'themes', 'pace']
                    verbs = ['loved', 'hated', 'enjoyed', 'disliked', 'appreciated', 'found', 'thought', 'felt', 'considered', 'believed']
                    
                    adj = random.choice(adjectives)
                    noun = random.choice(nouns)
                    verb = random.choice(verbs)
                    
                    text = f"I {verb} this book. The {noun} was {adj}."
                    
                    # Sometimes add more sentences
                    if random.random() < 0.5:
                        text += f" The {random.choice(nouns)} really stood out to me."
                    
                    # Sometimes make it longer
                    if random.random() < 0.3:
                        text += f" Overall, I would {random.choice(['recommend', 'not recommend', 'suggest', 'avoid'])} this book."
                
                # 10% chance of being marked as spoiler
                is_spoiler = random.random() < 0.1
                
                Review.objects.create(
                    user=user,
                    book=book,
                    rating=rating,
                    text=text,
                    is_spoiler=is_spoiler
                )
                reviews_created += 1
        
        self.stdout.write(self.style.SUCCESS(f'Created {reviews_created} reviews.'))
        
        # Create random likes on reviews
        self.stdout.write('Creating random likes on reviews...')
        
        reviews = list(Review.objects.all())
        likes_created = 0
        
        for review in reviews:
            # Each review gets 0-10 random likes
            num_likes = random.randint(0, 10)
            # Get users who haven't already liked this review and aren't the review author
            available_users = [user for user in users if user != review.user and not ReviewLike.objects.filter(user=user, review=review).exists()]
            
            if available_users:
                selected_users = random.sample(available_users, min(num_likes, len(available_users)))
                
                for user in selected_users:
                    ReviewLike.objects.create(
                        user=user,
                        review=review
                    )
                    likes_created += 1
        
        self.stdout.write(self.style.SUCCESS(f'Created {likes_created} review likes.'))
        
        # Update average ratings for books
        self.stdout.write('Updating average ratings...')
        for book in books:
            avg_rating = book.reviews.aggregate(Avg('rating'))['rating__avg']
            if avg_rating is not None:
                book.average_rating = round(avg_rating, 1)
                book.save()
        
        self.stdout.write(self.style.SUCCESS('Average ratings updated.'))