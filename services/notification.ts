import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';
import { candyStore } from '../store/candyStore';
import { RoutineTaskService } from './routineTaskService';

export const setupNotificationHandler = async () => {
  // 1. Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    } as Notifications.NotificationBehavior),
  });

  // 2. Request permissions
  await registerForPushNotificationsAsync();

  // 3. Set Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
};

export const scheduleNotificationsForRoutineTasks = async () => {
  const routineTasks = await RoutineTaskService.getFilteredRoutineTasks(
    candyStore.getState().routineTasks
  );

  // Cancel all previously scheduled notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const task of routineTasks) {
    if (task.isDone) {
      continue; // Skip completed tasks
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Routine Task Reminder",
          body: task.label,
          data: { taskId: task.id },
        },
        trigger: { type: SchedulableTriggerInputTypes.CALENDAR, hour: 8, minute: 0, repeats: true },
      });
      console.log(`Notification scheduled for task: ${task.label}`);
    } catch (error) {
      console.error(`Failed to schedule notification for task: ${task.label}`, error);
    }
  }
};

export async function registerForPushNotificationsAsync() {
  let token;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log(token);

  return token;
}