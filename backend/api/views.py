from rest_framework import viewsets, status, permissions, pagination
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework import serializers
from django.db.models import Avg, Count, Exists, OuterRef
from django.utils import timezone
from .models import Author, Book, Review, Profile, DiaryEntry, ReviewLike
from .serializers import (
    AuthorSerializer, BookSerializer, ReviewSerializer,
    ProfileSerializer, UserSerializer, DiaryEntrySerializer, ReviewLikeSerializer
)

# Custom permission classes
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'admin'

class IsVerifiedAuthor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'author' and request.user.profile.is_verified

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        # Write permissions are only allowed to the owner of the review
        return obj.user == request.user

class ReviewPagination(pagination.PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'profile')

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = User.objects.create_user(
            username=serializer.validated_data['username'],
            email=serializer.validated_data['email'],
            password=request.data['password']
        )
        Profile.objects.create(user=user)  # Create default profile
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AuthorViewSet(viewsets.ModelViewSet):
    queryset = Author.objects.all()
    serializer_class = AuthorSerializer
    permission_classes = [IsAuthenticated]  # Allow authenticated users to read

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]  # Only admins can modify
        return super().get_permissions()

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Use select_related() for ForeignKey relationships (publisher)
        # Use prefetch_related() for ManyToMany and reverse relations (authors, reviews)
        queryset = Book.objects.select_related('publisher').prefetch_related('authors', 'reviews')
        
        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            queryset = queryset.order_by(ordering)
        
        limit = self.request.query_params.get('limit', None)
        if limit:
            queryset = queryset[:int(limit)]
        
        return queryset

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin() | IsVerifiedAuthor()]
        return super().get_permissions()

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        # Optimize queries: select_related for ForeignKeys, prefetch_related for reverse relations
        queryset = Review.objects.select_related('user', 'book').prefetch_related('likes').annotate(likes_count=Count('likes'))

        # Annotate whether current user has liked each review to avoid N+1 queries
        user = self.request.user
        if user.is_authenticated:
            queryset = queryset.annotate(
                is_liked_by_user=Exists(
                    ReviewLike.objects.filter(
                        review=OuterRef('pk'),
                        user=user
                    )
                )
            )

        user_param = self.request.query_params.get('user', None)
        if user_param:
            if user_param == 'me':
                queryset = queryset.filter(user=self.request.user)
            else:
                queryset = queryset.filter(user__username=user_param)

        book_param = self.request.query_params.get('book', None)
        if book_param:
            queryset = queryset.filter(book_id=book_param)
            # Default ordering for book reviews: most liked first
            queryset = queryset.order_by('-likes_count', '-created_at')

        ordering = self.request.query_params.get('ordering', None)
        if ordering:
            queryset = queryset.order_by(ordering)

        limit = self.request.query_params.get('limit', None)
        if limit:
            queryset = queryset[:int(limit)]

        return queryset

    def get_paginated_response(self, data):
        # Disable pagination for user reviews (user=me) to get all reviews
        user_param = self.request.query_params.get('user', None)
        if user_param == 'me':
            return Response(data)
        return super().get_paginated_response(data)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ReviewLikeViewSet(viewsets.ModelViewSet):
    queryset = ReviewLike.objects.all()
    serializer_class = ReviewLikeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReviewLike.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DiaryEntryViewSet(viewsets.ModelViewSet):
    queryset = DiaryEntry.objects.all()
    serializer_class = DiaryEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DiaryEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        # Auto-set read_date when creating with status 'read'
        if instance.status == 'read' and (instance.read_date is None or instance.read_date == ''):
            instance.read_date = timezone.now().date()
            instance.save()

    def perform_update(self, serializer):
        instance = serializer.save()
        # Auto-set read_date when status changes to 'read'
        if instance.status == 'read' and (instance.read_date is None or instance.read_date == ''):
            instance.read_date = timezone.now().date()
            instance.save()

    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_stats(request):
    user = request.user
    reviews = Review.objects.filter(user=user)
    total_reviews = reviews.count()
    avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
    books_reviewed = reviews.values('book').distinct().count()
    likes_received = ReviewLike.objects.filter(review__user=user).count()

    return Response({
        'total_reviews': total_reviews,
        'avg_rating': round(avg_rating, 1) if avg_rating else 0,
        'books_reviewed': books_reviewed,
        'likes_received': likes_received,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_activity(request):
    user = request.user
    # Get recent activities: likes on user's reviews, user's new reviews, etc.
    activities = []

    # Recent likes on user's reviews
    recent_likes = ReviewLike.objects.filter(review__user=user).order_by('-created_at')[:10]
    for like in recent_likes:
        activities.append({
            'id': f'like_{like.id}',
            'description': f'{like.user.username} liked your review of "{like.review.book.title}"',
            'created_at': like.created_at,
        })

    # Recent reviews by user
    recent_reviews = Review.objects.filter(user=user).order_by('-created_at')[:5]
    for review in recent_reviews:
        activities.append({
            'id': f'review_{review.id}',
            'description': f'You reviewed "{review.book.title}"',
            'created_at': review.created_at,
        })

    # Sort by created_at descending
    activities.sort(key=lambda x: x['created_at'], reverse=True)
    activities = activities[:10]  # Limit to 10 most recent

    return Response(activities)
