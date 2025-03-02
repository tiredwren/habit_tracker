import { useLocalSearchParams, useRouter } from "expo-router";
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
    const [selectedImageUri, setSelectedImageUri] = useState(null); // for specific log
    const [selectedDate, setSelectedDate] = useState(""); // for specific log
    const [selectedReflection, setSelectedReflection] = useState(""); // for specific log

    const params = useLocalSearchParams();
    const habitRef = params.habitId;
    const userId = "user_id"; // Replace with actual user ID
    const router = useRouter();

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
                            // Store the ID along with the image URL and reflection
                            images.push({ id: doc.id, uri: fetchedData.image, reflection: fetchedData.reflection || "" }); // Include reflection
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

        fetchProgress();
    }, [habitRef]);

    const test = (image, date, reflection) => {
        console.log(`Reflection: ${reflection}`); // Log reflection to check
        setIsDialogOpen(true);
        setSelectedImageUri(image);
        setSelectedDate(date);
        console.log(selectedReflection);
        setSelectedReflection(reflection);
        
    };

    // Format the lastDate to mm-dd-yyyy
    const formatDate = (date) => {
        const d = new Date(date);
        return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`;
    };

    return (
        <SafeAreaView>
            <View style={styles.streakContainer}>
                <Text style={[styles.labelText, { marginBottom: 0, marginLeft: 2, fontWeight: "bold" }]}>
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
            {/* Conditionally render the FlatList if there are images */}
            {habitProgress.images.length > 0 ? (
                <FlatList
                    style={{ marginTop: 30, marginHorizontal: 10 }}
                    data={habitProgress.images}
                    keyExtractor={(item) => item.uri} // Use image URI as key
                    numColumns={numColumns}
                    key={`image-list-${numColumns}`} // For forcing re-render
                    renderItem={({ item }) => (
                        <View style={styles.imageContainer}>
                            <TouchableOpacity onPress={() => test(item.uri, item.id, item.reflection)}> {/* Pass image URI and reflection to the test function */}
                                <Image source={{ uri: item.uri }} style={styles.image} />
                            </TouchableOpacity>
                        </View>
                    )}
                />
            ) : (
                <View>
                    <Text style={[styles.title, { color: "#000", margin: 50 }]}>you haven't logged progress for this habit yet!</Text> {/* Fallback message when there are no images */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.button, { marginBottom: "30%", marginHorizontal: 30 }]} onPress={() => router.push(`/log?habitRef=${habitRef}`)}>
                            <Text style={styles.buttonText}>log progress</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {isDialogOpen && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={[styles.dialogBox, { position: "absolute", top: "-1%", height: "200%", width: "100%", backgroundColor: "#b7b7a4", borderRadius: 0 }]}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                            <Text style={styles.title2}>l o g   d e t a i l s</Text>
                            <View style={styles.addHabitContainer}>
                                <Text style={[styles.title, { color: "#000" }]}>{selectedDate}</Text>
                                <Image 
                                    source={{ uri: selectedImageUri }} 
                                    style={{ marginBottom: 10, width: "100%", height: 150, borderRadius: 10 }} 
                                />
                                <Text style={[styles.labelText, {marginLeft: 2}]}>{selectedReflection}</Text>
                                <TouchableOpacity style={[styles.cancelButton, { top: "20%" }]} onPress={() => setIsDialogOpen(false)}>
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
