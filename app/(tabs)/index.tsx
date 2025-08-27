import CircleCheckIcon from "@/components/icons/CircleCheckIcon";
import { Dimensions, View, Text } from "react-native";
import { Calendar } from "react-native-calendars";
import { LineChart } from "react-native-chart-kit";


const MonthlyCalendar = () => {

  const markedDates = {
    '2025-08-27': { marked: true },
    '2025-08-28': { marked: true }
  };


  return (
    <View className="px-3">
      <View className="items-center justify-center my-3">
        <Text className="font-bold">Monthly Activity</Text>
      </View>
      <Calendar
        markedDates={markedDates}
        dayComponent={({ date, marking, state }) => {
          const isMarked = marking?.marked;
          return (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: state === 'disabled' ? 'gray' : 'black' }}>
                {date?.day}
              </Text>
              {isMarked && (
                <View className="absolute top-0 right-0">
                  <CircleCheckIcon />
                </View>
              )}
            </View>
          );
        }}
        onMonthChange={(month) => {
          console.log("Month changed to:", month);
        }}
      />
    </View>
  );
};

const WeeklyChart = () => {
  // Sample data for the line chart
  const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [
          0,
          7,
          9,
          10,
          11,
          1,
        ],
      },
    ],
  };

  return (
    <View className="items-center justify-center mb-5 mt-3">
      <Text className="font-bold my-3">Weekly Activity</Text>
      <LineChart
        data={data}
        width={Dimensions.get("window").width - 20} // from react-native
        height={220}
        yAxisInterval={1} // optional, defaults to 1
        chartConfig={{
          backgroundColor: "black",
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          decimalPlaces: 0, // optional, defaults to 2dp
          color: (opacity = 1) => `rgba(174, 227, 253, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          barPercentage: 1,
          // propsForDots: {
          //   r: "6",
          //   strokeWidth: "2",
          //   stroke: "#ffa726",
          // },
        }}
        style={{
          backgroundColor: "black",
          borderRadius: 5
        }}
      />
    </View>
  )
}


export default function HomeScreen() {
  return (
    <>
      <WeeklyChart />
      <MonthlyCalendar />
    </>
  );
}