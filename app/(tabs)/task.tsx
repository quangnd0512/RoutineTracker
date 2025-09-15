import ConfirmDelete from '@/components/ConfirmDelete';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from '@/components/ui/checkbox';
import { Divider } from '@/components/ui/divider';
import { Fab } from '@/components/ui/fab';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { RoutineTaskService } from '@/services/routineTaskService';
import { useCandyContext } from '@/store/context';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State, Swipeable } from 'react-native-gesture-handler';
import log from '@/services/logger';
import { ArrowRightIcon, CheckIcon, PlusIcon, XIcon } from 'lucide-react-native';
import StarIcon from '@/components/icons/StarIcon';
import { useNavigation, useRouter } from 'expo-router';
import { Text } from '@/components/ui/text';

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

const RoutineTask = React.forwardRef<Swipeable, RoutineTaskProps>(({ task, onToggle, onToggleFavorite, onDelete, onSwipeableWillOpen, onClose, onItemPress }, ref) => {
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(0)).current;

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    log.info("[RoutineTask] Rendering right actions", { progress, dragX });

    const trans = dragX.interpolate({
      inputRange: [-SCREEN_WIDTH * 0.2, 0],
      outputRange: [0, SCREEN_WIDTH * 0.8],
      extrapolate: 'clamp'
    });
    return (
      <View
        className='bg-red-500 rounded-md'
        style={{ width: SCREEN_WIDTH, marginBottom: 12 }}>
        <Animated.View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'flex-end',
            transform: [{ translateX: trans }],
          }}
        >
          <View className='flex-row items-center gap-2 p-4'>
            <Text className='text-white' >Skip</Text>
            <Icon as={ArrowRightIcon} color='white' size='xl' />
          </View>
        </Animated.View>
      </View>
    );
  };

  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    log.info("[RoutineTask] Rendering left actions", { progress, dragX });

    const trans = dragX.interpolate({
      inputRange: [-SCREEN_WIDTH * 0.2, 0],
      outputRange: [0, 0],
      extrapolate: 'clamp'
    });
    return (
      <View
        className={`${task.isDone ? 'bg-red-500': 'bg-green-500'} rounded-md`}
        style={{ width: SCREEN_WIDTH, marginBottom: 12 }}>
        <Animated.View
          className='flex-1 items-start justify-center'
          style={{
            transform: [{ translateX: trans }],
          }}
        >
          <View className='items-center gap-2 px-4'>
            <Icon as={task.isDone ? XIcon : CheckIcon} color='white' size='xl' />
          </View>
        </Animated.View>
      </View>
    );
  };

  const ItemView = ({ }) => {
    return (
      <Card className="mb-3" style={{
        backgroundColor: task.color || 'white',
      }}>
        <TouchableOpacity onPress={() => {
          onItemPress?.(task.id);
        }}>
          <Box className="flex-row items-center">
            {/* <Checkbox
              value={task.id}
              isChecked={task.isDone ? true : false}
              onChange={() => onToggle(task.id)}
              aria-label={task.label}
            >
              <CheckboxIndicator className="rounded-full">
                <CheckboxIcon as={CheckIcon} />
              </CheckboxIndicator>
              <CheckboxLabel />
            </Checkbox> */}
            <Box>
              {task.icon && (
                <Text size='3xl'>{task.icon}</Text>
              )}
            </Box>
            <ThemedText
              className={`ml-3 flex-1 font-bold`}
            >
              {task.label}
            </ThemedText>
            {/* <TouchableOpacity onPress={() => onToggleFavorite(task.id)}>
              <StarIcon color={task.isFavorite ? 'gold' : 'gray'} />
            </TouchableOpacity> */}
            {
              task.isDone ? (
                <View className="bg-green-500 rounded-full p-1">
                  <Icon as={CheckIcon} color='white' size='sm' />
                </View>
              ) : (
                <></>
              )
            }
          </Box>
        </TouchableOpacity>
      </Card>
    );
  }

  return (
    <Swipeable
      ref={ref}
      overshootRight={false}
      // friction={2}
      rightThreshold={SCREEN_WIDTH * 0.1}
      renderRightActions={task.isDone ? undefined : renderRightActions}
      renderLeftActions={renderLeftActions}
      onSwipeableWillOpen={onSwipeableWillOpen}
      onSwipeableRightWillOpen={() => {
        // onDelete?.(task.id);
        setTimeout(() => {
          if (ref && typeof ref !== 'function' && ref.current) {
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
          if (ref && typeof ref !== 'function' && ref.current) {
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
});
RoutineTask.displayName = 'RoutineTask';

const DATE_NAME_DEFAULT_OPTIONS = ["Today", "Yesterday", "Other"];


interface FilterTaskProps {
  selectedDate: Date | null;
  onSelectedDateChange: (date: Date | null) => void;
}
const FilterTask: React.FC<FilterTaskProps> = ({ selectedDate, onSelectedDateChange }) => {

  const [dateNames, setDateNames] = useState<string[]>(DATE_NAME_DEFAULT_OPTIONS);
  const [selectedDateName, setSelectedDateName] = useState<string>("Today");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDatePickerChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type !== 'dismissed' && selectedDate) {
      onSelectedDateChange(selectedDate);

      const dateString = selectedDate.toISOString().split('T')[0];
      setDateNames(prevDates => [...prevDates.slice(0, prevDates.length - 1), dateString]);
      setSelectedDateName(dateString);
    }
  };

  const onSelectItem = (name: string) => {
    const onDate = new Date();

    switch (name) {
      case "Today":
        // Handle Today selection
        setSelectedDateName(name);
        setDateNames(DATE_NAME_DEFAULT_OPTIONS);
        onSelectedDateChange(onDate)
        break;
      case "Yesterday":
        // Handle Yesterday selection
        onDate.setDate(onDate.getDate() - 1);
        onSelectedDateChange(onDate);
        setSelectedDateName(name);
        setDateNames(DATE_NAME_DEFAULT_OPTIONS);
        break;
      default:
        setShowDatePicker(true);
        break;
    }

    // Handle date filtering
  }

  return (
    <Box className='flex-row items-center'>
      {showDatePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={selectedDate || new Date()}
          mode={'date'}
          is24Hour={true}
          onChange={onDatePickerChange}
        />
      )}
      <FlatList
        data={dateNames}
        renderItem={({ item }) => (
          <Button
            size="sm"
            variant="outline"
            action={item === selectedDateName ? 'primary' : 'secondary'}
            onPress={() => onSelectItem(item)}
            className="mr-2 rounded-full"
          >
            <ButtonText>{item}</ButtonText>
          </Button>
        )}
        keyExtractor={item => item}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </Box>
  );
};

export default function TaskScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isConfirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const openRowRef = useRef<Swipeable | null>(null);
  const [filteredOnDate, setFilteredOnDate] = useState<Date | null>(new Date());
  const router = useRouter();

  // Call useCandyContext at the top level of the component, not inside useEffect
  const routineTasks = useCandyContext(state => state.routineTasks);
  const deleteRoutineTask = useCandyContext(state => state.deleteRoutineTask);
  const updateRoutineTask = useCandyContext(state => state.updateRoutineTask);

  useEffect(() => {
    RoutineTaskService.getFilteredRoutineTasks(routineTasks, filteredOnDate).then(filteredTasks => {
      setTasks(filteredTasks.map(task => {
        log.info("[TaskScreen] Mapping task:", task);

        return ({
          id: task.id,
          label: task.label,
          isFavorite: task.isFavorite,
          isDone: task.isDone || false, // Ensure isDone is always a boolean
          color: task.color,
          icon: task.icon,
        })
      }));
    });
  }, [routineTasks, filteredOnDate]);

  const handleToggleTask = React.useCallback(async (taskId: string) => {
    log.info(`[TaskScreen] Toggling task: ${taskId}`);
    // Find the task to toggle
    const task = tasks.find(t => t.id === taskId);
    log.info(`[TaskScreen] Tasks:`, tasks);
    log.info(`[TaskScreen] Task found:`, task);
    if (!task) return;

    // Perform the async side effect
    if (task.isDone) {
      await RoutineTaskService.deleteFinishedRoutineTask(filteredOnDate || new Date(), taskId);
    } else {
      await RoutineTaskService.markFinishedRoutineTask(filteredOnDate || new Date(), taskId);
    }

    // Update the state synchronously
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === taskId ? { ...t, isDone: !t.isDone } : t
      )
    );
  }, [tasks, filteredOnDate]);

  const handleToggleFavorite = useCallback((taskId: string) => {
    updateRoutineTask(taskId, { isFavorite: !tasks.find(task => task.id === taskId)?.isFavorite });

    // setTasks(prevTasks =>
    //   prevTasks.map(task =>
    //     task.id === taskId ? { ...task, isFavorite: !task.isFavorite } : task
    //   )
    // );
  }, [tasks, updateRoutineTask]);

  // const handleDeletePress = (taskId: string) => {
  //   setTaskToDelete(taskId);
  //   setConfirmDeleteVisible(true);
  // };

  // const handleDeleteTask = () => {
  //   if (taskToDelete) {
  //     deleteRoutineTask(taskToDelete);

  //     setTaskToDelete(null);
  //     setConfirmDeleteVisible(false);
  //   }
  // };

  const handleItemPressed = useCallback((taskId: string) => {
    router.push(`/tasks/form?id=${taskId}`);
  }, [router]);

  const renderItem = useCallback(({ item }: { item: Task }) => {
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
  }, [handleToggleFavorite, handleToggleTask, handleItemPressed]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedView className="flex-1 p-2" style={{ backgroundColor: 'white' }}>
        <FilterTask selectedDate={filteredOnDate} onSelectedDateChange={setFilteredOnDate} />
        <Divider className='my-2' />
        <FlatList
          data={tasks}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          onScrollBeginDrag={() => {
            openRowRef.current?.close();
          }}
        />
        <Fab
          size="lg"
          placement="bottom right"
          onPress={() => {
            router.push('/tasks/form');
          }}
        >
          <Icon as={PlusIcon} className='text-white' />
        </Fab>
      </ThemedView>
    </GestureHandlerRootView>
  );
}
