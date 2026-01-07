from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from typing import Dict, Any

class FileMetadata:
    """
    MongoDB model for storing file upload metadata
    """
    
    def __init__(self):
        self.collection = None
        try:
            # MongoDB connection using docker-compose credentials
            client = MongoClient(
                "mongodb://siem_admin:siem_password@localhost:27017/",
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000
            )
            # Test connection
            client.admin.command('ping')
            
            self.db = client["siem_db"]
            self.collection = self.db["file_uploads"]
            print("✅ MongoDB connected successfully")
        except Exception as e:
            print(f"❌ MongoDB connection error: {e}")
            self.collection = None
    
    def save_upload(self, filename: str, size: int, log_count: int, 
                   status: str = "processed", user_id: str = "system") -> Dict[str, Any]:
        """
        Save file upload metadata to MongoDB
        """
        # Check if collection exists (not using truth value)
        if self.collection is None:
            print("MongoDB not connected, returning error")
            return {"_id": "error", "error": "MongoDB unavailable"}
        
        doc = {
            "filename": filename,
            "filesize_bytes": size,
            "log_count": log_count,
            "status": status,
            "upload_date": datetime.utcnow(),
            "user_id": user_id
        }
        
        try:
            result = self.collection.insert_one(doc)
            doc["_id"] = str(result.inserted_id)
            print(f"✅ Saved to MongoDB: {filename}")
            return doc
        except Exception as e:
            print(f"❌ Error saving to MongoDB: {e}")
            return {"_id": "error", "error": str(e)}
    
    def get_upload_history(self, limit: int = 50, user_id: str = None) -> list:
        """
        Get recent upload history
        """
        # Check if collection exists
        if self.collection is None:
            print("MongoDB not connected for history")
            return []
        
        try:
            query = {} if user_id is None else {"user_id": user_id}
            
            uploads = list(
                self.collection.find(query)
                .sort("upload_date", -1)
                .limit(limit)
            )
            
            # Convert ObjectId and datetime to strings for JSON serialization
            for upload in uploads:
                upload["_id"] = str(upload["_id"])
                if "upload_date" in upload:
                    upload["upload_date"] = upload["upload_date"].isoformat()
            
            print(f"✅ Retrieved {len(uploads)} uploads from MongoDB")
            return uploads
        except Exception as e:
            print(f"❌ Error fetching history: {e}")
            return []
    
    def update_upload_status(self, upload_id: str, log_count: int, status: str = "processed") -> bool:
        """
        Update upload status after Logstash processing
        """
        if self.collection is None:
            return False
        
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(upload_id)},
                {"$set": {
                    "log_count": log_count,
                    "status": status,
                    "processed_date": datetime.utcnow()
                }}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating status: {e}")
            return False
