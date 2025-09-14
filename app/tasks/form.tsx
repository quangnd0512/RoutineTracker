import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import emojis from '@/assets/data/emoji.json';
import { Calendar } from 'react-native-calendars';
import { VStack } from '@/components/ui/vstack';
import { Box } from '@/components/ui/box';
import { Input, InputField } from '@/components/ui/input';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Button, ButtonText } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Icon } from '@/components/ui/icon';
import { CheckIcon, XIcon } from 'lucide-react-native';
import log from '@/services/logger';
import { Grid, GridItem } from '@/components/ui/grid';
import { Checkbox, CheckboxIcon, CheckboxIndicator } from '@/components/ui/checkbox';

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

const ColorInput = ({ value, onSelected }: { value: string; onSelected: (color: string) => void }) => {
  const [color, setColor] = useState(value);
  return (
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
              onPress={() => { setColor(c); onSelected(c); }}
              style={{ backgroundColor: c }}
              className='w-14 h-14 rounded-full justify-center items-center'
            >
              {color === c && (
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
  );
}

const DoItAtInput = ({ value, onSelected }: { value: string | null; onSelected: (value: string) => void }) => {
  const [doItAt, setDoItAt] = useState<string | null>(value);
  const options = ['morning', 'afternoon', 'evening'];

  return (
    <Box>
      <Heading size='lg'>Do it at:</Heading>
      <HStack className='gap-4 my-4'>
        {
          options.map((option) => (
            <Button
              key={option}
              onPress={() => {
                setDoItAt(option);
                onSelected(option);
              }}
              className={`${doItAt === option ? 'data-[active=true]:bg-[#8587ea] bg-[#8587ea] border-[#8587ea]' : 'bg-transparent'} rounded-full border-gray-300 flex-1`}
              variant={doItAt === option ? 'solid' : 'outline'}
              size='xl'>
              <ButtonText>{option.at(0) ? option[0].toUpperCase() + option.slice(1) : option}</ButtonText>
            </Button>
          ))
        }
      </HStack>
    </Box>
  );
}

const RepeatInput = ({repeatType, repeatValues, onSelected }: { repeatType: string; repeatValues: string[]; onSelected: (repeatType: string, repeatValues: string[]) => void }) => {
  const [repeat, setRepeat] = useState(repeatType || 'daily');
  const [allDay, setAllDay] = useState(true);
  const [rValues, setRepeatValues] = useState<string[]>(repeatValues || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const options = ['daily', 'weekly', 'monthly'];

  return (
    <>
      <Box>
        <Heading size='lg'>Repeat</Heading>
        <HStack className='gap-4 my-4'>
          {
            options.map((option) => (
              <Button
                key={option}
                onPress={() => {
                  setRepeat(option);
                  setRepeatValues([]);
                  onSelected(option, []);
                }}
                disabled={true}
                className={`${repeat === option ?
                  'data-[active=true]:bg-[#8587ea] bg-[#8587ea] border-[#8587ea]' : 'bg-transparent'} rounded-full border-gray-300 flex-1`}
                variant={repeat === option ? 'solid' : 'outline'}
                size='xl'>
                <ButtonText>{option.at(0) ? option[0].toUpperCase() + option.slice(1) : option}</ButtonText>
              </Button>
            ))
          }
        </HStack>
      </Box>
      {repeat === 'daily' && (
        <Box>
          <View className='flex-row items-center justify-between my-2'>
            <Heading size='lg'>On these days:</Heading>
            <View className='flex-row items-center'>
              <Text className='text-gray-400 mr-2'>All day</Text>
              <Checkbox value='all-day' isChecked={allDay} onChange={(val) => {
                setAllDay(val);
                if (val) {
                  setRepeatValues(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
                  onSelected(repeat, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
                } else {
                  setRepeatValues([]);
                  onSelected(repeat, []);
                }
              }}>
                <CheckboxIndicator className={`data-[active=true]:bg-[#8587ea] data-[checked=true]:bg-[#8587ea] data-[unchecked=true]:bg-transparent ${allDay ? 'border-0' : 'border-gray-300 border-[1px]'} rounded-sm w-5 h-5 justify-center items-center`}>
                  <CheckboxIcon as={CheckIcon} />
                </CheckboxIndicator>
              </Checkbox>
            </View>
          </View>

          <View className='flex-row items-center gap-4 my-4'>
            {
              ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Pressable
                  key={day}
                  onPress={() => {
                    
                    let newValues = [...rValues];
                    if (newValues.includes(day)) {
                      newValues = newValues.filter((d) => d !== day);
                    } else {
                      newValues.push(day);
                    }
                    if (newValues.length === 7) {
                      setAllDay(true);
                    } else {
                      setAllDay(false);
                    }

                    setRepeatValues(newValues);
                    onSelected(repeat, newValues);
                  }}
                  className={`border-[1px] items-center justify-center rounded-lg w-12 h-12 ${allDay || rValues.includes(day) ? 'bg-[#8587ea] border-[#8587ea]' : 'bg-transparent border-gray-300'}`}
                >
                  <Text className={`${allDay || rValues.includes(day) ? 'text-white' : 'text-gray-700'}`}>{day}</Text>
                </Pressable>
              ))
            }
          </View>
        </Box>
      )}
    </>
  );
}

const IconInput = ({ value, onSelected }: { value: string | null; onSelected: (emoji: string) => void }) => {

  const [icon, setIcon] = useState(value || '☂️');
  const randomEmojis = ["☂️", "🎓", "💼", "🧳", "👑", "🏄🏻‍♂️", "🐓", "🏯", "💳", "💞", "🫎",
    //  "🩻", "🗓", "💎", "🗑", "❤️‍🔥", "🫅", "⚒", "💻", "⌚️"
  ];

  return (
    <Box>
      <Heading size='lg'>Icon</Heading>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack className='gap-2 my-4'>
          {randomEmojis.map((e, index) => (
            <Pressable
              key={e + index}
              onPress={() => {
                setIcon(e);
                onSelected(e);
              }}
              className={`border-[1px] items-center justify-center rounded-[4px] w-14 h-14 ${icon === e ? 'bg-[#8587ea] border-[#8587ea]' : 'bg-transparent border-[#f7f7f7]'}`}
            >
              <Box>
                <Text className='text-[30px]'>{e}</Text>
              </Box>
            </Pressable>
          ))}
        </HStack>
      </ScrollView>
    </Box>
  );
};

const Page = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState<string | null>('☂️');
  const [doItAt, setDoItAt] = useState<string | null>(null);
  const [repeat, setRepeat] = useState('daily');
  const [repeatValues, setRepeatValues] = useState<string[]>(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [endDate, setEndDate] = useState(false);
  const [selectedDays, setSelectedDays] = useState({});

  const { id } = useLocalSearchParams();
  const isEdit = !!id;

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
          <Box>
            <View className='pb-3'>
              <Heading size='lg'>Task Name</Heading>
            </View>
            <Input
              className='bg-gray-50 border-0 h-14 rounded-lg'
            >
              <InputField
                underlineColorAndroid={'transparent'}
                value={name}
                onChangeText={setName}
                placeholder="Task Name"
                size='sm'
                className='placeholder:text-gray-300'
              />
            </Input>
          </Box>
          <IconInput value={icon} onSelected={(emoji) => { setIcon(emoji); }} />
          <ColorInput value={color} onSelected={(color) => { setColor(color); }} />
          <RepeatInput repeatType={repeat} repeatValues={repeatValues} onSelected={(rType, rValues) => { setRepeat(rType); setRepeatValues(rValues); }} />
          <DoItAtInput value={doItAt} onSelected={(value) => { setDoItAt(value); }} />
          {/* <HStack className='items-center justify-between'>
            <Text>End Habit on</Text>
            <Switch value={endDate} onValueChange={setEndDate} />
          </HStack> */}
          <Button className='h-auto py-4 rounded-full data-[active=true]:bg-[#8A85E6] bg-[#8A85E6] mt-4'
            variant='solid'
            onPress={() => { navigation.goBack(); }}>
            <ButtonText>Save</ButtonText>
          </Button>
        </VStack>
      </ScrollView>
    </View>
  );
};

export default Page;