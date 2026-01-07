import redis
from datetime import timedelta
import json

class CacheManager:
    """
    Redis caching layer for frequently accessed data
    Reduces load on Elasticsearch and MongoDB
    """
    
    def __init__(self, host='localhost', port=6379, db=0):
        try:
            self.redis = redis.Redis(
                host=host,
                port=port,
                db=db,
                decode_responses=True,
                socket_connect_timeout=5
            )
            # Test connection
            self.redis.ping()
            print("✅ Redis connected successfully")
        except Exception as e:
            print(f"❌ Redis connection error: {e}")
            self.redis = None
    
    def set_cache(self, key: str, value: dict, ttl: int = 300):
        """
        Cache data with TTL (Time To Live)
        Default: 5 minutes (300 seconds)
        """
        if self.redis is None:
            return False
        
        try:
            # Convert dict to JSON string
            json_value = json.dumps(value)
            self.redis.setex(key, ttl, json_value)
            return True
        except Exception as e:
            print(f"Error caching {key}: {e}")
            return False
    
    def get_cache(self, key: str):
        """
        Retrieve cached data
        Returns dict or None if not found
        """
        if self.redis is None:
            return None
        
        try:
            value = self.redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            print(f"Error retrieving cache {key}: {e}")
            return None
    
    def delete_cache(self, key: str):
        """
        Delete cached data
        """
        if self.redis is None:
            return False
        
        try:
            self.redis.delete(key)
            return True
        except Exception as e:
            print(f"Error deleting cache {key}: {e}")
            return False
    
    def flush_all(self):
        """
        Clear all cache (use with caution)
        """
        if self.redis is None:
            return False
        
        try:
            self.redis.flushdb()
            return True
        except Exception as e:
            print(f"Error flushing cache: {e}")
            return False
    
    def cache_stats(self, key: str):
        """
        Get info about a cached key
        """
        if self.redis is None:
            return None
        
        try:
            ttl = self.redis.ttl(key)
            size = self.redis.memory_usage(key)
            return {"ttl": ttl, "size": size}
        except Exception as e:
            print(f"Error getting cache stats: {e}")
            return None
