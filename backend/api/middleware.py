import logging
import time
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('api.requests')


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log API requests for monitoring and debugging.
    Logs request method, path, user, response time, and status code.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Start timing
        start_time = time.time()

        # Log incoming request
        user_info = request.user.username if request.user.is_authenticated else 'Anonymous'
        logger.info(f"→ {request.method} {request.path} | User: {user_info} | IP: {self.get_client_ip(request)}")

        # Process the request
        response = self.get_response(request)

        # Calculate response time
        duration = time.time() - start_time

        # Log response
        logger.info(f"← {request.method} {request.path} | Status: {response.status_code} | Time: {duration:.3f}s")

        return response

    def get_client_ip(self, request):
        """Get the client IP address from the request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip