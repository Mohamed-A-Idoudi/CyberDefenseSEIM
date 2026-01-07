from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from werkzeug.utils import secure_filename
from elasticsearch import Elasticsearch
from models.cache import CacheManager
from severity_mapping import get_severity
from datetime import datetime, timezone
import os



UPLOAD_FOLDER = '/home/bigdata/CyberDefenseSEIM/infra/logstash/input'
ALLOWED_EXTENSIONS = {'csv', 'json'}



def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS



# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# Initialize Elasticsearch
es = Elasticsearch(['http://localhost:9200'])


# Initialize Redis Cache
cache = CacheManager()



# ==================== BASIC ENDPOINTS ====================


@app.route('/')
def home():
    """Home page"""
    return jsonify({"message": "CyberDefense SIEM API v1.0"})



@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200



# ==================== FILE UPLOAD ENDPOINTS ====================


@app.route('/api/logs/upload', methods=['POST'])
def upload_log():
    """
    US-LOG-1: Upload CSV/JSON file -> Logstash -> MongoDB metadata
    """
    from models.file_metadata import FileMetadata
    
    # Check file is present
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400


    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400


    # Validate file type
    if not (file and allowed_file(file.filename)):
        return jsonify({"error": "Invalid file type. Allowed: csv, json"}), 400


    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Get file size before saving
        file_content = file.read()
        file_size = len(file_content)
        
        # Write file
        with open(filepath, 'wb') as f:
            f.write(file_content)
        
        # US-MONGO-2: Save metadata to MongoDB
        metadata = FileMetadata()
        upload_doc = metadata.save_upload(
            filename=filename,
            size=file_size,
            log_count=0,  # Will be updated after Logstash processes
            status="uploaded"
        )
        
        # Clear cache since new data was uploaded
        cache.delete_cache("latest_logs")
        cache.delete_cache("stats")
        cache.delete_cache("unique_ips")
        cache.delete_cache("unique_events")
        
        return jsonify({
            "status": "success",
            "filename": filename,
            "filepath": filepath,
            "filesize_bytes": file_size,
            "upload_id": str(upload_doc["_id"]),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/api/files/history', methods=['GET'])
def get_upload_history():
    """
    US-MONGO-3: Get upload history from MongoDB
    """
    from models.file_metadata import FileMetadata
    
    try:
        metadata = FileMetadata()
        history = metadata.get_upload_history(limit=50)
        
        return jsonify({
            "history": history,
            "count": len(history)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e), "history": []}), 500



# ==================== LOG SEARCH ENDPOINTS ====================


@app.route('/api/logs/latest', methods=['GET'])
def latest_logs():
    """
    US-REDIS-1: Get latest logs from cache or Elasticsearch
    Cache TTL: 30 seconds
    """
    # Check cache first
    cached = cache.get_cache("latest_logs")
    if cached:
        print("✅ Cache HIT for latest_logs")
        return jsonify({"logs": cached, "source": "cache"}), 200
    
    print("⏳ Cache MISS for latest_logs - fetching from ES")
    
    try:
        resp = es.search(
            index="siem-logs-*",
            size=50,
            sort=[{"@timestamp": {"order": "desc"}}]
        )
        logs = []
        for h in resp["hits"]["hits"]:
            src = h.get("_source", {})
            event = src.get("event", "")
            logs.append({
                "timestamp": src.get("timestamp"),
                "ip": src.get("ip"),
                "event": event,
                "severity": get_severity(event),
            })
        
        # Cache for 30 seconds
        cache.set_cache("latest_logs", logs, ttl=30)
        
        return jsonify({"logs": logs, "source": "elasticsearch"}), 200
        
    except Exception as e:
        print(f"Error fetching logs: {e}")
        # Return mock data if ES is down
        return jsonify({
            "logs": [],
            "error": "Elasticsearch unavailable",
            "fallback": True
        }), 200



@app.route('/api/logs/search', methods=['GET'])
def search_logs():
    """
    US-SEARCH-1 & US-SEARCH-2: Search logs with filters (IP, event type, date range)
    Query params:
    - ip: filter by IP address
    - event: filter by event type
    - start_date: filter by start date (ISO 8601)
    - end_date: filter by end date (ISO 8601)
    - page: pagination (default 1)
    """
    try:
        # Get query parameters from frontend
        ip_filter = request.args.get('ip', '').strip()
        event_filter = request.args.get('event', '').strip()
        start_date = request.args.get('start_date', '').strip()
        end_date = request.args.get('end_date', '').strip()
        page = int(request.args.get('page', 1))
        page = max(1, page)  # Ensure page >= 1
        
        print(f"🔍 Search filters - IP: {ip_filter}, Event: {event_filter}, Start: {start_date}, End: {end_date}, Page: {page}")
        
        # Build Elasticsearch query filters
        must_filters = []
        
        # Add IP filter
        if ip_filter:
            must_filters.append({"term": {"ip.keyword": ip_filter}})
        
        # Add event type filter
        if event_filter:
            must_filters.append({"term": {"event.keyword": event_filter}})
        
        # Add date range filter
        if start_date or end_date:
            date_range = {}
            if start_date:
                date_range["gte"] = start_date
            if end_date:
                date_range["lte"] = end_date
            
            if date_range:
                must_filters.append({
                    "range": {
                        "@timestamp": date_range
                    }
                })
        
        # Build final ES query
        if must_filters:
            es_query = {
                "bool": {
                    "must": must_filters
                }
            }
        else:
            es_query = {"match_all": {}}
        
        print(f"📋 ES Query: {es_query}")
        
        # Execute search with pagination
        from_value = (page - 1) * 50
        resp = es.search(
            index="siem-logs-*",
            query=es_query,
            size=50,
            from_=from_value,
            sort=[{"@timestamp": {"order": "desc"}}]
        )
        
        # Extract logs with proper severity
        logs = []
        total = resp["hits"]["total"]["value"]
        
        for h in resp["hits"]["hits"]:
            src = h.get("_source", {})
            event = src.get("event", "")
            logs.append({
                "timestamp": src.get("timestamp"),
                "ip": src.get("ip"),
                "event": event,
                "severity": get_severity(event),
            })
        
        # Calculate pagination
        total_pages = (total + 49) // 50  # Ceiling division
        
        print(f"✅ Found {total} logs, returning {len(logs)} on page {page}")
        
        return jsonify({
            "logs": logs,
            "total": total,
            "page": page,
            "per_page": 50,
            "total_pages": total_pages,
        }), 200
        
    except Exception as e:
        print(f"❌ Search error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": str(e),
            "logs": [],
            "total": 0,
            "page": 1
        }), 500



