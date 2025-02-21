import { router, useRouter } from "expo-router"; 
import { useEffect, useState } from "react"; 
import { SafeAreaView, Dimensions, View, Text, TextInput, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from "react-native"; 
import * as ImagePicker from "expo-image-picker"; 
import { db } from "./firebaseConfig"; 
import { doc, setDoc, getDoc } from "firebase/firestore"; 
import styles from "../assets/styles/styles"; 
import { useLocalSearchParams } from "expo-router/build/hooks"; 
 
const LogProgress = () => { 
    const [newProgress, setProgressLog] = useState({ reflection: "", image: null }); 
    const userId = "user_id";  
    const { width } = Dimensions.get('window'); 
    const router = useRouter(); 
    const params = useLocalSearchParams(); 
    const habitRef = params.habitRef;  
 
    const handleInputChange = (field, value) => { 
        setProgressLog({ ...newProgress, [field]: value }); 
    }; 
 
    const handleImageUpload = async () => { 
        let result = await ImagePicker.launchImageLibraryAsync({ 
            mediaTypes: ImagePicker.MediaTypeOptions.Images, 
            allowsEditing: true, 
            aspect: [4, 3], 
            quality: 1, 
        }); 
 
        if (!result.canceled) { 
            setProgressLog({ ...newProgress, image: result.assets[0].uri }); 
        } 
    }; 
 
    const saveProgressLog = async () => { 
        if (newProgress.reflection && newProgress.image) { 
            try { 
                const currentDate = new Date().toISOString().split("T")[0]; // e.g., "2025-02-20"
                const progressRef = doc(db, "users", userId, "habits", habitRef, "progress", currentDate);

                await setDoc(progressRef, { 
                    date: currentDate, 
                    reflection: newProgress.reflection, 
                    image: newProgress.image, 
                }, { merge: true }); // Merge prevents overwriting old fields

                // Clear inputs
                setProgressLog({ reflection: "", image: null }); 
            } catch (error) { 
                alert("error saving progress: " + error.message); 
            } 
        } else { 
            alert("make sure you've filled all the fields!"); 
        } 
    }; 
 
    useEffect(() => { 
        const fetchDayLog = async () => { 
            setProgressLog({ reflection: "", image: null }); // Reset state before fetching
            
            const currentDate = new Date().toISOString().split("T")[0]; 
            const progressRef = doc(db, "users", userId, "habits", habitRef, "progress", currentDate);
            console.log("Fetching for habitRef:", habitRef);
            
            const docSnap = await getDoc(progressRef);
            if (docSnap.exists()) { 
                const fetchedDayLog = docSnap.data();
                setProgressLog({ 
                    reflection: fetchedDayLog.reflection || "", 
                    image: fetchedDayLog.image || null, 
                }); 
            }
        }; 
    
        if (habitRef) fetchDayLog(); 
    }, [habitRef]); 
     
     
    return ( 
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", width: width }}> 
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"} 
                style={[styles.dialogBox, { position: "absolute", top: "0%", height: "100%", width: "100%", padding: 20 }]} 
            > 
                <Text style={[styles.title2, {color: "#b7b7a4"}]}>l o g   p r o g r e s s</Text> 
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}> 
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }}> 
                        <View style={styles.addHabitContainer}> 
                            {newProgress.image && ( 
                                <Image 
                                    source={{ uri: newProgress.image }} 
                                    style={{ marginBottom: 10, width: "100%", height: 150, borderRadius: 10 }} 
                                /> 
                            )} 
                            <View style={styles.buttonContainer}> 
                                <TouchableOpacity style={styles.button} onPress={handleImageUpload}> 
                                    <Text style={styles.buttonText}>upload image</Text> 
                                </TouchableOpacity> 
                            </View> 
                            <Text style={[styles.labelText, { marginBottom: 10, marginTop: 20 }]}>reflection</Text> 
                            <TextInput  
                                multiline={true} 
                                value={newProgress.reflection} 
                                onChangeText={(text) => handleInputChange("reflection", text)} 
                                style={[styles.input, { color: "#000", minHeight: 200, textAlignVertical: "top" }]} 
                            /> 
                            <View style={{ flex: 1, justifyContent: "flex-end", marginTop: 150 }}> 
                                <View style={styles.buttonContainer2}> 
                                    <TouchableOpacity style={styles.saveButton} onPress={saveProgressLog}> 
                                        <Text style={styles.buttonText}>save</Text> 
                                    </TouchableOpacity> 
                                    <TouchableOpacity style={styles.cancelButton} onPress={() => router.push(`/index`)}> 
                                        <Text style={styles.buttonText}>cancel</Text> 
                                    </TouchableOpacity> 
                                </View> 
                            </View> 
                        </View> 
                    </ScrollView> 
                </TouchableWithoutFeedback> 
            </KeyboardAvoidingView> 
        </SafeAreaView> 
    ); 
} 
 
export default LogProgress;
