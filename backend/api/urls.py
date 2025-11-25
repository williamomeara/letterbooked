from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'authors', views.AuthorViewSet)
router.register(r'publishers', views.PublisherViewSet)
router.register(r'books', views.BookViewSet)
router.register(r'reviews', views.ReviewViewSet)
router.register(r'lists', views.ListViewSet)
router.register(r'follows', views.FollowViewSet)
router.register(r'tags', views.TagViewSet)
router.register(r'book-tags', views.BookTagViewSet)
router.register(r'review-tags', views.ReviewTagViewSet)
router.register(r'activities', views.ActivityViewSet)
router.register(r'diary-entries', views.DiaryEntryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.register_user, name='register'),
]