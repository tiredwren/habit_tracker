import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs, getDoc, query, orderBy, updateDoc, doc } from "firebase/firestore";
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

        const getProgress = async () => {
    if (!habitRef) return;

    const progressRef = collection(db, "users", userId, "habits", habitRef, "progress");
    const userRef = doc(db, "users", userId);
    const q = query(progressRef, orderBy("date", "desc"));

    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const progressData = querySnapshot.docs.map(doc => doc.data());
            const progressDates = progressData.map(entry => entry.date);
            setLastDate(progressDates[0]);

            // calculate streak
            let currentStreak = 0;
            let today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i < progressDates.length; i++) {
                let progressDate = new Date(progressDates[i]);
                progressDate.setHours(0, 0, 0, 0);
                let difference = (today - progressDate) / (1000 * 60 * 60 * 24);
                if (difference === currentStreak || difference === currentStreak + 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }

            // get user's last currency update date
            const userDoc = await getDoc(userRef);
            const lastCurrencyUpdate = userDoc.data().lastCurrencyUpdate ? new Date(userDoc.data().lastCurrencyUpdate) : null;

            // update currency if streak reaches 1 day and it's a new day
            if (currentStreak >= goal && (!lastCurrencyUpdate || today > lastCurrencyUpdate)) {
                await updateDoc(userRef, {
                    currency: increment(5), // increase currency by 5
                    lastCurrencyUpdate: today, // change last currency update date
                });
                setCurrency(prev => prev + 5); // change local currency state
                currentStreak = 0; // reset streak after earning currency
            }

            // update streak goal
            if (currentStreak > 0) {
                setStreak(currentStreak);
                const newGoal = 5 * (Math.floor(currentStreak / 1) + 1); // update goal based on current streak
                console.log(`new goal: ${newGoal}`); // for debugging
                setGoal(newGoal)
            } else {
                setStreak(0);
            }

            // get images, reflections, and graph data
            const images = [];
            const reflections = [];
            const Gdata = [];

            querySnapshot.forEach((doc) => {
                const foundData = doc.data();
                if (foundData.image) {
                    images.push({ id: doc.id, uri: foundData.image, reflection: foundData.reflection, date: foundData.date || "" });
                }

                // getting the graph data
                if (foundData.numericInput && foundData.date) {
                    Gdata.push({ x: foundData.date, y: Number(foundData.numericInput) });
                }

                reflections.push(foundData.reflection);
            });

            setHabitProgress({ images, inputs: reflections, graphData: Gdata });
        } else {
            setStreak(0);
        }
    } catch (error) {
        console.error("error getting progress:", error);
    }
};

        // get total currency to display
        const getCurrency = async () => {
            if (userId) {
                const userDoc = await getDoc(doc(db, "users", userId));
                if (userDoc.exists()) {
                    setCurrency(userDoc.data().currency || 0); // get total user currency
                }
            }
        };

        getProgress();
        getCurrency(); // get currency when component mounts
    }, [habitRef]);

    const openFullLog = (image, date, reflection) => {
        setIsDialogOpen(true);
        setSelectedImageUri(image);
        setSelectedDate(date);
        setSelectedReflection(reflection);
    };

    return (
        <SafeAreaView style={{ backgroundColor: "#b7b7a4", height: "100%" }}>
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
            <View style={{marginHorizontal: 10}}>
            {habitProgress.graphData.length > 0 ? (
                <LineChart
                    data={{
                        labels: ["Start", ...habitProgress.graphData.map(data => new Date(data.x).toLocaleDateString())],
                        datasets: [
                            {
                                data: [0, ...habitProgress.graphData.map(data => data.y)],
                            },
                        ],
                    }}
                    width={Dimensions.get("window").width - 20} // from react-native
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    yAxisInterval={1} // optional, defaults to 1
                    chartConfig={{
                        backgroundColor: '#d4a373',
                        backgroundGradientFrom: '#d4a373',
                        backgroundGradientTo: '#d4a373',
                        decimalPlaces: 2, // optional, defaults to 2
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
            {habitProgress.images.length > 0 ? (
                <FlatList
                    style={{ marginTop: 30, marginHorizontal: 10 }}
                    data={habitProgress.images}
                    keyExtractor={(item) => item.uri}
                    numColumns={numColumns}
                    key={`image-list-${numColumns}`}
                    renderItem={({ item }) => (
                        <View style={styles.imageContainer}>
                            <TouchableOpacity onPress={() => openFullLog(item.uri, item.date, item.reflection)}>
                                <Image source={{ uri: item.uri }} style={styles.image} />
                            </TouchableOpacity>
                        </View>
                    )}
                />
            ) : (
                <View>
                    <Text style={[styles.title, { color: "#000", margin: 50 }]}>
                        you haven't logged progress for this habit yet!
                    </Text>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, { marginBottom: "30%", marginHorizontal: 30 }]}
                            onPress={() => router.push(`/log?habitRef=${habitRef}`)}
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
                    style={[styles.dialogBox, { position: "absolute", top: "-1%", height: "200%", width: "100%", backgroundColor: "#b7b7a4", borderRadius: 0 }]}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView contentContainerStyle={{ height: "100%" }}>
                            <Text style={styles.title2}>l o g   d e t a i l s</Text>
                            <View style={[styles.addHabitContainer, { height: "45%" }]}>
                                <Text style={[styles.title, { color: "#000" }]}>{selectedDate.replace(/-/g, '/')}</Text>
                                <Image source={{ uri: selectedImageUri }} style={{ marginBottom: 10, width: "100%", height: 150, borderRadius: 10 }} />
                                <Text style={[styles.labelText, { marginLeft: 2 }]}>{selectedReflection}</Text>
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
