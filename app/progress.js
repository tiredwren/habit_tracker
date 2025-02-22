import { useLocalSearchParams } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { SafeAreaView, View, Text, Image, FlatList, StyleSheet } from "react-native";
import { db } from "./firebaseConfig";
import styles from "../assets/styles/styles";

const ProgressPage = () => {
    const [habitProgress, setHabitProgress] = useState({ images: [], inputs: [] });
    const [numColumns, setNumColumns] = useState(3); // set initial number of columns

    const params = useLocalSearchParams();
    const habitRef = params.habitId;
    const userId = "user_id";

    useEffect(() => {
        const fetchProgress = async () => {
            console.log("fetching progress");
            setHabitProgress({ images: [], inputs: [] }); // reset state before fetching
            const progressRef = collection(db, "users", userId, "habits", habitRef, "progress");
            const querySnapshot = await getDocs(progressRef);
           
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
   
            // update state with lists of image uris and reflections
            setHabitProgress(prevState => ({
                ...prevState,
                images: images,
                inputs: reflections
            }));
        };
   
        if (habitRef) fetchProgress();
    }, [habitRef]);

    useEffect(() => {
        console.log(habitProgress); // logs updated habitProgress
    }, [habitProgress]);

    return (
        <SafeAreaView>
            <FlatList style={{marginTop: 30, marginHorizontal: 10}}
                data={habitProgress.images}
                keyExtractor={(item, index) => index.toString()}
                numColumns={numColumns} // usestate variable for columns
                key={`image-list-${numColumns}`} // for forcing re-render
                renderItem={({ item }) => (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: item }} style={styles.image} />
                    </View>
                )}
            />
        </SafeAreaView>
    );
}

export default ProgressPage;
