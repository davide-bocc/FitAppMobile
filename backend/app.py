from flask import Flask
from flask_cors import CORS
from backend.auth import auth_bp
from backend.workout_routes import workout_bp
from backend.db import db

app = Flask(__name__)
CORS(app)  # Abilita CORS per il frontend mobile

# Aggiungi configurazione del database
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///fitapp.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)  # Inizializza db con l'app

# Registra i blueprint
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(workout_bp, url_prefix='/api/workouts')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)