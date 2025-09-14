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
import { CheckIcon, Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { RoutineTaskService } from '@/services/routineTaskService';
import { useCandyContext } from '@/store/context';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import log from '@/services/logger';
import { PlusIcon, XIcon } from 'lucide-react-native';
import StarIcon from '@/components/icons/StarIcon';
import { useNavigation, useRouter } from 'expo-router';

type Task = {
  id: string;
  label: string;
  isFavorite: boolean;
  isDone?: boolean;
};


type RoutineTaskProps = {
  task: Task;
  onToggle: (taskId: string) => void;
  onToggleFavorite: (taskId: string) => void;
  onDelete: () => void;
  onSwipeableWillOpen: () => void;
  onClose: () => void;
  onItemPress?: (taskId: string) => void;
};

const RoutineTask = React.forwardRef<Swipeable, RoutineTaskProps>(({ task, onToggle, onToggleFavorite, onDelete, onSwipeableWillOpen, onClose, onItemPress }, ref) => {
  const renderRightActions = () => {
    return (
      <View className='justify-center items-center h-full w-20 py-2 pl-1'>
        <TouchableOpacity
          onPress={onDelete}
          style={{
            backgroundColor: 'red',
          }}
          className='rounded-xl justify-center items-center w-full h-full'
        >
          <ThemedText style={{ color: 'white' }}>Delete</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable
      ref={ref}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={onSwipeableWillOpen}
      onSwipeableClose={onClose}
    >
      <Card className='bg-white my-1'>
        <TouchableOpacity onPress={() => {
          onItemPress?.(task.id);
        }}>
          <Box className="flex-row items-center">
            <Checkbox
              value={task.id}
              isChecked={task.isDone ? true : false}
              onChange={() => onToggle(task.id)}
              aria-label={task.label}
            >
              <CheckboxIndicator className="rounded-full">
                <CheckboxIcon as={CheckIcon} />
              </CheckboxIndicator>
              <CheckboxLabel />
            </Checkbox>
            <ThemedText
              className={`ml-2 flex-1 ${task.isDone ? 'line-through text-gray-500' : ''
                }`}
            >
              {task.label}
            </ThemedText>
            <TouchableOpacity onPress={() => onToggleFavorite(task.id)}>
              <StarIcon color={task.isFavorite ? 'gold' : 'gray'} />
            </TouchableOpacity>
          </Box>
        </TouchableOpacity>
      </Card>
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
      setTasks(filteredTasks.map(task => ({
        id: task.id,
        label: task.label,
        isFavorite: task.isFavorite,
        isDone: task.isDone || false, // Ensure isDone is always a boolean
      })));
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

  const handleDeletePress = (taskId: string) => {
    setTaskToDelete(taskId);
    setConfirmDeleteVisible(true);
  };

  const handleDeleteTask = () => {
    if (taskToDelete) {
      deleteRoutineTask(taskToDelete);

      setTaskToDelete(null);
      setConfirmDeleteVisible(false);
    }
  };

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

    const handleItemPress = (taskId: string) => {
      router.push(`/tasks/form?id=${taskId}`);
    }

    return (
      <RoutineTask
        ref={ref}
        task={item}
        onToggle={handleToggleTask}
        onToggleFavorite={handleToggleFavorite}
        onDelete={() => handleDeletePress(item.id)}
        onSwipeableWillOpen={handleSwipeableWillOpen}
        onClose={handleClose}
        onItemPress={handleItemPress}
      />
    );
  }, [handleToggleFavorite, handleToggleTask, router]);

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
        <ConfirmDelete
          isOpen={isConfirmDeleteVisible}
          onClose={() => setConfirmDeleteVisible(false)}
          onConfirm={handleDeleteTask}
          title="Confirm Deletion"
          message="Are you sure you want to delete this task?"
        />
      </ThemedView>
    </GestureHandlerRootView>
  );
}