@app.route('/api/logs/unique-ips', methods=['GET'])
def get_unique_ips():
    """
    US-SEARCH-2: Get all unique IP addresses for dropdown
    """
    # Check cache first
    cached = cache.get_cache("unique_ips")
    if cached:
        print("✅ Cache HIT for unique_ips")
        return jsonify({"ips": cached}), 200
    
    print("⏳ Cache MISS for unique_ips - fetching from ES")
    
    try:
        resp = es.search(
            index="siem-logs-*",
            aggs={
                "unique_ips": {
                    "terms": {
                        "field": "ip.keyword",
                        "size": 1000
                    }
                }
            },
            size=0
        )
        
        ips = []
        for bucket in resp["aggregations"]["unique_ips"]["buckets"]:
            ips.append({
                "ip": bucket["key"],
                "count": bucket["doc_count"]
            })
        
        # Sort by count descending
        ips.sort(key=lambda x: x["count"], reverse=True)
        
        # Cache for 5 minutes
        cache.set_cache("unique_ips", ips, ttl=300)
        
        return jsonify({"ips": ips}), 200
        
    except Exception as e:
        print(f"Error fetching unique IPs: {e}")
        return jsonify({"ips": [], "error": str(e)}), 500



@app.route('/api/logs/unique-events', methods=['GET'])
def get_unique_events():
    """
    US-SEARCH-2: Get all unique event types for dropdown
    """
    # Check cache first
    cached = cache.get_cache("unique_events")
    if cached:
        print("✅ Cache HIT for unique_events")
        return jsonify({"events": cached}), 200
    
    print("⏳ Cache MISS for unique_events - fetching from ES")
    
    try:
        resp = es.search(
            index="siem-logs-*",
            aggs={
                "unique_events": {
                    "terms": {
                        "field": "event.keyword",
                        "size": 100
                    }
                }
            },
            size=0
        )
        
        events = []
        for bucket in resp["aggregations"]["unique_events"]["buckets"]:
            event_name = bucket["key"]
            events.append({
                "event": event_name,
                "count": bucket["doc_count"],
                "severity": get_severity(event_name),
            })
        
        # Sort by count descending
        events.sort(key=lambda x: x["count"], reverse=True)
        
        # Cache for 5 minutes
        cache.set_cache("unique_events", events, ttl=300)
        
        return jsonify({"events": events}), 200
        
    except Exception as e:
        print(f"Error fetching unique events: {e}")
        return jsonify({"events": [], "error": str(e)}), 500



