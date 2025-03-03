import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import { 
    SafeAreaView, 
    View, 
    Text, 
    FlatList, 
    Image, 
    TouchableOpacity, 
    KeyboardAvoidingView, 
    TouchableWithoutFeedback, 
    ScrollView, 
    Keyboard, 
    Platform 
} from "react-native";
import { db } from "./firebaseConfig";
import styles from "../assets/styles/styles";

const ProgressPage = () => {
    const [habitProgress, setHabitProgress] = useState({ images: [], inputs: [] });
    const [lastDate, setLastDate] = useState(null);
    const [streak, setStreak] = useState(0);
    const [numColumns, setNumColumns] = useState(3);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedReflection, setSelectedReflection] = useState("");

    const params = useLocalSearchParams();
    const habitRef = params.habitId;
    const userId = "user_id"; // replace with actual userID
    const router = useRouter();

    useEffect(() => {
        setHabitProgress({ images: [], inputs: [] }); // clear progress when habit changes
        setStreak(0); // reset streak to prevent stale data
    
        const fetchProgress = async () => {
            if (!habitRef) return; // check if habitRef exists
    
            const progressRef = collection(db, "users", userId, "habits", habitRef, "progress");
            const q = query(progressRef, orderBy("date", "desc"));
    
            try {
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const progressDates = querySnapshot.docs.map(doc => doc.data().date);
                    console.log(`test2 ${progressDates}`)
                    setLastDate(progressDates[0]); // set the last logged date
    
                    // calculate streak
                    let currentStreak = 0;
                    let today = new Date();
                    today.setHours(0, 0, 0, 0);
    
                    for (let i = 0; i < progressDates.length; i++) {
                        let progressDate = new Date(progressDates[i]);
                        progressDate.setHours(0, 0, 0, 0);
    
                        let difference = (today - progressDate) / (1000 * 60 * 60 * 24); // difference in days
    
                        if (difference === currentStreak || difference === currentStreak + 1) {
                            currentStreak++;
                        } else {
                            break; // change
                        }
                    }
    
                    setStreak(currentStreak);
    
                    // fetch images and reflections
                    const images = [];
                    const reflections = [];
    
                    querySnapshot.forEach((doc) => {
                        const fetchedData = doc.data();
                        if (fetchedData.image) {
                            images.push({ id: doc.id, uri: fetchedData.image, reflection: fetchedData.reflection, date: fetchedData.date || "" });
                        }
                        reflections.push(fetchedData.reflection);
                    });
    
                    setHabitProgress({ images, inputs: reflections });
                } else {
                    setStreak(0);
                }
            } catch (error) {
                console.error("error fetching progress:", error);
            }
        };
    
        fetchProgress();
    }, [habitRef]);
    
    const openFullLog = (image, date, reflection) => {
        setIsDialogOpen(true);
        setSelectedImageUri(image);
        setSelectedDate(date);
        setSelectedReflection(reflection);
        
    };

    return (
        <SafeAreaView>
            <View style={styles.streakContainer}>
                <Text style={[styles.labelText, { marginBottom: 0, marginLeft: 2, fontWeight: "bold" }]}>
                    {streak} / 30 day streak ✧.*
                </Text>
                <View style={styles.streakBar}>
                    <View style={{
                        width: `${(streak / 30) * 100}%`, // make dynamic
                        backgroundColor: '#d4a373',
                        height: '100%'
                    }} />
                </View>
            </View>
            {/* only render flatlist if there's images */}
            {habitProgress.images.length > 0 ? (
                <FlatList
                    style={{ marginTop: 30, marginHorizontal: 10 }}
                    data={habitProgress.images}
                    keyExtractor={(item) => item.uri} // image uri = key
                    numColumns={numColumns}
                    key={`image-list-${numColumns}`} // changes based on number of images
                    renderItem={({ item }) => (
                        <View style={styles.imageContainer}>
                            <TouchableOpacity onPress={() => openFullLog(item.uri, item.date, item.reflection)}> {/* to open specific logs */}
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
                        <ScrollView contentContainerStyle={{ height: "100%"}}>
                            <Text style={styles.title2}>l o g   d e t a i l s</Text>
                            <View style={[styles.addHabitContainer, { height: "45%" }]}>
                                <Text style={[styles.title, { color: "#000" }]}>{selectedDate.replace(/-/g, '/')}</Text>
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
