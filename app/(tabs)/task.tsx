import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from '@/components/ui/checkbox';
import { Divider } from '@/components/ui/divider';
import { Fab } from '@/components/ui/fab';
import { Heading } from '@/components/ui/heading';
import { CheckIcon } from '@/components/ui/icon';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Input, InputField } from '@/components/ui/input';
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal';
import ConfirmDelete from '@/components/ConfirmDelete';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

type Task = {
  id: string;
  label: string;
  isFavorite: boolean;
  isDone?: boolean;
};

const sampleTasks: Task[] = [
  { id: '1', label: 'Morning Coffee', isFavorite: true },
  { id: '2', label: 'Workout', isFavorite: false },
  { id: '3', label: 'Read a book', isFavorite: true },
];

type RoutineTaskProps = {
  task: Task;
  onToggle: (taskId: string) => void;
  onToggleFavorite: (taskId: string) => void;
  onDelete: () => void;
  onSwipeableWillOpen: () => void;
  onClose: () => void;
};

const RoutineTask = React.forwardRef<Swipeable, RoutineTaskProps>(({ task, onToggle, onToggleFavorite, onDelete, onSwipeableWillOpen, onClose }, ref) => {
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
        <TouchableOpacity onPress={() => onToggle(task.id)}>
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
              <IconSymbol name="star.fill" color={task.isFavorite ? 'gold' : 'gray'} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </Box>
        </TouchableOpacity>
      </Card>
    </Swipeable>
  );
});
RoutineTask.displayName = 'RoutineTask';

const DATE_NAME_DEFAULT_OPTIONS = ["Today", "Yesterday", "Other"];

const FilterTask: React.FC<{}> = () => {

  const [dateNames, setDateNames] = useState<string[]>(DATE_NAME_DEFAULT_OPTIONS);
  const [selectedDate, setSelectedDate] = useState<string>("Today");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDatePickerChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type !== 'dismissed' && selectedDate) {
      setDate(selectedDate);

      const dateString = selectedDate.toISOString().split('T')[0];
      setDateNames(prevDates => [...prevDates.slice(0, prevDates.length - 1), dateString]);
      setSelectedDate(dateString);
    }
  };

  const onSelectItem = (name: string) => {
    let onDate = new Date();

    switch (name) {
      case "Today":
        // Handle Today selection
        setSelectedDate(name);
        setDateNames(DATE_NAME_DEFAULT_OPTIONS);
        break;
      case "Yesterday":
        // Handle Yesterday selection
        onDate.setDate(onDate.getDate() - 1);
        setSelectedDate(name);
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
          value={date}
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
            action={item === selectedDate ? 'primary' : 'secondary'}
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
  const [tasks, setTasks] = useState<Task[]>(sampleTasks.map(t => ({ ...t, isDone: false })));
  const [showModal, setShowModal] = useState(false)
  const [taskLabel, setTaskLabel] = useState('');
  const [isConfirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const openRowRef = useRef<Swipeable | null>(null);

  const handleToggleTask = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, isDone: !task.isDone } : task
      )
    );
  };

  const handleToggleFavorite = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, isFavorite: !task.isFavorite } : task
      )
    );
  };

  const handleAddTask = () => {
    if (taskLabel.trim() !== '') {
      const newTask: Task = {
        id: String(Date.now()),
        label: taskLabel,
        isFavorite: false,
        isDone: false,
      };
      setTasks(prevTasks => [...prevTasks, newTask]);
      setTaskLabel('');
      setShowModal(false);
    }
  };

  const handleDeletePress = (taskId: string) => {
    setTaskToDelete(taskId);
    setConfirmDeleteVisible(true);
  };

  const handleDeleteTask = () => {
    if (taskToDelete) {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskToDelete));
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

    return (
      <RoutineTask
        ref={ref}
        task={item}
        onToggle={handleToggleTask}
        onToggleFavorite={handleToggleFavorite}
        onDelete={() => handleDeletePress(item.id)}
        onSwipeableWillOpen={handleSwipeableWillOpen}
        onClose={handleClose}
      />
    );
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedView className="flex-1 p-2" style={{ backgroundColor: 'bg-primary-50' }}>
        <FilterTask />
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
          onPress={() => setShowModal(true)}
        >
          <IconSymbol name="plus.app.fill" color="white" />
        </Fab>
        <Modal
          isOpen={showModal}
          onClose={() => {
            setTaskLabel('');
            setShowModal(false)
          }}
        >
          <ModalBackdrop />
          <ModalContent>
            <ModalHeader>
              <Heading size="lg" className=''>New Task</Heading>
              <ModalCloseButton>
                <IconSymbol name="xmark.circle.fill" color="gray" />
              </ModalCloseButton>
            </ModalHeader>
            <ModalBody>
              <Input>
                <InputField
                  value={taskLabel}
                  onChangeText={setTaskLabel}
                  placeholder="Task Label"
                />
              </Input>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                size="sm"
                action="secondary"
                onPress={() => {
                  setShowModal(false)
                }}
              >
                <ButtonText>Cancel</ButtonText>
              </Button>
              <Button
                size="sm"
                onPress={handleAddTask}
              >
                <ButtonText>Submit</ButtonText>
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
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