@app.route('/api/logs/stats', methods=['GET'])
def get_stats():
    """
    US-REDIS-1: Get log statistics/KPIs from cache or ES
    Cache TTL: 60 seconds (stats don't need to be real-time)
    """
    # Check cache first
    cached = cache.get_cache("stats")
    if cached:
        print("✅ Cache HIT for stats")
        return jsonify({**cached, "source": "cache"}), 200
    
    print("⏳ Cache MISS for stats - fetching from ES")
    
    try:
        # Total logs
        all_logs = es.search(index="siem-logs-*", size=0)
        total_logs = all_logs["hits"]["total"]["value"]
        
        # Failed logins
        failed_response = es.search(
            index="siem-logs-*",
            query={"match": {"event": "login_failed"}},
            size=0
        )
        failed_count = failed_response["hits"]["total"]["value"]
        
        # Unique IPs
        unique_response = es.search(
            index="siem-logs-*",
            aggs={"unique_ips": {"cardinality": {"field": "ip.keyword"}}},
            size=0
        )
        unique_ip_count = unique_response["aggregations"]["unique_ips"]["value"]
        
        # Critical severity logs
        critical_response = es.search(
            index="siem-logs-*",
            query={
                "bool": {
                    "must": [
                        {"match": {"event": word}}
                        for word in ["brute_force_attack", "unauthorized_access", "privilege_escalation"]
                    ]
                }
            },
            size=0
        )
        critical_count = critical_response["hits"]["total"]["value"]
        
        stats = {
            "total_logs": total_logs,
            "failed_logins": failed_count,
            "unique_ips": unique_ip_count,
            "critical_events": critical_count,
            "logs_today": 0
        }
        
        # Cache for 60 seconds
        cache.set_cache("stats", stats, ttl=60)
        
        return jsonify({**stats, "source": "elasticsearch"}), 200
        
    except Exception as e:
        return jsonify({
            "total_logs": 0,
            "failed_logins": 0,
            "unique_ips": 0,
            "critical_events": 0,
            "error": str(e)
        }), 200



@app.route('/api/cache/stats', methods=['GET'])
def cache_stats():
    """
    US-REDIS-1: Get cache statistics
    """
    try:
        latest_ttl = cache.redis.ttl("latest_logs") if cache.redis else -1
        stats_ttl = cache.redis.ttl("stats") if cache.redis else -1
        
        return jsonify({
            "latest_logs_ttl": latest_ttl,
            "stats_ttl": stats_ttl,
            "status": "connected" if cache.redis else "disconnected"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
