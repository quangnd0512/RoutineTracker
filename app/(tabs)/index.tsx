import ProgressCircle from "@/components/CircleProgress";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import log from "@/services/logger";
import { RoutineTaskService } from "@/services/routineTaskService";
import { useFocusEffect } from "expo-router";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Calendar } from "react-native-calendars";
import { BarChart, LineChart } from "react-native-gifted-charts";
import { useMoodStore } from "@/store/moodStore";

const MonthlyCalendar = () => {
  const [markFinishedDates, setMarkFinishedDates] = useState<string[]>([]);

  async function fetchFinishedDates(onDate: Date | null = null) {
    let markDate = new Date();
    if (onDate) {
      markDate = onDate;
    }

    const datesToFetch: Date[] = [];
    for (let i = 1; i <= 31; i++) {
      const date = new Date(markDate);
      date.setDate(i);
      datesToFetch.push(date);
    }

    const results = await RoutineTaskService.getFinishedRoutineTasksForDates(
      datesToFetch,
    );
    const finishedDates = results
      .map((res, index) => {
        if (res.length > 0) {
          const date = new Date(markDate);
          date.setDate(index + 1);
          return date.toISOString().split("T")[0];
        }
        return null;
      })
      .filter((date) => date !== null);

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
    <StatsView
      title="Calendar Stats"
      data={{
        markFinishedDates,
        onMonthChange: (month) => fetchFinishedDates(month),
      }}
      type="progress_calendar"
    />
  );
};

