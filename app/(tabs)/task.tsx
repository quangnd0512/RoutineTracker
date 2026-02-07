import { RoutineTaskService } from "@/services/routineTaskService";
import { useCandyContext } from "@/store/context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import {
  ArrowRightIcon,
  CheckIcon,
  PlusIcon,
  XIcon,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  SectionList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import log from "@/services/logger";
import { Icon } from "@/components/ui/icon";
import { Fab } from "@/components/ui/fab";

type Task = {
  id: string;
  label: string;
  isFavorite: boolean;
  isDone?: boolean;
  color?: string;
  icon?: string;
};

type RoutineTaskProps = {
  task: Task;
  onToggle: (taskId: string) => void;
  onToggleFavorite: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onSwipeableWillOpen: () => void;
  onClose: () => void;
  onItemPress?: (taskId: string) => void;
};

const RoutineTask = React.memo(
  React.forwardRef<Swipeable, RoutineTaskProps>(
    (
      {
        task,
        onToggle,
        onToggleFavorite,
        onDelete,
        onSwipeableWillOpen,
        onClose,
        onItemPress,
      },
      ref,
    ) => {
      const SCREEN_WIDTH = Dimensions.get("window").width;
      const translateX = useRef(new Animated.Value(0)).current;

      const renderRightActions = (
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>,
      ) => {
        const trans = dragX.interpolate({
          inputRange: [-SCREEN_WIDTH * 0.2, 0],
          outputRange: [0, SCREEN_WIDTH * 0.8],
          extrapolate: "clamp",
        });
        return (
          <View
            className="bg-red-500 rounded-2xl mb-3 mx-4"
            style={{ width: SCREEN_WIDTH }}
          >
            <Animated.View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "flex-end",
                transform: [{ translateX: trans }],
              }}
            >
              <View className="flex-row items-center gap-2 p-4 pr-8">
                <Text className="text-white font-bold">Skip</Text>
                <Icon as={ArrowRightIcon} className="text-white" size="xl" />
              </View>
            </Animated.View>
          </View>
        );
      };

      const renderLeftActions = (
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>,
      ) => {
        const trans = dragX.interpolate({
          inputRange: [-SCREEN_WIDTH * 0.2, 0],
          outputRange: [0, 0],
          extrapolate: "clamp",
        });
        return (
          <View
            className={`${
              task.isDone ? "bg-red-500" : "bg-green-500"
            } rounded-2xl mb-3 mx-4`}
            style={{ width: SCREEN_WIDTH }}
          >
            <Animated.View
              className="flex-1 items-start justify-center"
              style={{
                transform: [{ translateX: trans }],
              }}
            >
              <View className="items-center gap-2 px-8">
                <Icon
                  as={task.isDone ? XIcon : CheckIcon}
                  className="text-white"
                  size="xl"
                />
              </View>
            </Animated.View>
          </View>
        );
      };

      const ItemView = () => {
        return (
          <View
            className="bg-white rounded-2xl mb-3 mx-4 p-4 border border-gray-100 flex-row items-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <TouchableOpacity
              className="flex-1 flex-row items-center"
              onPress={() => {
                onItemPress?.(task.id);
              }}
              activeOpacity={0.7}
            >
              <View
                className="h-12 w-12 rounded-full items-center justify-center mr-4 bg-gray-50 border border-gray-100"
                style={
                  task.color
                    ? { backgroundColor: task.color + "20" } // 20 opacity hex
                    : {}
                }
              >
                <Text style={{ fontSize: 24 }}>{task.icon || "📝"}</Text>
              </View>

              <View className="flex-1">
                <Text
                  className={`text-base font-semibold ${
                    task.isDone ? "text-gray-400 line-through" : "text-gray-800"
                  }`}
                  numberOfLines={1}
                >
                  {task.label}
                </Text>
                {task.isDone && (
                  <Text className="text-xs text-gray-400 mt-0.5">
                    Completed
                  </Text>
                )}
              </View>

              {task.isDone ? (
                <View className="bg-green-100 p-1.5 rounded-full">
                  <Icon as={CheckIcon} className="text-green-600" size="sm" />
                </View>
              ) : (
                <View className="w-6 h-6 rounded-full border-2 border-gray-200" />
              )}
            </TouchableOpacity>
          </View>
        );
      };

      return (
        <Swipeable
          ref={ref}
          overshootRight={false}
          rightThreshold={SCREEN_WIDTH * 0.1}
          renderRightActions={task.isDone ? undefined : renderRightActions}
          renderLeftActions={renderLeftActions}
          onSwipeableWillOpen={onSwipeableWillOpen}
          onSwipeableRightWillOpen={() => {
            setTimeout(() => {
              if (ref && typeof ref !== "function" && ref.current) {
                ref.current.close();
              }
            }, 100);
            log.info("[RoutineTask] onSwipeableRightWillOpen");
          }}
          onSwipeableClose={() => {
            log.info("[RoutineTask] onSwipeableClose");
            onClose();
          }}
          onSwipeableLeftWillOpen={() => {
            setTimeout(() => {
              onToggle(task.id);
              if (ref && typeof ref !== "function" && ref.current) {
                ref.current.close();
              }
            }, 100);
            log.info("[RoutineTask] onSwipeableLeftWillOpen");
          }}
        >
          <Animated.View style={{ transform: [{ translateX }] }}>
            <ItemView />
          </Animated.View>
        </Swipeable>
      );
    },
  ),
);
RoutineTask.displayName = "RoutineTask";

