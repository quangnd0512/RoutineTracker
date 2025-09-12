import CircleCheckIcon from "@/components/icons/CircleCheckIcon";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import log from "@/services/logger";
import { RoutineTaskService } from "@/services/routineTaskService";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { BarChart } from "react-native-gifted-charts";


const MonthlyCalendar = () => {
  const [markFinishedDates, setMarkFinishedDates] = useState<string[]>([])

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

  return (
    <BarChartView taskCounts={taskCounts} />
  )
}

const BarChartView = ({ taskCounts }: { taskCounts: number[] }) => {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const barData = taskCounts.map((count, index) => {
    return {
      value: count,
      frontColor: '#c5c4f4',
      label: labels[index],
      labelTextStyle: { color: 'gray' }
    }
  });

  return (
    <View className="flex-1 mb-5 mt-3 px-2">
      <View className="bg-white rounded-lg">
        <View className="px-2">
          <View className="py-4">
            <Heading>Tasks Completed</Heading>
          </View>
          <Divider className="bg-gray-100" />
        </View>
        <View className="items-center justify-center py-4">
          <BarChart
            data={barData}
            frontColor="#177AD5"
            backgroundColor="transparent"
            yAxisThickness={0}
            xAxisThickness={0}
            spacing={10}
            noOfSections={5}
            barBorderTopLeftRadius={15}
            barBorderTopRightRadius={15}
            yAxisTextStyle={{ color: 'gray' }}
          />
        </View>
      </View>
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