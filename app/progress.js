import { useLocalSearchParams } from "expo-router";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import { SafeAreaView, View, Text, FlatList, Image, TouchableOpacity, KeyboardAvoidingView, TouchableWithoutFeedback, ScrollView, Keyboard, Platform } from "react-native";
import { db } from "./firebaseConfig";
import styles from "../assets/styles/styles";

const ProgressPage = () => {
    const [habitProgress, setHabitProgress] = useState({ images: [], inputs: [] });
    const [lastDate, setLastDate] = useState(null);
    const [streak, setStreak] = useState(0);
    const [numColumns, setNumColumns] = useState(3);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const params = useLocalSearchParams();
    const habitRef = params.habitId;
    const userId = "user_id"; // Replace with actual user ID

    useEffect(() => {
        const fetchProgress = async () => {
            if (!habitRef) return; // Ensure habitRef exists

            const progressRef = collection(db, "users", userId, "habits", habitRef, "progress");
            const q = query(progressRef, orderBy("date", "desc"));

            try {
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const progressDates = querySnapshot.docs.map(doc => doc.data().date);
                    setLastDate(progressDates[0]); // Set the last date

                    // Calculate streak
                    const today = new Date();
                    let currentStreak = 0;

                    for (let date of progressDates) {
                        const progressDate = new Date(date);
                        const difference = Math.floor((today - progressDate) / (1000 * 60 * 60 * 24)); // Difference in days

                        if (difference === currentStreak) {
                            currentStreak++;
                        } else {
                            break; // If the streak is broken, stop counting
                        }
                    }

                    setStreak(currentStreak);

                    // Fetch images and reflections
                    const images = [];
                    const reflections = [];

                    querySnapshot.forEach((doc) => {
                        const fetchedData = doc.data();
                        if (fetchedData.image) {
                            images.push(fetchedData.image);
                        }
                        if (fetchedData.reflection) {
                            reflections.push(fetchedData.reflection);
                        }
                    });

                    // Update state with images and reflections
                    setHabitProgress({ images, inputs: reflections });
                } else {
                    setStreak(0);
                }
            } catch (error) {
                console.error("Error fetching progress:", error);
            }
        };

        console.log(habitProgress.images);

        fetchProgress();
    }, [habitRef]);

    // Format the lastDate to mm-dd-yyyy
    const formatDate = (date) => {
        const d = new Date(date);
        return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`;
    };

    console.log("Number of images:", habitProgress.images.length);
    console.log("Rendering FlatList: ", habitProgress.images.length > 0);

    return (
        <SafeAreaView>
            <View style={styles.streakContainer}>
                <Text style={styles.streakText}>streak: {streak} days</Text>
                <View style={styles.streakBar}>
                    <View style={{ 
                        width: `${(streak / 30) * 100}%`, // Assuming 30 days max for a full bar
                        backgroundColor: 'green', 
                        height: '100%' 
                    }} />
                </View>
            </View>
            {/* conditionally render the flatlist if there are images */}
            {habitProgress.images.length > 0 ? (
                <FlatList
                    style={{ marginTop: 30, marginHorizontal: 10, borderColor: 'red', borderWidth: 1 }}
                    data={habitProgress.images}
                    keyExtractor={(item, index) => item.uri || index.toString()}
                    numColumns={numColumns}
                    
                    key={`image-list-${numColumns}`} // for forcing re-render
                    renderItem={({ item }) => (
                        <View style={styles.imageContainer}>
                            <TouchableOpacity onPress={() => setIsDialogOpen(true)}>
                                <Image source={{ uri: item }} style={styles.image} />
                            </TouchableOpacity>
                        </View>
                    )}
                />
            ) : (
                <Text>No images available</Text> // fallback message when there are no images
            )}
    
            {isDialogOpen && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={[styles.dialogBox, { position: "absolute", top: "0%", height: "120%", width: "100%", backgroundColor: "#b7b7a4", padding: 20 }]}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                            <Text style={styles.title2}>a d d   a   g o a l</Text>
                            <View style={styles.addHabitContainer}>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => setIsDialogOpen(false)}>
                                    <Text style={styles.buttonText}>exit</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );    
};

export default ProgressPage;
