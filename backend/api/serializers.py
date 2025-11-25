from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Author, Publisher, Book, Review, List, Follow, Tag, BookTag, ReviewTag, Activity, Profile, DiaryEntry

class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = '__all__'

class PublisherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publisher
        fields = '__all__'

class BookSerializer(serializers.ModelSerializer):
    authors = AuthorSerializer(many=True, read_only=True)
    publisher = PublisherSerializer(read_only=True)
    avg_rating = serializers.SerializerMethodField()
    cover_url = serializers.SerializerMethodField()

    def get_avg_rating(self, obj):
        return obj.average_rating

    def get_cover_url(self, obj):
        if obj.cover:
            return obj.cover.url
        return None

    class Meta:
        model = Book
        fields = ['id', 'title', 'description', 'isbn', 'genre', 'page_count', 'publication_date', 'publisher', 'authors', 'average_rating', 'avg_rating', 'cover_url']

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    book = BookSerializer(read_only=True)
    book_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Review
        fields = ('id', 'user', 'book', 'book_id', 'rating', 'text', 'created_at')

class ListSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    books = BookSerializer(many=True, read_only=True)

    class Meta:
        model = List
        fields = '__all__'

class FollowSerializer(serializers.ModelSerializer):
    follower = serializers.StringRelatedField(read_only=True)
    followed = serializers.StringRelatedField(read_only=True)
    followed_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Follow
        fields = ('id', 'follower', 'followed', 'followed_id', 'created_at')

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'

class BookTagSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    tag = TagSerializer(read_only=True)
    book_id = serializers.IntegerField(write_only=True)
    tag_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = BookTag
        fields = ('id', 'book', 'tag', 'book_id', 'tag_id')

class ReviewTagSerializer(serializers.ModelSerializer):
    review = ReviewSerializer(read_only=True)
    tag = TagSerializer(read_only=True)
    review_id = serializers.IntegerField(write_only=True)
    tag_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ReviewTag
        fields = ('id', 'review', 'tag', 'review_id', 'tag_id')

class ActivitySerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    book = BookSerializer(read_only=True)
    target_user = serializers.StringRelatedField(read_only=True)
    book_id = serializers.IntegerField(write_only=True, required=False)
    target_user_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Activity
        fields = ('id', 'user', 'action', 'book', 'target_user', 'book_id', 'target_user_id', 'created_at')

class DiaryEntrySerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    book = BookSerializer(read_only=True)
    book_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = DiaryEntry
        fields = ('id', 'user', 'book', 'book_id', 'status', 'read_date')

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['role', 'is_verified']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'profile')