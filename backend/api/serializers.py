from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Author, Publisher, Book, Review, List, Follow, Tag, BookTag, ReviewTag, Activity, Profile, DiaryEntry, ReviewLike

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
    reviews_count = serializers.SerializerMethodField()

    def get_avg_rating(self, obj):
        return obj.average_rating

    def get_cover_url(self, obj):
        return obj.cover_url

    def get_reviews_count(self, obj):
        return obj.reviews.count()

    class Meta:
        model = Book
        fields = ['id', 'title', 'description', 'isbn', 'genre', 'page_count', 'publication_date', 'publisher', 'authors', 'average_rating', 'avg_rating', 'cover_url', 'reviews_count']

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    user_id = serializers.SerializerMethodField()
    book = BookSerializer(read_only=True)
    book_id = serializers.IntegerField(write_only=True)
    likes_count = serializers.SerializerMethodField()
    is_liked_by_user = serializers.SerializerMethodField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.query_params.get('include_book') != 'true':
            # Remove book field unless explicitly requested
            self.fields.pop('book', None)

    def get_user_id(self, obj):
        return obj.user.id

    def get_likes_count(self, obj):
        return getattr(obj, 'likes_count', obj.likes.count())

    def get_is_liked_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

    class Meta:
        model = Review
        fields = ('id', 'user', 'user_id', 'book', 'book_id', 'rating', 'text', 'created_at', 'likes_count', 'is_liked_by_user')

class ReviewLikeSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    review = ReviewSerializer(read_only=True)
    review_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ReviewLike
        fields = ('id', 'user', 'review', 'review_id', 'created_at')

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

    def validate_read_date(self, value):
        if value == '' or value is None or value == 'null':
            return None
        # Convert string date to date object if needed
        if isinstance(value, str):
            from datetime import datetime
            try:
                parsed_date = datetime.strptime(value, '%Y-%m-%d').date()
                return parsed_date
            except ValueError as e:
                raise serializers.ValidationError("Invalid date format")
        return value

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)

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