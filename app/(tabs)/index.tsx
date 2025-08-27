import CircleCheckIcon from "@/components/icons/CircleCheckIcon";
import log from "@/services/logger";
import { RoutineTaskService } from "@/services/routineTaskService";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { LineChart } from "react-native-chart-kit";


const MonthlyCalendar = () => {
  const [markFinishedDates, setMarkFinishedDates ] = useState<string[]>([])

  async function fetchFinishedDates(onDate: Date | null = null) {
    let markDate = new Date();
    if (onDate) {
      markDate = onDate;
    }

    const TaskDates = [];
    for (let i = 1; i <= 31; i++) {
      const date = new Date(markDate);
      date.setDate(i);
      TaskDates.push(RoutineTaskService.getFinishedRoutineTasks(date));
    }

    const results = await Promise.all(TaskDates);
    const finishedDates = results.map((res, index) => {
      if (res.length > 0) {
        const date = new Date(markDate);
        date.setDate(index + 1);
        return date.toISOString().split("T")[0];
      }
      return null;
    }).filter(date => date !== null);

    setMarkFinishedDates(finishedDates);
  }

  const memoizedFetchFinishedDates = useCallback(() => {
    fetchFinishedDates();

    return () => {
      setMarkFinishedDates([]);
    };
  }, []);

  useFocusEffect(memoizedFetchFinishedDates);

  const markedDates: { [date: string]: { marked: boolean } } = {
    // '2025-08-27': { marked: true },
    // '2025-08-28': { marked: true }
  };
  for (const date of markFinishedDates) {
    markedDates[date] = { marked: true };
  }

  return (
    <View className="px-3">
      <View className="items-center justify-center my-3">
        <Text className="font-bold">Monthly Activity</Text>
      </View>
      <Calendar
        className="rounded-lg"
        markedDates={markedDates}
        dayComponent={({ date, marking, state }) => {
          const isMarked = marking?.marked;
          return (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: state === 'disabled' ? 'gray' : 'black' }}>
                {date?.day}
              </Text>
              {isMarked && (
                <View className="absolute top-0 right-0">
                  <CircleCheckIcon />
                </View>
              )}
            </View>
          );
        }}
        onMonthChange={(month) => {
          fetchFinishedDates(new Date(month.dateString));
        }}
      />
    </View>
  );
};

const WeeklyChart = () => {
  const [taskCounts, setTaskCounts] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  
  async function fetchTasks() {
    const _now = new Date();
    let weekDay = _now.getDay(); // 0 (Sun) to 6 (Sat)
    if (weekDay === 0) weekDay = 7; // Make Sunday the last day

    const tasks = [];

    for (let i = 1; i <= weekDay; i++) {
      const atDate = new Date(_now);
      atDate.setDate(_now.getDate() - weekDay + i);

      tasks.push(
        RoutineTaskService.getFinishedRoutineTasks(atDate)
      );
    }

    const results = await Promise.all(tasks);
    const counts = results.map(res => res.length);

    while (counts.length < 7) {
      counts.push(0);
    }

    log.info(`[HomeScreen] Weekly task counts: ${counts}`);
    setTaskCounts(counts);
  }

  const memoizedFetchTasks = useCallback(() => {
    fetchTasks();

    return () => {
      setTaskCounts([0, 0, 0, 0, 0, 0, 0]);
    };
  }, []);

  useFocusEffect(memoizedFetchTasks);

  // Sample data for the line chart
  const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: taskCounts,
      },
    ],
  };

  return (
    <View className="items-center justify-center mb-5 mt-3">
      <Text className="font-bold my-3">Weekly Activity</Text>
      <LineChart
        data={data}
        width={Dimensions.get("window").width - 20} // from react-native
        height={220}
        yAxisInterval={1} // optional, defaults to 1
        chartConfig={{
          backgroundColor: "black",
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          decimalPlaces: 0, // optional, defaults to 2dp
          color: (opacity = 1) => `rgba(174, 227, 253, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          barPercentage: 1,
          // propsForDots: {
          //   r: "6",
          //   strokeWidth: "2",
          //   stroke: "#ffa726",
          // },
        }}
        style={{
          backgroundColor: "black",
          borderRadius: 5
        }}
      />
    </View>
  )
}


export default function HomeScreen() {
  return (
    <>
      <WeeklyChart />
      <MonthlyCalendar />
    </>
  );
}