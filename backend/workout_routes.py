from flask import Blueprint, jsonify
from backend.models import db, Workout

workout_bp = Blueprint('workout', __name__)

@workout_bp.route('/', methods=['GET'])
def get_workouts():
    workouts = Workout.query.all()
    return jsonify([{"id": w.id, "name": w.name} for w in workouts]), 200