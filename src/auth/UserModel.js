const { executeQuery } = require('../database');
const { v4: uuidv4 } = require('uuid'); // Per generare ID univoci

class UserModel {
  // Crea un nuovo utente (coach o studente)
  static async createUser({ email, password, name, role }) {
    const id = uuidv4();
    const result = await executeQuery(
      `INSERT INTO users (id, email, password, name, role, is_logged_in)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [id, email, password, name, role]
    );
    return { id, email, name, role };
  }

  // Trova utente per email
  static async findByEmail(email) {
    const result = await executeQuery(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return result.rows.length > 0 ? result.rows.item(0) : null;
  }

  // Assegna uno studente a un coach
  static async assignStudent(coachId, studentId) {
    await executeQuery(
      `INSERT INTO assignments (coach_id, student_id)
       VALUES (?, ?)`,
      [coachId, studentId]
    );
    return { coachId, studentId };
  }

  // Ottieni tutti gli studenti di un coach
  static async getStudents(coachId) {
    const result = await executeQuery(
      `SELECT users.* FROM users
       JOIN assignments ON users.id = assignments.student_id
       WHERE assignments.coach_id = ?`,
      [coachId]
    );
    return result.rows.raw();
  }

  // Verifica password (semplificata per SQLite)
  static async verifyPassword(inputPassword, storedPassword) {
    // In un'app reale, qui andrebbe la verifica dell'hash
    // Per semplicità confrontiamo direttamente le stringhe
    return inputPassword === storedPassword;
  }

  // Imposta lo stato di login
  static async setLoginStatus(userId, isLoggedIn) {
    await executeQuery(
      'UPDATE users SET is_logged_in = ? WHERE id = ?',
      [isLoggedIn ? 1 : 0, userId]
    );
  }
}

module.exports = UserModel;