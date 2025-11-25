from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework import serializers
from django.db.models import Avg
from .models import Author, Publisher, Book, Review, List, Follow, Tag, BookTag, ReviewTag, Activity, Profile, DiaryEntry
from .serializers import (
    AuthorSerializer, PublisherSerializer, BookSerializer, ReviewSerializer,
    ListSerializer, FollowSerializer, TagSerializer, BookTagSerializer,
    ReviewTagSerializer, ActivitySerializer, ProfileSerializer, UserSerializer, DiaryEntrySerializer
)

# Custom permission classes
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'admin'

class IsVerifiedAuthor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.role == 'author' and request.user.profile.is_verified

class IsUserOrHigher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile')

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

class PublisherViewSet(viewsets.ModelViewSet):
    queryset = Publisher.objects.all()
    serializer_class = PublisherSerializer
    permission_classes = [IsAuthenticated]  # Allow authenticated users to read

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]  # Only admins can modify
        return super().get_permissions()

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin() | IsVerifiedAuthor()]
        return super().get_permissions()

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ListViewSet(viewsets.ModelViewSet):
    queryset = List.objects.all()
    serializer_class = ListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return List.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class FollowViewSet(viewsets.ModelViewSet):
    queryset = Follow.objects.all()
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Follow.objects.filter(follower=self.request.user)

    def perform_create(self, serializer):
        serializer.save(follower=self.request.user)

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class BookTagViewSet(viewsets.ModelViewSet):
    queryset = BookTag.objects.all()
    serializer_class = BookTagSerializer

class ReviewTagViewSet(viewsets.ModelViewSet):
    queryset = ReviewTag.objects.all()
    serializer_class = ReviewTagSerializer

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class DiaryEntryViewSet(viewsets.ModelViewSet):
    queryset = DiaryEntry.objects.all()
    serializer_class = DiaryEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DiaryEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        diary_entry, created = DiaryEntry.objects.get_or_create(
            user=self.request.user,
            book_id=serializer.validated_data['book_id'],
            defaults=serializer.validated_data
        )
        if not created:
            for key, value in serializer.validated_data.items():
                setattr(diary_entry, key, value)
            diary_entry.save()
