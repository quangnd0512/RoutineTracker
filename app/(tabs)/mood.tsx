import React, { useState } from "react";
import { ScrollView } from "react-native";
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
  SmileIcon,
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

const DAYS_OF_WEEK = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MOOD_LABELS = ["Great", "Good", "Okay", "Not Good", "Bad"];

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
    
    // Verify if it is today (or allow any day - sticking to 'today' emphasis from prompt but allowing interaction for now)
    // For a tracker, usually you can log past days. I'll allow it.
    
    const log = getMoodLog(dateStr);
    setSelectedDate(dateStr);
    setSelectedMoodIndex(log ? log.moodIndex : null); // Pre-select if exists, else null
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
    // Adjust for Monday start: Mon(1) -> 0, Sun(0) -> 6
    const startOffset = (firstDay + 6) % 7;

    const cells = [];

    // Empty cells for previous month
    for (let i = 0; i < startOffset; i++) {
      cells.push(
        <Box key={`empty-${i}`} className="w-[14.28%] aspect-[0.7]" />,
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
          onPress={() => handleDayPress(day)}
          className="w-[14.28%] aspect-[0.7] items-center justify-center mb-4"
        >
          <VStack className={`items-center justify-between h-full py-1`}>
            <Box className="items-center justify-center flex-1">
              {log ? (
                <Box className="w-8 h-8 rounded-full items-center justify-center">
                  <Text className="text-3xl text-center leading-none">
                    {Emojis[log.moodIndex]}
                  </Text>
                </Box>
              ) : isToday ?
              (
                <Box className="w-8 h-8 rounded-full border border-gray-200 items-center justify-center bg-gray-50">
                  <Icon as={PlusIcon} size="md" className="text-gray-300" />
                </Box>
              ) : (
                <Box className="w-8 h-8 rounded-full border border-gray-200 items-center justify-center bg-gray-50">
                  <Icon as={SmileIcon} size="md" className="text-gray-300" />
                </Box>
              )}
            </Box>

            <Text
              size="sm"
              className={`${log ? "text-gray-600 font-bold" : "text-gray-400 font-medium"} text-center text-[8px] mt-1 mb-1`}
            >
              {log ? MOOD_LABELS[log.moodIndex] : "Mood"}
            </Text>

            <Text
              size="md"
              className={`text-center font-bold ${log ? "text-gray-900" : "text-gray-400"}`}
            >
              {day}
            </Text>
          </VStack>
        </Pressable>,
      );
    }

    return cells;
  };

  return (
    <ScrollView className="flex-1  bg-white">
      <Box className="p-4 bg-white min-h-full pb-20">
        <HStack className="items-center justify-between mb-8 mt-2">
          <Pressable onPress={handlePrevMonth} className="p-2">
            <Icon as={ChevronLeftIcon} size="xl" className="text-gray-600" />
          </Pressable>
          <Text size="2xl" className="font-bold text-gray-900">
            {formatMonthYear(currentDate)}
          </Text>
          <Pressable onPress={handleNextMonth} className="p-2">
            <Icon as={ChevronRightIcon} size="xl" className="text-gray-600" />
          </Pressable>
        </HStack>

        <HStack className="mb-4">
          {DAYS_OF_WEEK.map((day) => (
            <Box key={day} className="w-[14.28%] items-center">
              <Text size="md" className="font-bold text-gray-900">
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
          <ActionsheetContent className="pb-8">
            <ActionsheetDragIndicatorWrapper>
              <ActionsheetDragIndicator />
            </ActionsheetDragIndicatorWrapper>
            
            <Text size="xl" className="font-bold mb-6 mt-2">
              How is your mood today?
            </Text>

            <HStack className="justify-between w-full px-2 mb-8">
              {MOOD_LABELS.map((label, index) => (
                <Pressable
                  key={index}
                  onPress={() => setSelectedMoodIndex(index)}
                  className="items-center"
                >
                  <Box
                    className={`w-14 h-14 rounded-full items-center justify-center mb-2 ${
                      selectedMoodIndex === index
                        ? "bg-[#8882E7] border-1 border-primary-50"
                        : "bg-gray-50"
                    }`}
                  >
                    <Text className="text-3xl">{Emojis[index]}</Text>
                  </Box>
                  <Text
                    size="sm"
                    className={`${
                      selectedMoodIndex === index
                        ? "text-primary-600 font-bold"
                        : "text-gray-500"
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </HStack>

            <Button
              className="w-full rounded-full h-12 bg-[#8882E7]"
              onPress={handleSaveMood}
              isDisabled={selectedMoodIndex === null}
            >
              <ButtonText className="text-white font-bold text-lg">
                {selectedMoodIndex !== null
                  ? `I Feel ${MOOD_LABELS[selectedMoodIndex]}!`
                  : "Select a Mood"}
              </ButtonText>
            </Button>
          </ActionsheetContent>
        </Actionsheet>
      </Box>
    </ScrollView>
  );
}
