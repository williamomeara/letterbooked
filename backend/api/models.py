from django.db import models
from django.contrib.auth.models import User
from django.db.models import Avg

class Author(models.Model):
    name = models.CharField(max_length=255, unique=True)
    bio = models.TextField(blank=True)
    birth_date = models.DateField(null=True, blank=True)
    death_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.name

class Publisher(models.Model):
    name = models.CharField(max_length=255, unique=True)
    website = models.URLField(blank=True)

    def __str__(self):
        return self.name

class Genre(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Book(models.Model):
    title = models.CharField(max_length=255)
    # TODO: decide whether to change authors to author which is a ForeignKey to Author
    authors = models.ManyToManyField(Author, related_name='books')
    publisher = models.ForeignKey(Publisher, on_delete=models.SET_NULL, null=True, blank=True)
    isbn = models.CharField(max_length=13, unique=True, blank=True, null=True)
    publication_date = models.DateField(null=True, blank=True)
    genres = models.ManyToManyField(Genre, related_name='books', blank=True)
    description = models.TextField(blank=True)
    cover = models.ImageField(upload_to='covers/', blank=True, null=True)
    cover_url = models.URLField(blank=True, null=True)  # CDN URL for book covers
    page_count = models.PositiveIntegerField(null=True, blank=True)
    average_rating = models.FloatField(null=True, blank=True, default=None)  # Cached average rating

    def __str__(self):
        return self.title

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reviews')
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=5.0)  # Allow half stars
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_spoiler = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'book')

    def __str__(self):
        return f"{self.user.username}'s review of {self.book.title}"

class ReviewLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='review_likes')
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'review')

    def __str__(self):
        return f"{self.user.username} liked {self.review.user.username}'s review"

class List(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lists')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    books = models.ManyToManyField(Book, related_name='lists', blank=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s list: {self.name}"

class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    followed = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'followed')

    def __str__(self):
        return f"{self.follower.username} follows {self.followed.username}"

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class BookTag(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('book', 'tag')

class ReviewTag(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('review', 'tag')

class Activity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=255)  # e.g., 'reviewed', 'added_to_list', 'followed'
    book = models.ForeignKey(Book, on_delete=models.CASCADE, null=True, blank=True)
    target_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='activity_targets')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} {self.action}"

class Profile(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('author', 'Author'),
        ('admin', 'Admin'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    is_verified = models.BooleanField(default=False)  # For authors only

    def __str__(self):
        return f"{self.user.username} - {self.role}"

class DiaryEntry(models.Model):
    STATUS_CHOICES = [
        ('to-read', 'To Read'),
        ('reading', 'Reading'),
        ('read', 'Read'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='diary_entries')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='diary_entries')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='to-read')
    read_date = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'book')  # One entry per user-book

    def __str__(self):
        return f"{self.user.username}'s diary: {self.book.title} ({self.status})"

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver([post_save, post_delete], sender=Review)
def update_book_average_rating(sender, instance, **kwargs):
    book = instance.book
    avg = book.reviews.aggregate(Avg('rating'))['rating__avg']
    book.average_rating = avg
    book.save(update_fields=['average_rating'])
