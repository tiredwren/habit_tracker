import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Dimensions } from "react-native";
import auth from "@react-native-firebase/auth";
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
    const [numColumns, setNumColumns] = useState(3);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedImageUri, setSelectedImageUri] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedReflection, setSelectedReflection] = useState("");
    const [loading, setLoading] = useState(true); // New loading state

    const params = useLocalSearchParams();
    const habitRef = params.habitId;
    const router = useRouter();

    useEffect(() => {
        const user = auth().currentUser;

        if (!user) {
            console.log("user is not authenticated, redirecting to index...");
            return; // Exit if there is no user
        }

        const userId = user.email;

        const getProgress = async () => {
            setHabitProgress({ images: [], inputs: [], graphData: [] });
            setStreak(0);

            if (!habitRef) return;

            const progressRef = collection(db, "users", userId, "habits", habitRef, "progress");
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

                    setStreak(currentStreak);

                    // get images and reflections
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
                            Gdata.push({ x: foundData.date, y: Number(foundData.numericInput) }); // Updated
                        }

                        reflections.push(foundData.reflection);
                    });

                    setHabitProgress({ images, inputs: reflections, graphData: Gdata }); // Updated
                } else {
                    setStreak(0);
                }
            } catch (error) {
                console.error("error getting progress:", error);
            } finally {
                setLoading(false); // Set loading to false after data fetching is complete
            }
        };

        getProgress();
    }, [habitRef, router]);

    const openFullLog = (image, date, reflection) => {
        setIsDialogOpen(true);
        setSelectedImageUri(image);
        setSelectedDate(date);
        setSelectedReflection(reflection);
    };

    if (loading) {
        return <Text>Loading...</Text>; // Optional: Show a loading state while fetching data
    }

    return (
        <SafeAreaView style={{backgroundColor: "#b7b7a4", height: "100%", }}>
            {/* streak bar */}
            <View style={styles.streakContainer}>
                <Text style={[styles.labelText, { marginBottom: 0, marginLeft: 2, fontWeight: "bold" }]}>
                    {streak} / 30 day streak ✧.*
                </Text>
                <View style={styles.streakBar}>
                    <View style={{
                        width: `${(streak / 30) * 100}%`,
                        backgroundColor: '#d4a373',
                        height: '100%'
                    }} />
                </View>
            </View>

            {/* input graph */}
            {habitProgress.graphData.length > 0 ? (
                <LineChart
                    data={{
                        labels: habitProgress.graphData.map(data => new Date(data.x).toLocaleDateString()),
                        datasets: [
                            {
                                data: habitProgress.graphData.map(data => data.y),
                            },
                        ],
                    }}
                    width={Dimensions.get("window").width - 30} // from react-native
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
                                    <Text style={styles.buttonText}>close</Text>
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
