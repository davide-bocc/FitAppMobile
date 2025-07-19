import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { fetchWithCache } from '../../../database/firebase/firebaseConfig';

const CoachHomeScreen = ({ navigation }) => {
  const [students, setStudents] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Carica in parallelo con cache
        const [fetchedStudents, fetchedWorkouts] = await Promise.all([
          fetchWithCache('users', [['role', '==', 'student']]),
          fetchWithCache('workouts')
        ]);

        setStudents(fetchedStudents);
        setWorkouts(fetchedWorkouts);
      } catch (error) {
        console.error('Load error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const assignWorkout = async (studentId, workoutId) => {
    try {
      // Batch update per assegnazioni multiple
      const batch = writeBatch(db);
      const assignmentRef = doc(collection(db, 'assignments'));

      batch.set(assignmentRef, {
        studentId,
        workoutId,
        assignedAt: new Date().toISOString()
      });

      await batch.commit();
      Alert.alert('Assegnato con successo');
    } catch (error) {
      console.error('Assignment error:', error);
    }
  };

  if (loading) return <Text>Caricamento...</Text>;
  if (error) return <Text>Errore: {error}</Text>;

  return (
    <View style={styles.container}>
      <Button title="Crea Nuovo Workout" onPress={createNewWorkout} />

      <Text style={styles.title}>I tuoi Workout</Text>
      <FlatList
        data={workouts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.workoutItem}>
            <Text style={styles.workoutName}>{item.name}</Text>
            <Text>Esercizi: {item.exercises?.length || 0}</Text>
          </View>
        )}
      />

      <Text style={styles.title}>I tuoi Allievi</Text>
      <FlatList
        data={students.filter(s => s.role === 'student')}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.studentItem}>
            <Text>{item.name}</Text>
            <Button
              title="Assegna"
              onPress={() => navigation.navigate('AssignWorkout', { studentId: item.id })}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  workoutItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  workoutName: { fontWeight: 'bold' },
  studentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  }
});

export default CoachHomeScreen;