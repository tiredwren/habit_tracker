import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import notifee from '@notifee/react-native';
import { useEffect } from 'react';
import { Alert } from 'react-native';

const FirebaseMessaging = ({ userId }) => {
  useEffect(() => {
    requestPermission();
    getToken();
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      displayNotification(remoteMessage.notification);
    });
    return unsubscribe;
  }, []);

  const requestPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (!enabled) {
      Alert.alert('permission denied', 'enable notifications in settings.');
    }
  };

  const getToken = async () => {
    const token = await messaging().getToken();
    console.log('firebase cloud message token:', token);
  };

  const displayNotification = async (notification) => {
    await notifee.createChannel({
      id: 'habit_reminders',
      name: 'habit reminder',
    });
    await notifee.displayNotification({
      title: notification.title,
      body: notification.body,
      android: {
        channelId: 'habit_reminders',
      },
    });
  };

  const scheduleNotifications = async () => { // method to schedule notifications based on
    // habit frequency
    const habitsRef = firestore().collection('users').doc(userId).collection('habits');
    const snapshot = await habitsRef.get();
    snapshot.forEach(doc => {
      const habit = doc.data();
      scheduleHabitNotification(doc.id, habit.frequency); // habit id gets notifications
      // scheduled based on frequency in firestore database 
    });
  };

  const scheduleHabitNotification = async (habitId, frequency) => {
    const repeatInterval = 'day'; // default to daily (because frequency defaults to daily)
    // making frequencies in firebase match with cloud messaging keys
    if (frequency === 'daily') repeatInterval = 'day'; 
    else if (frequency === 'weekly') repeatInterval = 'week';
    else if (frequency === 'monthly') repeatInterval = 'month';

    if (repeatInterval) {
      await notifee.createTriggerNotification(
        {
          title: 'habit reminder',
          body: "it's time to complete your habit!",
          android: {
            channelId: 'habit_reminders',
          },
        },
        {
          type: repeatInterval,
          repeatFrequency: repeatInterval,
        }
      );
    }
  };

  useEffect(() => {
    scheduleNotifications();
  }, [userId]);

  return null;
};

export default FirebaseMessaging;
