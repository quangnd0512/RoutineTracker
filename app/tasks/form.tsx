import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useLayoutEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { VStack } from '@/components/ui/vstack';
import { Box } from '@/components/ui/box';
import { Input, InputField } from '@/components/ui/input';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { CheckIcon, XIcon } from 'lucide-react-native';
import log from '@/services/logger';
import { useForm, Controller } from "react-hook-form"
import { Grid, GridItem } from '@/components/ui/grid';
import { Checkbox, CheckboxIcon, CheckboxIndicator } from '@/components/ui/checkbox';
import { useCandyContext } from '@/store/context';

const COLORS = [
  '#FFFFCD',
  '#FFCD9A',
  '#AA959A',
  '#C7A5A3',
  '#FF9799',

  '#FFCBCB',
  '#FF9BCD',
  '#FFCFFF',
  '#CC9AFD',
  '#CCCEFD',

  '#9CCDFE',
  '#99C7C5',
  '#CDFFFE',
  '#CDFFCC',
  '#5be2f7',
];

const RANDOM_EMOJIS = ["☂️", "🎓", "💼", "🧳", "👑", "🏄🏻‍♂️", "🐓", "🏯", "💳", "💞", "🫎",
  "🩻", "🗓", "💎", "🗑", "❤️‍🔥", "🫅", "⚒", "💻", "⌚️"
];

const ColorInput = React.memo(({ control }: { control: any, errors: any }) => {

  return (
    <Controller
      control={control}
      name="color"
      render={({ field: { onChange, value } }) => (
        <Box>
          <Heading size='lg'>Color</Heading>
          <Grid _extra={{
            className: 'grid-cols-5',
          }} gap={2} className='gap-4 my-4'>
            {COLORS.map((c) => (
              <GridItem key={c}
                _extra={{ className: '' }}
              >
                <Pressable
                  key={c}
                  onPress={() => { onChange(c); }}
                  style={{ backgroundColor: c }}
                  className='w-14 h-14 rounded-full justify-center items-center'
                >
                  {value === c && (
                    <Icon
                      as={CheckIcon}
                      className='w-8 h-8'
                    />
                  )}
                </Pressable>
              </GridItem>
            ))}
          </Grid>
        </Box>
      )}
    />
  );
});
ColorInput.displayName = 'ColorInput';

const DoItAtInput = React.memo(({ control }: { control: any, errors: any }) => {
  const options = ['morning', 'afternoon', 'evening'];

  const DoItAtView = ({ value, onChange }: { value: string | null, onChange: (value: string | null) => void }) => {
    return (
      <View>
        <Box>
          <Heading size='lg'>Do it at:</Heading>
          <HStack className='gap-4 my-4'>
            {
              options.map((option) => (
                <Button
                  key={option}
                  onPress={() => {
                    onChange(option);
                  }}
                  className={`${value === option ? 'data-[active=true]:bg-[#8587ea] bg-[#8587ea] border-[#8587ea]' : 'bg-transparent'} rounded-full border-gray-300 flex-1`}
                  variant={value === option ? 'solid' : 'outline'}
                  size='sm'>
                  <ButtonText>{option.at(0) ? option[0].toUpperCase() + option.slice(1) : option}</ButtonText>
                </Button>
              ))
            }
          </HStack>
        </Box>
      </View>
    );
  }

  return (
    <Controller
      control={control}
      name="doItAt"
      render={({ field: { onChange, value } }) => (
        <DoItAtView value={value} onChange={onChange} />
      )}
    />
  );
});
DoItAtInput.displayName = 'DoItAtInput';

