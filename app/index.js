import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Dimensions,
  View,
  Text,
  TextInput,
  Image,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { db } from "./firebaseConfig";
import { doc, setDoc, collection, onSnapshot, deleteDoc, getDocs, query, orderBy } from "firebase/firestore";
import styles from "../assets/styles/styles";
import Icon from "react-native-vector-icons/MaterialIcons";
import { router } from "expo-router";

const HabitTracker = () => {
  const [habits, setHabits] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: "", frequency: "", image: null });
  const [editingHabit, setEditingHabit] = useState(null);
  const [streak, setStreak] = useState(0);
  const userId = "user_id"; // replace with actual user id
  const { width } = Dimensions.get("window");

  const handleInputChange = (name, value) => {
    setNewHabit({ ...newHabit, [name]: value });
  };

  const handleEditInputChange = (name, value) => {
    setEditingHabit({ ...editingHabit, [name]: value });
  };

  const openHabitDescription = (habitId) => {
    console.log("Habit ID:", habitId);
    router.push(`/log?habitRef=${habitId}`);
  };

  const handleImageUpload = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setNewHabit({ ...newHabit, image: result.assets[0].uri });
    }
  };

  const saveHabit = async () => {
    if (newHabit.name && newHabit.frequency && newHabit.image) {
      try {
        const habitRef = doc(collection(db, "users", userId, "habits"));
        await setDoc(habitRef, {
          ...newHabit,
          image: newHabit.image,
        });

        setNewHabit({ name: "", frequency: "", image: null });
        setIsDialogOpen(false);
      } catch (error) {
        console.error("error saving habit:", error);
      }
    } else {
      alert("make sure you've filled all the fields!");
    }
  };

  const openEditDialog = (habit) => {
    setEditingHabit(habit);
    setIsEditDialogOpen(true);
  };

  const updateHabit = async () => {
    if (editingHabit.name && editingHabit.frequency) {
      try {
        const habitRef = doc(db, "users", userId, "habits", editingHabit.id);
        await setDoc(habitRef, {
          ...editingHabit,
        });

        setEditingHabit(null);
        setIsEditDialogOpen(false);
      } catch (error) {
        console.error("error updating habit:", error);
      }
    } else {
      alert("make sure you've filled all the fields!");
    }
  };

  const deleteHabit = async (habitId) => {
    try {
      const habitRef = doc(db, "users", userId, "habits", habitId);
      await deleteDoc(habitRef);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("error deleting habit:", error);
    }
  };

  const calculateStreak = async () => {
    const habitsCollection = collection(db, "users", userId, "habits");
    const snapshot = await getDocs(habitsCollection);
    const habitPromises = snapshot.docs.map(async (doc) => {
      const habitId = doc.id;
      const progressRef = collection(db, "users", userId, "habits", habitId, "progress");
      const q = query(progressRef, orderBy("date", "desc"));
      const progressSnapshot = await getDocs(q);
      const progressDates = progressSnapshot.docs.map(doc => new Date(doc.data().date));

      return { habitId, progressDates };
    });

    const habitsProgress = await Promise.all(habitPromises);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    let currentStreak = 0;
    let allHabitsHaveProgress = true;

    while (allHabitsHaveProgress) {
      allHabitsHaveProgress = true;

      for (const { progressDates } of habitsProgress) {
        if (!progressDates.some(date => date.toDateString() === yesterday.toDateString())) {
          allHabitsHaveProgress = false;
          break;
        }
      }

      if (allHabitsHaveProgress) {
        currentStreak++;
        yesterday.setDate(yesterday.getDate() - 1);
      }
    }

    setStreak(currentStreak);
  };

  useEffect(() => {
    const fetchHabits = async () => {
      const habitsCollection = collection(db, "users", userId, "habits");

      const unsubscribe = onSnapshot(habitsCollection, (snapshot) => {
        const fetchedHabits = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setHabits(fetchedHabits);
      });

      return () => unsubscribe();
    };

    fetchHabits();
    calculateStreak(); // Call the streak calculation function
  }, [userId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#b7b7a4", width: width }}>
      <View style={styles.streakContainer}>
        <Text style={[styles.labelText, {marginBottom: 0, marginLeft: 2, fontWeight:"bold"}]}>
          {streak} / 30 day streak ✧.*
        </Text>
        <View style={styles.streakBar}>
            <View style={{ 
                width: `${(streak / 30) * 100}%`, // Assuming 30 days max for a full bar
                backgroundColor: '#d4a373', 
                height: '100%' 
            }} />
        </View>
      </View>
      <Text style={[styles.title]}>Y O U R   H A B I T S</Text>
      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={<View style={{ height: 20 }} />}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
            <TouchableOpacity onPress={() => openEditDialog(item)}>
              <Image source={{ uri: item.image }} style={styles.cardContainerImage} />
            </TouchableOpacity>
            <View style={styles.textContainer}>
              <Text style={styles.cardContainerText}>{item.name}</Text>
            </View>
            <View style={styles.textContainer}>
              <TouchableOpacity style={styles.arrowButton} onPress={() => openHabitDescription(item.id)}>
                <Icon name="arrow-right-alt" size={50} color="#000" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteHabit(item.id)}
            >
              <Icon name="delete-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, { marginBottom: "30%" }]} onPress={() => setIsDialogOpen(true)}>
          <Text style={styles.buttonText}>add a habit/goal</Text>
        </TouchableOpacity>
      </View>

       {/* habit dialog */}
       {isDialogOpen && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.dialogBox, { position: "absolute", top: "0%", height: "120%", width: "100%", backgroundColor: "#b7b7a4", padding: 20 }]}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <Text style={styles.title2}>a d d   a   g o a l</Text>
              <View style={styles.addHabitContainer}>

                {/* display image above the button */}
                {newHabit.image && (
                  <Image
                    source={{ uri: newHabit.image }}
                    style={{ marginBottom: 10, width: "100%", height: 150, borderRadius: 10 }}
                  />
                )}


                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.button} onPress={handleImageUpload}>
                    <Text style={styles.buttonText}>upload image</Text>
                  </TouchableOpacity>
                </View>


                <Text style={[styles.labelText, { marginBottom: 10, marginTop: 20 }]}>name</Text>
                <TextInput
                  value={newHabit.name}
                  onChangeText={(text) => handleInputChange("name", text)}
                  style={[styles.input, { color: "#000", marginBottom: 20 }]}
                />


                <Text style={[styles.labelText, { marginBottom: 10 }]}>frequency</Text>
                <TextInput
                  value={newHabit.frequency}
                  onChangeText={(text) => handleInputChange("frequency", text)} 
                  style={[styles.input, { color: "#000" }]}
                />
                <View style={{ flex: 1, justifyContent: "flex-end", marginTop: 20 }}>
                  <View style={styles.buttonContainer2}>
                    <TouchableOpacity style={styles.saveButton} onPress={saveHabit}>
                      <Text style={styles.buttonText}>save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setIsDialogOpen(false)}>
                      <Text style={styles.buttonText}>cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}

      {/* Edit habit dialog */}
      {isEditDialogOpen && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.dialogBox, { position: "absolute", top: "0%", height: "120%", width: "100%", backgroundColor: "#b7b7a4", padding: 20 }]}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <Text style={styles.title2}>e d i t   a   h a b i t</Text>
              <View style={styles.addHabitContainer}>
                <Image
                  source={{ uri: editingHabit.image }}
                  style={{ marginBottom: 10, width: "100%", height: 150, borderRadius: 10 }}
                />

                <Text style={[styles.labelText, { marginBottom: 10, marginTop: 20 }]}>name</Text>
                <TextInput
                  value={editingHabit.name}
                  onChangeText={(text) => handleEditInputChange("name", text)}
                  style={[styles.input, { color: "#000", marginBottom: 20 }]}
                />

                <Text style={[styles.labelText, { marginBottom: 10 }]}>frequency</Text>
                <TextInput
                  value={editingHabit.frequency}
                  onChangeText={(text) => handleEditInputChange("frequency", text)}
                  style={[styles.input, { color: "#000" }]}
                />
                <View style={{ flex: 1, justifyContent: "flex-end", marginTop: 20 }}>
                  <View style={styles.buttonContainer2}>
                    <TouchableOpacity style={styles.saveButton} onPress={updateHabit}>
                      <Text style={styles.buttonText}>update</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => deleteHabit(editingHabit.id)}>
                      <Text style={styles.buttonText}>delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditDialogOpen(false)}>
                      <Text style={styles.buttonText}>cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

export default HabitTracker;
