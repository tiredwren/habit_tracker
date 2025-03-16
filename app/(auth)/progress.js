import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs, getDoc, query, orderBy, updateDoc, doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Dimensions } from "react-native";
import auth from "@react-native-firebase/auth";
import { increment } from "firebase/firestore";
import { LineChart } from "react-native-chart-kit";
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
import styles from "../../assets/styles/styles";

const ProgressPage = () => {
    const [habitProgress, setHabitProgress] = useState({ images: [], inputs: [], graphData: [] });
    const [lastDate, setLastDate] = useState(null);
    const [streak, setStreak] = useState(0);
    const [currency, setCurrency] = useState(0); 
    const [numColumns, setNumColumns] = useState(3);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedReflection, setSelectedReflection] = useState("");
    const [selectedData, setSelectedData] = useState("");
    const [goal, setGoal] = useState(1)

    const params = useLocalSearchParams();
    const habitRef = params.habitId;
    const userId = auth().currentUser.email;
    const router = useRouter();

    if (!userId) {
        console.log("hello world");
        router.replace('./index');
    }

    useEffect(() => {
        setHabitProgress({ images: [], inputs: [], graphData: [] });
        setStreak(0);
    
        if (!habitRef) return;
    
        const progressRef = collection(db, "users", userId, "habits", habitRef, "progress");
        const userRef = doc(db, "users", userId);
        const q = query(progressRef, orderBy("date", "desc"));
    
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            if (!querySnapshot.empty) {
                const progressData = querySnapshot.docs.map(doc => doc.data());
                const progressDates = progressData.map(entry => entry.date);
                setLastDate(progressDates[0]);
    
                // calculate streak
                let currentStreak = 0;
                let today = new Date();
                today.setHours(0, 0, 0, 0);
                let streakValid = true;
    
                for (let i = 0; i < progressDates.length && streakValid; i++) {
                    let progressDate = new Date(progressDates[i]);
                    progressDate.setHours(0, 0, 0, 0);
                    let difference = (today - progressDate) / (1000 * 60 * 60 * 24);
    
                    if (difference === currentStreak || difference === currentStreak + 1) {
                        currentStreak++;
                    } else {
                        streakValid = false;
                    }
                }
    
                // update currency if streak reaches goal
                const userDoc = await getDoc(userRef);
                const lastCurrencyUpdate = userDoc.data()?.lastCurrencyUpdate ? new Date(userDoc.data().lastCurrencyUpdate) : null;
    
                if (currentStreak >= goal && (!lastCurrencyUpdate || today > lastCurrencyUpdate)) {
                    await updateDoc(userRef, {
                        currency: increment(5),
                        lastCurrencyUpdate: today,
                    });
                    setCurrency(prev => prev + 5);
                    currentStreak = 0;
                }
    
                if (currentStreak > 0) {
                    setStreak(currentStreak);
                    setGoal(5 * (Math.floor(currentStreak / 1) + 1));
                } else {
                    setStreak(0);
                }
    
                // extract images, reflections, and graph data
                const images = [];
                const reflections = [];
                const Gdata = [];
    
                querySnapshot.forEach((doc) => {
                    const foundData = doc.data();
                    if (foundData.image) {
                        images.push({ id: doc.id, uri: foundData.image, reflection: foundData.reflection, date: foundData.date || "", data: foundData.numericInput });
                    }
                    if (foundData.numericInput && foundData.date) {
                        Gdata.push({ x: foundData.date, y: Number(foundData.numericInput) });
                    }
                    reflections.push(foundData.reflection);
                });
    
                setHabitProgress({ images, inputs: reflections, graphData: Gdata });
            } else {
                setStreak(0);
            }
        });
    
        return () => unsubscribe(); // clean up listener when component unmounts
    }, [habitRef]);
    

    const openFullLog = (image, date, reflection, data) => {
        setIsDialogOpen(true);
        setSelectedImageUri(image);
        setSelectedDate(date);
        setSelectedReflection(reflection);
        setSelectedData(data);
    };

    return (
        <SafeAreaView style={{ backgroundColor: "#b7b7a4", height: "100%", }}>
            {/* streak bar & currency count */}
            <View style={styles.streakContainer}>
                <Text style={[styles.labelText, { marginBottom: 0, marginLeft: 2, fontWeight: "bold" }]}>
                    {streak} / {goal} day streak ✧.*
                </Text>
                <View style={styles.streakBar}>
                    <View style={{
                        width: `${(streak / goal) * 100}%`,
                        backgroundColor: '#d4a373',
                        height: '100%'
                    }} />
                </View>
                <Text style={[styles.labelText, { marginBottom: 0, marginLeft: 2, fontWeight: "bold" }]}>
                    coins: {currency} 💰
                </Text>
            </View>

            {/* input graph */}
            <View style={{marginHorizontal: 10}}> {/* center display */}
            {habitProgress.graphData.length > 0 ? ( // only display graph if progress exists
                <LineChart
                    data={{
                        labels: ["start", ...habitProgress.graphData.map(data => new Date(data.x).toLocaleDateString())],
                        // dates are given for each progress dot
                        datasets: [
                            {
                                data: [0, ...habitProgress.graphData.map(data => data.y)], // always start at 0
                            },
                        ],
                    }}
                    width={Dimensions.get("window").width - 20} 
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    yAxisInterval={1}
                    chartConfig={{
                        backgroundColor: '#d4a373',
                        backgroundGradientFrom: '#d4a373',
                        backgroundGradientTo: '#d4a373',
                        decimalPlaces: 2, 
                        color: (opacity = 1) => '#fff', // fix later (to match colorscheme)
                        labelColor: (opacity = 1) => "#fff", // fix later (to match colorscheme)
                        style: {
                           margin: 10
                        },
                        propsForDots: {
                            r: "6",
                            strokeWidth: "2",
                            stroke: "#ffa726",
                        },
                    }}
                    bezier
                    style={{
                        width: "100%",
                        alignSelf: "center"
                    }}
                />
            ) : (
                <Text style={[styles.title, { color: "#000", margin: 50 }]}>
                    you haven't logged anything yet!
                </Text>
            )}
            </View>

            {/* pictures grid */}
            {habitProgress.images.length > 0 ? ( // only display grid if progress exists
                <FlatList
                    style={{ marginTop: 30, marginBottom: 120, marginHorizontal: 10 }}
                    data={habitProgress.images}
                    keyExtractor={(item) => item.uri}
                    numColumns={numColumns} // dynamically renders images so they don't leave unnecessary whitespace
                    key={`image-list-${numColumns}`}
                    renderItem={({ item }) => (
                        <View style={styles.imageContainer}>
                            <TouchableOpacity onPress={() => openFullLog(item.uri, item.date, item.reflection, item.data)}>
                                {/* open log of image, with inputs, reflection, date, image when clicked */}
                                <Image source={{ uri: item.uri }} style={ styles.image } />
                            </TouchableOpacity>
                        </View>
                    )}
                />
            ) : ( // prompt user to log data if none exists
                <View>
                    <Text style={[styles.title, { color: "#000", margin: 50 }]}>
                        you haven't logged progress for this habit yet!
                    </Text>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, { marginBottom: "30%", marginHorizontal: 30 }]}
                            onPress={() => router.push(`/logProgress?habitRef=${habitRef}`)}
                        >
                            <Text style={styles.buttonText}>log progress</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* log details dialog */}
            {isDialogOpen && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={[styles.dialogBox, { position: "absolute", top: "-1%", height: "160%", width: "100%", backgroundColor: "#b7b7a4", borderRadius: 0 }]}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView contentContainerStyle={{ height: "100%" }}>
                            <Text style={styles.title2}>l o g   d e t a i l s</Text>
                            <View style={[styles.addHabitContainer, { height: "45%" }]}>
                                <Text style={[styles.title, { color: "#000" }]}>{selectedDate.replace(/-/g, '/')}</Text>
                                <Image source={{ uri: selectedImageUri }} style={{ marginBottom: 10, width: "100%", height: 150, borderRadius: 10 }} />
                                <Text style={[styles.labelText, { marginLeft: 2 }]}>{selectedReflection}</Text>
                                {selectedData!=null && (
                                    <Text style={[styles.labelText, { marginLeft: 2 }]}>you did this {selectedData} times.</Text>
                                )}
                                <TouchableOpacity style={[styles.cancelButton, { top: "35%" }]} onPress={() => setIsDialogOpen(false)}>
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
