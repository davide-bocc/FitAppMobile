const db = require('../database/db');

class UserModel {
  // Crea un nuovo utente (coach o studente)
  static async createUser({ id, email, passwordHash, role }) {
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(id, email, passwordHash, role);
  }

  // Trova utente per email
  static async findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }

  // Assegna uno studente a un coach
  static async assignStudent(coachId, studentId) {
    const stmt = db.prepare(`
      INSERT INTO assignments (coach_id, student_id)
      VALUES (?, ?)
    `);
    return stmt.run(coachId, studentId);
  }

  // Ottieni tutti gli studenti di un coach
  static async getStudents(coachId) {
    return db.prepare(`
      SELECT users.* FROM users
      JOIN assignments ON users.id = assignments.student_id
      WHERE assignments.coach_id = ?
    `).all(coachId);
  }

    // Hash password
  static async hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  // Verifica password
  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }

  // Genera JWT token
  static generateToken(user) {
    return jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'fitapp_secret',
      { expiresIn: '7d' }
    );
  }
}
}

module.exports = UserModel;