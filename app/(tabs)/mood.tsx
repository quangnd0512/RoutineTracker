import React, { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Pressable } from "@/components/ui/pressable";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from "lucide-react-native";
import { Emojis } from "@/constants/Moods";
import { useMoodStore } from "@/store/moodStore";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Button, ButtonText } from "@/components/ui/button";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MOOD_LABELS = ["Great", "Good", "Okay", "Not Good", "Bad"];
const MOOD_COLORS = ["#D1FAE5", "#E0F2FE", "#F3F4F6", "#FEF3C7", "#FEE2E2"]; // Soft backgrounds for moods

export default function MoodScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showActionsheet, setShowActionsheet] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMoodIndex, setSelectedMoodIndex] = useState<number | null>(null);

  const { getMoodLog, addMoodLog } = useMoodStore();

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    // 0 = Sunday, 1 = Monday, ...
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleString("default", { month: "long", year: "numeric" });
  };

  const handleDayPress = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    const log = getMoodLog(dateStr);
    setSelectedDate(dateStr);
    setSelectedMoodIndex(log ? log.moodIndex : null);
    setShowActionsheet(true);
  };

  const handleSaveMood = () => {
    if (selectedMoodIndex !== null && selectedDate) {
      addMoodLog({
        date: selectedDate,
        moodIndex: selectedMoodIndex,
      });
      setShowActionsheet(false);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const startOffset = (firstDay + 6) % 7;

    const cells = [];

    // Empty cells
    for (let i = 0; i < startOffset; i++) {
      cells.push(
        <Box key={`empty-${i}`} className="w-[14.28%] aspect-square" />,
      );
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const log = getMoodLog(dateStr);
      const isToday = dateStr === new Date().toISOString().split("T")[0];

      cells.push(
        <Pressable
          key={`day-${day}`}
          onPress={() => isToday ? handleDayPress(day): {}}
          className="w-[14.28%] aspect-square items-center justify-center mb-2"
        >
          <VStack className="items-center justify-center w-full h-full">
            <View
              style={[
                { width: 40, height: 40, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
                { backgroundColor: log ? MOOD_COLORS[log.moodIndex] : (isToday ? "#8882E7" : "#F9FAFB") },
                isToday && !log ? styles.shadowSm : {}
              ]}
            >
              {log ? (
                <Text className="text-2xl leading-none">
                  {Emojis[log.moodIndex]}
                </Text>
              ) : isToday ? (
                <Icon as={PlusIcon} size="md" className="text-white" />
              ) : (
                <Text className="text-sm font-medium text-gray-400">{day}</Text>
              )}
            </View>
            
            {(log || isToday) && (
              <Text 
                size="xs" 
                className={`text-[10px] font-medium ${isToday ? "text-[#8882E7] font-bold" : "text-gray-400"}`}
              >
                {day}
              </Text>
            )}
          </VStack>
        </Pressable>,
      );
    }

    return cells;
  };

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      <Box className="p-6 bg-white min-h-full pb-20">
        <HStack className="items-center justify-between mb-8 mt-4">
          <Pressable 
            onPress={handlePrevMonth} 
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 border border-gray-100"
          >
            <Icon as={ChevronLeftIcon} size="lg" className="text-gray-600" />
          </Pressable>
          <Text size="2xl" className="font-bold text-gray-900 tracking-tight">
            {formatMonthYear(currentDate)}
          </Text>
          <Pressable 
            onPress={handleNextMonth} 
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 border border-gray-100"
          >
            <Icon as={ChevronRightIcon} size="lg" className="text-gray-600" />
          </Pressable>
        </HStack>

        <HStack className="mb-4 border-b border-gray-100 pb-2">
          {DAYS_OF_WEEK.map((day) => (
            <Box key={day} className="w-[14.28%] items-center">
              <Text size="xs" className="font-bold text-gray-400 uppercase tracking-wider">
                {day}
              </Text>
            </Box>
          ))}
        </HStack>

        <Box className="flex-row flex-wrap">{renderCalendar()}</Box>

        <Actionsheet
          isOpen={showActionsheet}
          onClose={() => setShowActionsheet(false)}
        >
          <ActionsheetBackdrop />
          <ActionsheetContent className="pb-8 rounded-t-[32px]">
            <ActionsheetDragIndicatorWrapper>
              <ActionsheetDragIndicator />
            </ActionsheetDragIndicatorWrapper>
            
            <Text size="xl" className="font-bold mb-8 mt-4 text-center text-gray-900">
              How are you feeling?
            </Text>

            <HStack className="justify-between w-full px-4 mb-10">
              {MOOD_LABELS.map((label, index) => (
                <Pressable
                  key={index}
                  onPress={() => setSelectedMoodIndex(index)}
                  className="items-center gap-2"
                >
                  <View
                    style={[
                      { width: 45, height: 45, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
                      selectedMoodIndex === index 
                        ? { backgroundColor: "#8882E7", transform: [{ scale: 1.1 }] } 
                        : { backgroundColor: MOOD_COLORS[index] || "#F9FAFB" },
                      selectedMoodIndex === index ? styles.shadowLg : {}
                    ]}
                  >
                    <Text className="text-3xl">{Emojis[index]}</Text>
                  </View>
                  <Text
                    size="xs"
                    className={`font-medium ${
                      selectedMoodIndex === index
                        ? "text-[#8882E7] font-bold"
                        : "text-gray-500"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </HStack>

            <View style={[styles.shadowMd, { width: '100%', borderRadius: 16 }]}>
                <Button
                className="w-full rounded-2xl h-14 bg-[#8882E7] active:opacity-90"
                onPress={handleSaveMood}
                isDisabled={selectedMoodIndex === null}
                >
                <ButtonText className="text-white font-bold text-lg">
                    {selectedMoodIndex !== null
                    ? "Save Mood"
                    : "Select a Mood"}
                </ButtonText>
                </Button>
            </View>
          </ActionsheetContent>
        </Actionsheet>
      </Box>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  shadowSm: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  shadowMd: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  shadowLg: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
});
