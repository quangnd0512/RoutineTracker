import ProgressCircle from "@/components/CircleProgress";
import CircleCheckIcon from "@/components/icons/CircleCheckIcon";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import log from "@/services/logger";
import { RoutineTaskService } from "@/services/routineTaskService";
import { useFocusEffect } from "expo-router";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
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
    <StatsView title="Calendar Stats" data={{ markFinishedDates, onMonthChange: (month) => fetchFinishedDates(month) }} type="progress_calendar" />
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
    <StatsView title="Tasks Completed" data={{ taskCounts }} type="bar" />
  )
}

interface StatsViewProps {
  title: string;
  data: { taskCounts?: number[], markFinishedDates?: string[], onMonthChange?: (month: Date) => void };
  type?: 'bar' | 'line' | 'progress_calendar';
}

const StatsView = ({ title, data, type = 'bar' }: StatsViewProps) => {
  let chartComponent = null;
  switch (type) {
    case 'bar':
      chartComponent = <View className="py-4"><BarChartView taskCounts={data.taskCounts ?? []} /></View>;
      break;

    case 'line':
      chartComponent = <Text>Coming soon...</Text>;
      break;

    case 'progress_calendar':
      chartComponent = <CalendarView markFinishedDates={data.markFinishedDates ?? []} onMonthChange={data.onMonthChange} />;
      break;

    default:
      break;
  }

  let filterText = "This Week";
  if (type === 'progress_calendar') {
    filterText = "This Month";
  }

  return (
    <>
      <View className="flex-1 mb-5 mt-3 px-2">
        <View className="bg-white rounded-lg">
          <View className="px-2">
            <View className="flex-row items-center justify-between py-3">
              <View className="py-4">
                <Heading>{title}</Heading>
              </View>

              <Center className="h-8 px-2 py-0 flex-row gap-1 rounded-full border border-r-2 border-gray-300">
                <Text className="text-[9px] font-bold">{filterText}</Text>
                <Icon as={ChevronDownIcon} size="sm" color="gray" />
              </Center>
            </View>
            <Divider className="bg-gray-100" />
          </View>
          <View>
            {chartComponent}
          </View>
        </View>
      </View>
    </>
  );
}

const BarChartView = ({ taskCounts }: { taskCounts: number[] }) => {
  const [pressedBarIndex, setPressedBarIndex] = useState(-1);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const barData = taskCounts.map((count, index) => {
    return {
      value: count,
      frontColor: index === pressedBarIndex ? '#8985e8' : '#c5c4f4',
      label: labels[index],
      labelTextStyle: { color: 'gray' },
      topLabelComponent: () => {
        if (index === pressedBarIndex) {
          return (
            <View className="items-center mb-[10px]">
              <View
                className="items-center justify-center w-12 h-12 rounded-full bg-[#8985e8]"
              >
                <View className="items-center justify-center w-10 h-10 rounded-full bg-white">
                  <Text className="text-[14px] font-bold">{count}</Text>
                  <Text className="text-[6px]">tasks</Text>
                </View>
              </View>
              <View
                className="w-2.5 h-2.5 bg-[#8985e8]"
                style={{
                  transform: [{ rotate: '45deg' }],
                  marginTop: -6,
                  zIndex: -1,
                }}
              />
            </View>
          );
        }
        return null;
      },
    }
  });

  return (
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
      rulesColor={'transparent'}
      onPress={(item: any, index: number) => {
        if (taskCounts[index] === 0) {
          return;
        }
        if (pressedBarIndex === index) {
          setPressedBarIndex(-1);
        } else {
          setPressedBarIndex(index);
        }
      }}
      onBackgroundPress={() => setPressedBarIndex(-1)}
    />
  )
}


interface CalendarViewProps {
  markFinishedDates: string[];
  onMonthChange?: (month: Date) => void;
}

const CalendarView = ({ markFinishedDates, onMonthChange }: CalendarViewProps) => {
  const [onDate, setOnDate] = useState(new Date());

  const markedDates: { [date: string]: { marked: boolean } } = {
    // '2025-08-27': { marked: true },
    // '2025-08-28': { marked: true }
  };
  for (const date of markFinishedDates) {
    markedDates[date] = { marked: true };
  }

  return (
    <Calendar
      className="rounded-lg"
      theme={{
        textMonthFontWeight: 'bold',
        textDayFontWeight: 'bold',
        dayTextColor: 'black',
      }}
      // headerStyle={{
      //   backgroundColor: '#f6f6f6',
      // }}
      renderArrow={(direction) =>
        direction === 'left' ? <View style={{ transform: [{ translateX: -10 }] }}><ChevronLeftIcon /></View> : <View style={{ transform: [{ translateX: 10 }] }}><ChevronRightIcon /></View>
      }
      markedDates={markedDates}
      dayComponent={({ date, marking, state }) => {
        const isMarked = marking?.marked;
        return (
          <ProgressCircle
            progressPercent={isMarked ? 100 : 0}
            displayText={date?.day?.toString() ?? ""}
            textColor={state === 'disabled' ? 'lightgray' : 'black'}
          />
        );
      }}
      onMonthChange={(month) => {
        onMonthChange && onMonthChange(new Date(month.dateString));
        setOnDate(new Date(month.dateString));
      }}
    />
  )
}


export default function HomeScreen() {
  return (
    <View className="flex-1">
      <ScrollView className="gap-2" showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
        <WeeklyChart />
        <MonthlyCalendar />
      </ScrollView>
    </View>
  );
}