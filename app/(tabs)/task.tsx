import React, { useState } from 'react';
import { FlatList, Pressable, TouchableOpacity, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from '@/components/ui/checkbox';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Box } from '@/components/ui/box';
import { CheckIcon } from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { Fab, FabIcon, FabLabel } from '@/components/ui/fab';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { Modal, ModalBackdrop, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal';

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
};

const RoutineTask: React.FC<RoutineTaskProps> = ({ task, onToggle, onToggleFavorite }) => {
  return (
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
          <IconSymbol name="star.fill" color={task.isFavorite ? 'gold' : 'gray'} style={{ marginLeft: 'auto' }}/>
        </TouchableOpacity>
      </Box>
      </TouchableOpacity>
    </Card>
  );
};

export default function TaskScreen() {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks.map(t => ({ ...t, isDone: false })));
  const [showModal, setShowModal] = useState(false)
  const [taskLabel, setTaskLabel] = useState('');

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

  return (
    <ThemedView className="flex-1 p-2" style={{ backgroundColor: 'bg-primary-100' }}>
      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <RoutineTask task={item} onToggle={handleToggleTask} onToggleFavorite={handleToggleFavorite} />
        )}
        keyExtractor={item => item.id}
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
    </ThemedView>
  );
}