const RepeatInput = React.memo(({ control }: { control: any, errors: any }) => {
  const options = ['daily', 'weekly', 'monthly'];

  const RepeatOptionView = ({ repeatType, onChange }: { repeatType: string, onChange: (value: string) => void }) => {
    return (
      <Box>
        <Heading size='lg'>Repeat</Heading>
        <HStack className='gap-4 my-4'>
          {
            options.map((option) => (
              <Button
                key={option}
                onPress={() => {
                  onChange(option);
                }}
                disabled={true}
                className={`${repeatType === option ?
                  'data-[active=true]:bg-[#8587ea] bg-[#8587ea] border-[#8587ea]' : 'bg-transparent'} rounded-full border-gray-300 flex-1`}
                variant={repeatType === option ? 'solid' : 'outline'}
              >
                <ButtonText>{option.at(0) ? option[0].toUpperCase() + option.slice(1) : option}</ButtonText>
              </Button>
            ))
          }
        </HStack>
      </Box>
    );
  }

  const RepeatValuesView = ({ repeatValues, onChange }: { repeatValues: string[], onChange: (values: string[]) => void }) => {
    const allDay = repeatValues.length === 7;
    return (
      <Box>
        <View className='flex-row items-center justify-between my-2'>
          <Heading size='lg'>On these days:</Heading>
          <View className='flex-row items-center'>
            <Text className='text-gray-400 mr-2'>All day</Text>
            <Checkbox value='all-day' isChecked={allDay} onChange={(val) => {
              if (val) {
                onChange(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
              } else {
                onChange([]);
              }
            }}>
              <CheckboxIndicator className={`data-[active=true]:bg-[#8587ea] data-[checked=true]:bg-[#8587ea] data-[unchecked=true]:bg-transparent ${allDay ? 'border-0' : 'border-gray-300 border-[1px]'} rounded-sm w-5 h-5 justify-center items-center`}>
                <CheckboxIcon as={CheckIcon} />
              </CheckboxIndicator>
            </Checkbox>
          </View>
        </View>

        <View className='flex-row items-center gap-2 my-4'>
          {
            ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Pressable
                key={day}
                onPress={() => {

                  let newValues = [...repeatValues];
                  if (newValues.includes(day)) {
                    newValues = newValues.filter((d) => d !== day);
                  } else {
                    newValues.push(day);
                  }
                  
                  onChange(newValues);
                }}
                className={`flex-1 border-[1px] items-center justify-center rounded-lg w-12 h-12 ${allDay || repeatValues.includes(day) ? 'bg-[#8587ea] border-[#8587ea]' : 'bg-transparent border-gray-300'}`}
              >
                <Text className={`${allDay || repeatValues.includes(day) ? 'text-white' : 'text-gray-700'}`}>{day[0]}</Text>
              </Pressable>
            ))
          }
        </View>
      </Box>
    );
  }

  return (
    <>
      <Controller
        control={control}
        name="repeat"
        render={({ field: { onChange, value } }) => (
          <RepeatOptionView repeatType={value} onChange={onChange} />
        )}
      />
      <Controller
        control={control}
        name="repeat"
        render={({ field: { value: repeatValue } }) => (
           repeatValue === 'daily' ? (
            <Controller
              control={control}
              name="repeatValues"
              render={({ field: { onChange, value } }) => (
                <RepeatValuesView repeatValues={value} onChange={onChange} />
              )}
            />
          ) : <></>
        )}
      />
    </>
  );
});
RepeatInput.displayName = 'RepeatInput';

const IconInput = React.memo(({ control, errors }: { control: any, errors: any }) => {

  return (
    <Controller
      control={control}
      rules={{ required: false }}
      name="icon"
      render={({ field: { onChange, value } }) => (
        <View>
          <Box>
            <Heading size='lg'>Icon</Heading>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <HStack className='gap-2 my-4'>
                {RANDOM_EMOJIS.map((e, index) => (
                  <Pressable
                    key={e + index}
                    onPress={() => {
                      onChange(e);
                    }}
                    className={`border-[1px] items-center justify-center rounded-[4px] w-14 h-14 ${value === e ? 'bg-[#8587ea] border-[#8587ea]' : 'bg-transparent border-[#f7f7f7]'}`}
                  >
                    <Box>
                      <Text className='text-[30px]'>{e}</Text>
                    </Box>
                  </Pressable>
                ))}
              </HStack>
            </ScrollView>
          </Box>
          {errors.icon && <Text className='text-red-500 mt-1'>{errors.icon.message}</Text>}
        </View>
      )}
    />
  );
});
IconInput.displayName = 'IconInput';