const DATE_NAME_DEFAULT_OPTIONS = ["Today", "Yesterday", "Other"];

interface FilterTaskProps {
  selectedDate: Date | null;
  onSelectedDateChange: (date: Date | null) => void;
}
const FilterTask: React.FC<FilterTaskProps> = React.memo(
  ({ selectedDate, onSelectedDateChange }) => {
    const [dateNames, setDateNames] = useState<string[]>(
      DATE_NAME_DEFAULT_OPTIONS,
    );
    const [selectedDateName, setSelectedDateName] = useState<string>("Today");
    const [showDatePicker, setShowDatePicker] = useState(false);

    const onDatePickerChange = useCallback(
      (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (event.type !== "dismissed" && selectedDate) {
          onSelectedDateChange(selectedDate);

          const dateString = selectedDate.toISOString().split("T")[0];
          setDateNames((prevDates) => [
            ...prevDates.slice(0, prevDates.length - 1),
            dateString,
          ]);
          setSelectedDateName(dateString);
        }
      },
      [onSelectedDateChange],
    );

    const onSelectItem = useCallback(
      (name: string) => {
        const onDate = new Date();

        switch (name) {
          case "Today":
            setSelectedDateName(name);
            setDateNames(DATE_NAME_DEFAULT_OPTIONS);
            onSelectedDateChange(onDate);
            break;
          case "Yesterday":
            onDate.setDate(onDate.getDate() - 1);
            onSelectedDateChange(onDate);
            setSelectedDateName(name);
            setDateNames(DATE_NAME_DEFAULT_OPTIONS);
            break;
          default:
            setShowDatePicker(true);
            break;
        }
      },
      [onSelectedDateChange],
    );

    return (
      <View className="flex-row items-center mb-6 px-4 pt-2">
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={selectedDate || new Date()}
            mode={"date"}
            is24Hour={true}
            onChange={onDatePickerChange}
          />
        )}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={dateNames}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onSelectItem(item)}
              className={`mr-3 px-5 py-2.5 rounded-full border ${
                item === selectedDateName
                  ? "bg-[#8882e7] border-[#8882e7]"
                  : "bg-white border-gray-200"
              }`}
              style={
                item !== selectedDateName
                  ? {
                      shadowColor: "#000",
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }
                  : {}
              }
              activeOpacity={0.8}
            >
              <Text
                className={`font-semibold text-sm ${
                  item === selectedDateName ? "text-white" : "text-gray-600"
                }`}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      </View>
    );
  },
);
FilterTask.displayName = "FilterTask";