const WeeklyChart = () => {
  const [taskCounts, setTaskCounts] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  async function fetchTasks() {
    const _now = new Date();
    let weekDay = _now.getDay(); // 0 (Sun) to 6 (Sat)
    if (weekDay === 0) weekDay = 7; // Make Sunday the last day

    const datesToFetch: Date[] = [];

    for (let i = 1; i <= weekDay; i++) {
      const atDate = new Date(_now);
      atDate.setDate(_now.getDate() - weekDay + i);

      datesToFetch.push(atDate);
    }

    const results = await RoutineTaskService.getFinishedRoutineTasksForDates(
      datesToFetch,
    );
    const counts = results.map((res) => res.length);

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

  return <StatsView title="Tasks Completed" data={{ taskCounts }} type="bar" />;
};

const MoodChart = () => {
  const moodLogs = useMoodStore((state) => state.moodLogs);
  const { width } = useWindowDimensions();

  const lineData = useMemo(() => {
    const _now = new Date();
    const currentDay = _now.getDay() === 0 ? 7 : _now.getDay(); // 1-7 (Mon-Sun)

    const data = [];
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Calculate start of week (Monday)
    const startOfWeek = new Date(_now);
    startOfWeek.setDate(_now.getDate() - currentDay + 1);

    for (let i = 0; i < 7; i++) {
      const atDate = new Date(startOfWeek);
      atDate.setDate(startOfWeek.getDate() + i);
      const dateStr = `${atDate.getFullYear()}-${String(
        atDate.getMonth() + 1,
      ).padStart(2, "0")}-${String(atDate.getDate()).padStart(2, "0")}`;
      
      const log = moodLogs.find((l) => l.date === dateStr);
      const dayLabel = dayLabels[i];

      if (log) {
        data.push({
          value: 4 - log.moodIndex + 1, // Invert: Great(0)->5, Bad(4)->1
          label: dayLabel,
          labelTextStyle: { color: "gray" },
          dataPointText: "",
        });
      } else {
        // For future days or days with no data
        data.push({
          value: 1,
          label: dayLabel,
          labelTextStyle: { color: "gray" },
          hideDataPoint: true,
          customDataPoint: () => null,
        });
      }
    }

    return data;
  }, [moodLogs]);

  // Calculate spacing to fit 7 points exactly in the width
  // Total width available = Screen Width - Padding (e.g. 40 or 60)
  // We have 7 points, so 6 intervals.
  const chartWidth = width - 60;
  const spacing = chartWidth / 7;

  return (
    <StatsView
      title="Mood Chart"
      data={{ lineData, spacing, width: chartWidth }}
      type="line"
    />
  );
};

interface StatsViewProps {
  title: string;
  data: {
    taskCounts?: number[];
    markFinishedDates?: string[];
    lineData?: any[];
    onMonthChange?: (month: Date) => void;
    spacing?: number;
    width?: number;
  };
  type?: "bar" | "line" | "progress_calendar";
}

const StatsView = ({ title, data, type = "bar" }: StatsViewProps) => {
  let chartComponent = null;
  switch (type) {
    case "bar":
      chartComponent = (
        <View className="py-4">
          <BarChartView taskCounts={data.taskCounts ?? []} />
        </View>
      );
      break;

    case "line":
      chartComponent = (
        <View className="py-4">
          <MoodLineChart
            lineData={data.lineData ?? []}
            spacing={data.spacing}
            width={data.width}
          />
        </View>
      );
      break;

    case "progress_calendar":
      chartComponent = (
        <View className="pb-2">
          <CalendarView
            markFinishedDates={data.markFinishedDates ?? []}
            onMonthChange={data.onMonthChange}
          />
        </View>
      );
      break;

    default:
      break;
  }

  let filterText = "This Week";
  if (type === "progress_calendar") {
    filterText = "This Month";
  }

  return (
    <>
      <View className="flex-1 mb-5 mt-3 px-2">
        <View className="bg-white rounded-lg">
          <View className="px-3">
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
          <View>{chartComponent}</View>
        </View>
      </View>
    </>
  );
};

const MoodLineChart = ({
  lineData,
  spacing = 40,
  width = 300,
}: {
  lineData: any[];
  spacing?: number;
  width?: number;
}) => {
  // Emojis: ["😎", "😊", "😐", "😢", "😡"]
  // Indices: 0, 1, 2, 3, 4
  // Values: 4, 3, 2, 1, 0
  // Y-Axis Labels should be mapped from value.
  // 0 -> 😡 (index 4)
  // 1 -> 😢 (index 3)
  // 2 -> 😐 (index 2)
  // 3 -> 😊 (index 1)
  // 4 -> 😎 (index 0)
  // console.log("MoodLineChart data:", lineData);
  const yAxisLabelTexts = [" ", "😡", "😢", "😐", "😊", "😎"];

  return (
    <View style={{ borderRadius: 10, overflow: "hidden" }} className="py-3">
      <LineChart
        data={lineData}
        areaChart
        curved
        // isAnimated
        // animationDuration={1200}
        startFillColor="#8985e8"
        startOpacity={0.2}
        endFillColor="#ffffff"
        endOpacity={0.1}
        color="#8985e8"
        thickness={3}
        dataPointsColor="#8985e8"
        dataPointsRadius={6}
        dataPointsColor2="#8985e8"
        textFontSize={10}
        hideRules
        yAxisLabelTexts={yAxisLabelTexts}
        yAxisOffset={0}
        maxValue={5}
        stepValue={1}
        noOfSections={4}
        yAxisTextStyle={{ fontSize: 24 }} // Make emojis visible
        width={width} // Adjust as needed
        spacing={spacing} // Adjust spacing
        initialSpacing={20}
        backgroundColor="transparent"
      />
    </View>
  );
};

const BarChartView = ({ taskCounts }: { taskCounts: number[] }) => {
  const [pressedBarIndex, setPressedBarIndex] = useState(-1);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const { width } = useWindowDimensions();
  const initialSpacing = 10;
  const barWidth =
    ((width * 0.85 - initialSpacing) * 3) / (taskCounts.length * 4);
  const spacing = barWidth / 3;

  const barData = taskCounts.map((count, index) => {
    return {
      value: count,
      frontColor: index === pressedBarIndex ? "#8985e8" : "#c5c4f4",
      label: labels[index],
      labelTextStyle: { color: "gray" },
      topLabelComponent: () => {
        if (index === pressedBarIndex) {
          return (
            <View className="items-center mb-[10px]">
              <View
                className="items-center justify-center rounded-full bg-[#8985e8]"
                style={{
                  width: barWidth * 1.2,
                  height: barWidth * 1.2,
                }}
              >
                <View
                  className="items-center justify-center rounded-full bg-white"
                  style={{
                    width: barWidth * 1.0,
                    height: barWidth * 1.0,
                  }}
                >
                  <Text className="text-[14px] font-bold">{count}</Text>
                  <Text className="text-[6px]">tasks</Text>
                </View>
              </View>
              <View
                className="w-2.5 h-2.5 bg-[#8985e8]"
                style={{
                  transform: [{ rotate: "45deg" }],
                  marginTop: -6,
                  zIndex: -1,
                }}
              />
            </View>
          );
        }
        return null;
      },
    };
  });

  return (
    <BarChart
      data={barData}
      frontColor="#177AD5"
      backgroundColor="transparent"
      yAxisThickness={0}
      xAxisThickness={0}
      initialSpacing={initialSpacing}
      spacing={spacing}
      barWidth={barWidth}
      noOfSections={3}
      maxValue={
        Math.max(...taskCounts) + 3 < 5 ? 5 : Math.max(...taskCounts) + 3
      }
      barBorderTopLeftRadius={barWidth / 2}
      barBorderTopRightRadius={barWidth / 2}
      yAxisTextStyle={{ color: "gray" }}
      rulesColor={"transparent"}
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
  );
};

interface CalendarViewProps {
  markFinishedDates: string[];
  onMonthChange?: (month: Date) => void;
}

const CalendarView = ({
  markFinishedDates,
  onMonthChange,
}: CalendarViewProps) => {
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
      theme={
        {
          "stylesheet.calendar.header": {
            dayTextAtIndex0: {
              color: "black",
            },
            dayTextAtIndex1: {
              color: "black",
            },
            dayTextAtIndex2: {
              color: "black",
            },
            dayTextAtIndex3: {
              color: "black",
            },
            dayTextAtIndex4: {
              color: "black",
            },
            dayTextAtIndex5: {
              color: "black",
            },
            dayTextAtIndex6: {
              color: "black",
            },
          },
          textMonthFontWeight: "bold",
          textDayFontWeight: "bold",
          dayTextColor: "black",
          textDayHeaderFontWeight: "bold",
        } as any
      }
      renderArrow={(direction) =>
        direction === "left" ? (
          <View style={{ transform: [{ translateX: -15 }] }}>
            <ChevronLeftIcon />
          </View>
        ) : (
          <View style={{ transform: [{ translateX: 15 }] }}>
            <ChevronRightIcon />
          </View>
        )
      }
      markedDates={markedDates}
      dayComponent={({ date, marking, state }) => {
        const isMarked = marking?.marked;
        return (
          <ProgressCircle
            progressPercent={isMarked ? 100 : 0}
            displayText={date?.day?.toString() ?? ""}
            textColor={state === "disabled" ? "lightgray" : "black"}
          />
        );
      }}
      onMonthChange={(month) => {
        onMonthChange && onMonthChange(new Date(month.dateString));
      }}
    />
  );
};

export default function HomeScreen() {
  return (
    <View className="flex-1">
      <ScrollView
        className="gap-2"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        <WeeklyChart />
        <MonthlyCalendar />
        <MoodChart />
      </ScrollView>
    </View>
  );
}