const Page = () => {
  const navigation = useNavigation();
  const addRoutineTask = useCandyContext(state => state.addRoutineTask);
  const updateRoutineTask = useCandyContext(state => state.updateRoutineTask);

  const { id } = useLocalSearchParams();
  log.info('Form ID:', id);
  const isEdit = !!id;

  const getRoutineTask = useCandyContext(state => state.getRoutineTask);
  const routineTask = isEdit ? getRoutineTask(id as string) : null;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: routineTask ? routineTask.label : '',
      color: routineTask ? routineTask.color : '',
      icon: routineTask ? routineTask.icon : '',
      doItAt: routineTask ? routineTask.doItAt : '',
      repeat: routineTask ? (routineTask.repeat ? routineTask.repeat : 'daily') : 'daily',
      repeatValues: routineTask ? (routineTask.repeatValues ? routineTask.repeatValues : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    }
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // 👈 hides the header
    });
  }, [navigation]);

  return (
    <View className='flex-1 bg-white pt-12'>
      <View className='headerPage'>
        <View className='items-center justify-center py-4'>
          <Heading size='xl'>{isEdit ? 'Edit Task' : 'Create New Task'}</Heading>
          <View className='left-5 absolute'>
            <Pressable onPress={() => navigation.goBack()}>
              <Icon as={XIcon} className='w-8 h-8' />
            </Pressable>
          </View>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <VStack className='gap-4 m-6'>
          <Controller
            control={control}
            name="name"
            rules={{ required: "Task name is required" }}
            render={({ field: { onChange, value } }) => (
              <View>
                <Box>
                  <View className='pb-3'>
                    <Heading size='lg'>Task Name</Heading>
                  </View>
                  <Input
                    className='bg-gray-50 border-0 h-14 rounded-lg'
                  >
                    <InputField
                      underlineColorAndroid={'transparent'}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Task Name"
                      size='sm'
                      className='placeholder:text-gray-300 font-bold'
                    />
                  </Input>
                </Box>
                {errors.name && <Text className='text-red-500 mt-1'>{errors.name.message}</Text>}
              </View>
            )}
          />
          <IconInput control={control} errors={errors} />
          <ColorInput control={control} errors={errors} />
          <RepeatInput control={control} errors={errors} />
          <DoItAtInput control={control} errors={errors} />
          {/* <HStack className='items-center justify-between'>
            <Text>End Habit on</Text>
            <Switch value={endDate} onValueChange={setEndDate} />
          </HStack> */}
          <Button className='h-auto py-4 rounded-full data-[active=true]:bg-[#8A85E6] bg-[#8A85E6] mt-4'
            variant='solid'
            onPress={() => {
              log.info('Submitting form...');

              handleSubmit((data) => {
                log.debug('Form Data:', data);

                if (isEdit) {
                  updateRoutineTask(id as string, {
                    label: data.name,
                    color: data.color,
                    icon: data.icon,
                    doItAt: data.doItAt as 'morning' | 'afternoon' | 'evening',
                    repeat: data.repeat as 'daily' | 'weekly' | 'monthly',
                    repeatValues: data.repeatValues,
                    updatedAt: new Date(),
                  });
                } else {
                  addRoutineTask({
                    id: String(Date.now()),
                    label: data.name,
                    color: data.color,
                    isFavorite: false,
                    icon: data.icon,
                    doItAt: data.doItAt as 'morning' | 'afternoon' | 'evening',
                    repeat: data.repeat as 'daily' | 'weekly' | 'monthly',
                    repeatValues: data.repeatValues,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                  });

                } 
                navigation.goBack();
              })();
            }}>
            <ButtonText>Save</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </View>
  );
};

export default Page;