export default function TaskScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const openRowRef = useRef<Swipeable | null>(null);
  const [filteredOnDate, setFilteredOnDate] = useState<Date | null>(new Date());
  const router = useRouter();

  const routineTasks = useCandyContext((state) => state.routineTasks);
  const updateRoutineTask = useCandyContext((state) => state.updateRoutineTask);

  useEffect(() => {
    RoutineTaskService.getFilteredRoutineTasks(
      routineTasks,
      filteredOnDate,
    ).then((filteredTasks) => {
      setTasks(
        filteredTasks.map((task) => {
          return {
            id: task.id,
            label: task.label,
            isFavorite: task.isFavorite,
            isDone: task.isDone || false,
            color: task.color,
            icon: task.icon,
          };
        }),
      );
    });
  }, [routineTasks, filteredOnDate]);

  const handleToggleTask = React.useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      if (task.isDone) {
        await RoutineTaskService.deleteFinishedRoutineTask(
          filteredOnDate || new Date(),
          taskId,
        );
      } else {
        await RoutineTaskService.markFinishedRoutineTask(
          filteredOnDate || new Date(),
          taskId,
        );
      }

      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, isDone: !t.isDone } : t,
        ),
      );
    },
    [tasks, filteredOnDate],
  );

  const handleToggleFavorite = useCallback(
    (taskId: string) => {
      updateRoutineTask(taskId, {
        isFavorite: !tasks.find((task) => task.id === taskId)?.isFavorite,
      });
    },
    [tasks, updateRoutineTask],
  );

  const handleItemPressed = useCallback(
    (taskId: string) => {
      router.push(`/tasks/form?id=${taskId}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Task }) => {
      const ref = React.createRef<Swipeable>();

      const handleSwipeableWillOpen = () => {
        if (openRowRef.current && openRowRef.current !== ref.current) {
          openRowRef.current.close();
        }
        openRowRef.current = ref.current;
      };

      const handleClose = () => {
        if (openRowRef.current === ref.current) {
          openRowRef.current = null;
        }
      };

      return (
        <RoutineTask
          ref={ref}
          task={item}
          onToggle={handleToggleTask}
          onToggleFavorite={handleToggleFavorite}
          onDelete={(taskId) => {
            // handle hide routine task
          }}
          onSwipeableWillOpen={handleSwipeableWillOpen}
          onClose={handleClose}
          onItemPress={handleItemPressed}
        />
      );
    },
    [handleToggleFavorite, handleToggleTask, handleItemPressed],
  );

  const todoTasks = tasks.filter((task) => !task.isDone);
  const doneTasks = tasks.filter((task) => task.isDone);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-gray-50/50 pt-4">
        <SectionList
          sections={[
            { title: "Todo", data: todoTasks },
            { title: "Completed", data: doneTasks },
          ]}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title, data } }) => {
            if (title === "Completed" && data.length > 0) {
              return (
                <View className="flex-row items-center px-6 py-4 mt-2 mb-2">
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Completed ({data.length})
                  </Text>
                  <View className="h-[1px] flex-1 bg-gray-200 ml-4" />
                </View>
              );
            }
            return null;
          }}
          ListHeaderComponent={
            <FilterTask
              selectedDate={filteredOnDate}
              onSelectedDateChange={setFilteredOnDate}
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => {
            openRowRef.current?.close();
          }}
          stickySectionHeadersEnabled={false}
        />

        <Fab
          size="lg"
          className="bg-[#8882E7] mb-6 mr-4 shadow-lg shadow-indigo-200"
          placement="bottom right"
          onPress={() => {
            router.push("/tasks/form");
          }}
        >
          <Icon as={PlusIcon} className="text-white" size="xl" />
        </Fab>
      </View>
    </GestureHandlerRootView>
  );
}
