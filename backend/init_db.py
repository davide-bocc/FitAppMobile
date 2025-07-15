from backend.app import app
from backend.db import db
from backend import models

with app.app_context():
    db.create_all()