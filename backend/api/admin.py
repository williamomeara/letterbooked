from django.contrib import admin
from .models import Author, Publisher, Book, Review, List, Follow, Tag, BookTag, ReviewTag, Activity, Profile, DiaryEntry

@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ('name', 'birth_date', 'death_date')
    search_fields = ('name',)

@admin.register(Publisher)
class PublisherAdmin(admin.ModelAdmin):
    list_display = ('name', 'website')
    search_fields = ('name',)

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'isbn', 'publication_date')
    search_fields = ('title', 'isbn')
    filter_horizontal = ('authors',)

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'book', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')

@admin.register(List)
class ListAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'is_public', 'created_at')
    filter_horizontal = ('books',)

@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ('follower', 'followed', 'created_at')

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(BookTag)
class BookTagAdmin(admin.ModelAdmin):
    list_display = ('book', 'tag')

@admin.register(ReviewTag)
class ReviewTagAdmin(admin.ModelAdmin):
    list_display = ('review', 'tag')

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'created_at')

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'is_verified')
    list_filter = ('role', 'is_verified')

@admin.register(DiaryEntry)
class DiaryEntryAdmin(admin.ModelAdmin):
    list_display = ('user', 'book', 'status', 'read_date')
    list_filter = ('status', 'read_date')
