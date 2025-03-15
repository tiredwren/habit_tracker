import React, { useState, useEffect } from "react";
import { Picker } from '@react-native-picker/picker';
import auth from "@react-native-firebase/auth";
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
import { doc, setDoc, collection, onSnapshot, deleteDoc, getDocs, query, orderBy, getDoc } from "firebase/firestore";
import styles from "../../assets/styles/styles";
import Icon from "react-native-vector-icons/MaterialIcons";
import { router } from "expo-router";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

const HabitTracker = () => {
  const [habits, setHabits] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: "", frequency: "", input: "", image: null });
  const [editingHabit, setEditingHabit] = useState(null);
  const [streak, setStreak] = useState(0);
  const [userId, setUserId] = useState(null);
  const { width } = Dimensions.get("window");
  const [currency, setCurrency] = useState(0)

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser) {
      setUserId(currentUser.email);
    } else {
      console.log("user not authenticated");
    }
  }, []); // runs once on component mount
  
  useEffect(() => {
    const getCurrency = async () => {
      if (userId) {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setCurrency(userDoc.data().currency || 0); // set according to user currency
        }
      }
    };
  
    getCurrency();
  }, [userId]); // runs when userId changes
  
  console.log("currency: ", currency);
  
  const handleInputChange = (name, value) => {
    setNewHabit({ ...newHabit, [name]: value });
  };

  const handleEditInputChange = (name, value) => {
    setEditingHabit({ ...editingHabit, [name]: value });
  };

  const openHabitDescription = (habitId) => {
    router.push(`/logProgress?habitRef=${habitId}`);
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
    if (newHabit.name && newHabit.image) {
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
    if (editingHabit.name && editingHabit.image) {
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
      console.log(progressSnapshot)

      const progressDates = progressSnapshot.docs.map(doc => {
        const dateData = doc.data().date;
        return dateData.toDate ? dateData.toDate() : new Date(dateData);
      });

      return { habitId, progressDates };
    });

    const habitsProgress = await Promise.all(habitPromises);

    const today = new Date();
    let checkDate = new Date(today);
    let currentStreak = 0;

    while (true) {
      let allHabitsHaveProgress = habitsProgress.every(({ progressDates }) =>
        progressDates.some(date => date.toDateString() === checkDate.toDateString())
      );

      if (allHabitsHaveProgress) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    setStreak(currentStreak);
};

  useEffect(() => {
    if (userId) {
      const fetchHabits = async () => {
        const habitsCollection = collection(db, "users", userId, "habits");

        const unsubscribe = onSnapshot(habitsCollection, (snapshot) => {
          const fetchedHabits = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setHabits(fetchedHabits);
        });

        return () => unsubscribe();
      };

      fetchHabits();
      calculateStreak(); // calculate streak
    }
  }, [userId]); // run effect when userId changes

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#b7b7a4", width: width }}>
      <View style={styles.streakContainer}>
                <Text style={[styles.labelText, { marginBottom: 0, marginLeft: 2, fontWeight: "bold" }]}>
                    {streak} / {30} day streak ✧.*
                </Text>
                <View style={styles.streakBar}>
                    <View style={{
                        width: `${(streak / 30) * 100}%`,
                        backgroundColor: '#d4a373',
                        height: '100%'
                    }} />
                </View>
                <Text style={[styles.labelText, { marginBottom: 0, marginLeft: 2, fontWeight: "bold" }]}>
                    coins: {currency} 💰
                </Text>
            </View>
      <Text style={[styles.title]}>y o u r   h a b i t s</Text>
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
                    style={{ marginBottom: 0, width: "100%", height: 150, borderRadius: 10 }}
                  />
                )}

                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.button} onPress={handleImageUpload}>
                    <Text style={styles.buttonText}>upload image</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.labelText, { marginBottom: 10, marginTop: 0 }]}>name</Text>
                <TextInput
                  value={newHabit.name}
                  onChangeText={(text) => handleInputChange("name", text)}
                  style={[styles.input, { color: "#000", marginBottom: 10 }]}
                />

                <Text style={[styles.labelText, { marginBottom: 10 }]}>input type</Text>

                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={newHabit.input}
                    onValueChange={(value) => handleInputChange("input", value)}
                    style={{ color: "#000" }}
                  >
                    <Picker.Item label="checkbox (for one-time habits)" value="boolean" />
                    <Picker.Item label="number (for repeated habits)" value="integer" />
                  </Picker>
                </View>

                <Text style={[styles.labelText, { marginBottom: 10 }]}>frequency</Text>
                
                {/* dropdown based on client feedback */}
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={newHabit.frequency}
                    onValueChange={(value) => handleInputChange("frequency", value)}
                    style={{ color: "#000" }}
                  >
                    <Picker.Item label="daily" value="daily" />
                    <Picker.Item label="weekly" value="weekly" />
                    <Picker.Item label="monthly" value="monthly" />
                    <Picker.Item label="custom" value="custom" />
                  </Picker>
                </View>

                {/* custom input field for custom frequency */}
                {newHabit.frequency === "custom" && (
                  <View>
                    <Text style={[styles.labelText, { marginTop: 10, marginBottom: 10 }]}>enter custom frequency</Text>
                  <TextInput
                    value={newHabit.customFrequency || ""}
                    onChangeText={(text) => handleInputChange("customFrequency", text)}
                    style={[styles.input, { color: "#000" }]}
                  />
                  </View>
                )}

                <View style={{ flex: 1, justifyContent: "flex-end", marginBottom: "30%", marginTop: "35%" }}>
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

      {/* edit habit dialog */}
      {isEditDialogOpen && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.dialogBox, { position: "absolute", top: "0%", height: "120%", width: "100%", backgroundColor: "#b7b7a4", padding: 20 }]}
        >
          
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
              <Text style={styles.title2}>e d i t   a   g o a l</Text>
              <View style={styles.addHabitContainer}>
                
                {/* display image above the button */}
                {editingHabit.image && (
                  <Image
                    source={{ uri: editingHabit.image }}
                    style={{ marginBottom: 0, width: "100%", height: 150, borderRadius: 10 }}
                  />
                )}

                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.button} onPress={handleImageUpload}>
                    <Text style={styles.buttonText}>upload image</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.labelText, { marginBottom: 10, marginTop: 0 }]}>name</Text>
                <TextInput
                  value={editingHabit.name}
                  onChangeText={(text) => handleEditInputChange("name", text)}
                  style={[styles.input, { color: "#000", marginBottom: 10 }]}
                />

                <Text style={[styles.labelText, { marginBottom: 10 }]}>input type</Text>

                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={newHabit.input}
                    onValueChange={(value) => handleInputChange("input", value)}
                    style={{ color: "#000" }}
                  >
                    <Picker.Item label="checkbox (for one-time habits)" value="boolean" />
                    <Picker.Item label="number (for repeated habits)" value="integer" />
                  </Picker>
                </View>

                <Text style={[styles.labelText, { marginBottom: 10 }]}>frequency</Text>
                
                {/* dropdown based on client feedback */}
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={editingHabit.frequency}
                    onValueChange={(value) => handleEditInputChange("frequency", value)}
                    style={{ color: "#000" }}
                  >
                    <Picker.Item label="daily" value="daily" />
                    <Picker.Item label="weekly" value="weekly" />
                    <Picker.Item label="monthly" value="monthly" />
                    <Picker.Item label="custom" value="custom" />
                  </Picker>
                </View>

                {/* custom input field for custom frequency */}
                {editingHabit.frequency === "custom" && (
                  <View>
                    <Text style={[styles.labelText, { marginTop: 10, marginBottom: 10 }]}>enter custom frequency</Text>
                  <TextInput
                    value={newHabit.customFrequency || ""}
                    onChangeText={(text) => handleEditInputChange("customFrequency", text)}
                    style={[styles.input, { color: "#000" }]}
                  />
                  </View>
                )}

                <View style={{ flex: 1, justifyContent: "flex-end", marginBottom: "30%", marginTop: "35%" }}>
                  <View style={styles.buttonContainer2}>
                    <TouchableOpacity style={styles.saveButton} onPress={updateHabit}>
                      <Text style={styles.buttonText}>save</Text>
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
