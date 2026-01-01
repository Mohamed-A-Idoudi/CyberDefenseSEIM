import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-change-me'
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://mongodb:27017/siem'
    ES_HOSTS = os.environ.get('ES_HOSTS') or ['http://elasticsearch:9200']
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://redis:6379'
