import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
// 1. 안전 영역 확보를 위한 라이브러리 추가
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

interface Report {
  id: string;
  date: string;
  groupName: string;
  leader: string;
  location: string;
  count: string;
  summary: string;
  prayer: string;
  attendees: string;
  absentees: string;
  special: string;
  prayerTopic: string;
}

const Tab = createBottomTabNavigator();

// --- 공통 컴포넌트: 표의 셀(Cell) ---
const TableCell = ({
  label,
  value,
  onChange,
  multiline,
  flex = 1,
  smallLabel = false,
  fontScale = 1,
  customHeight = 100,
}: any) => (
  <View style={[styles.cellContainer, { flex }]}>
    <View style={[styles.rowLabel, smallLabel && { width: 90 }]}>
      <Text style={[styles.labelText, { fontSize: 12 * fontScale }]}>
        {label}
      </Text>
    </View>
    <TextInput
      style={[
        styles.rowInput,
        multiline && {
          minHeight: customHeight,
          textAlignVertical: customHeight > 60 ? "top" : "center",
        },
      ]}
      value={value}
      onChangeText={onChange}
      multiline={multiline}
      scrollEnabled={false}
      placeholder=""
      placeholderTextColor="#ccc"
    />
  </View>
);

// --- 화면 1: 보고서 작성 및 상세 보기 ---
function ReportFormScreen({ navigation, route }: any) {
  const viewShotRef = useRef<any>(null);
  const initialForm = {
    groupName: "",
    leader: "",
    location: "",
    count: "",
    summary: "",
    prayer: "",
    attendees: "",
    absentees: "",
    special: "",
    prayerTopic: "",
  };

  const [form, setForm] = useState(initialForm);
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    const loadFontScale = async () => {
      const savedScale = await AsyncStorage.getItem("fontScale");
      if (savedScale) setFontScale(parseFloat(savedScale));
    };
    loadFontScale();
  }, []);

  const changeFontScale = async (delta: number) => {
    const newScale = Math.max(0.8, Math.min(2.0, fontScale + delta));
    setFontScale(newScale);
    await AsyncStorage.setItem("fontScale", newScale.toString());
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerFontControls}>
          <TouchableOpacity
            onPress={() => changeFontScale(-0.1)}
            style={styles.headerFontBtn}
          >
            <Text style={styles.fontBtnTextSmall}>가</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => changeFontScale(0.1)}
            style={styles.headerFontBtn}
          >
            <Text style={styles.fontBtnTextLarge}>가</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, fontScale]);

  useEffect(() => {
    if (route.params?.report) {
      setForm(route.params.report);
    }
  }, [route.params?.report]);

  const resetForm = () => {
    setForm(initialForm);
    navigation.setParams({ report: null });
    Alert.alert("알림", "새 보고서를 작성할 수 있도록 초기화되었습니다.");
  };

  const onSave = async () => {
    if (!form.groupName || !form.leader) {
      Alert.alert("알림", "목장과 목자 이름을 입력해주세요.");
      return;
    }
    try {
      const data = await AsyncStorage.getItem("reports");
      let reports = data ? JSON.parse(data) : [];
      const newId = route.params?.report?.id || Date.now().toString();
      const newReport = {
        ...form,
        id: newId,
        date:
          route.params?.report?.date || new Date().toLocaleDateString("ko-KR"),
      };

      if (route.params?.report) {
        reports = reports.map((r: Report) => (r.id === newId ? newReport : r));
      } else {
        reports = [newReport, ...reports];
      }

      await AsyncStorage.setItem("reports", JSON.stringify(reports));
      Alert.alert("저장 완료", "보고서가 안전하게 저장되었습니다.");
    } catch (e) {
      Alert.alert("오류", "저장에 실패했습니다.");
    }
  };

  const onShare = async () => {
    if (Platform.OS === "web") {
      Alert.alert("알림", "공유 기능은 스마트폰 앱에서만 가능합니다.");
      return;
    }
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert("오류", "이미지 생성에 실패했습니다.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <ViewShot ref={viewShotRef} options={{ format: "png", quality: 0.9 }}>
            <View style={styles.paper}>
              <Text style={[styles.mainTitle, { fontSize: 24 * fontScale }]}>
                목장교회 모임 보고서
              </Text>

              <View style={styles.headerInputRow}>
                <View style={styles.headerField}>
                  <Text
                    style={[styles.headerLabel, { fontSize: 16 * fontScale }]}
                  >
                    목장:
                  </Text>
                  <TextInput
                    style={styles.underlineInput}
                    value={form.groupName}
                    onChangeText={(t) => setForm({ ...form, groupName: t })}
                  />
                </View>
                <View style={styles.headerField}>
                  <Text
                    style={[styles.headerLabel, { fontSize: 16 * fontScale }]}
                  >
                    목자:
                  </Text>
                  <TextInput
                    style={styles.underlineInput}
                    value={form.leader}
                    onChangeText={(t) => setForm({ ...form, leader: t })}
                  />
                </View>
              </View>

              <View style={styles.table}>
                <View style={styles.row}>
                  <TableCell
                    label="모임장소"
                    value={form.location}
                    smallLabel
                    fontScale={fontScale}
                    multiline
                    customHeight={50}
                    onChange={(t: any) => setForm({ ...form, location: t })}
                  />
                  <TableCell
                    label="참석인원"
                    value={form.count}
                    smallLabel
                    fontScale={fontScale}
                    onChange={(t: any) => setForm({ ...form, count: t })}
                  />
                </View>
                <View style={styles.row}>
                  <TableCell
                    label="말씀요약자"
                    value={form.summary}
                    smallLabel
                    fontScale={fontScale}
                    onChange={(t: any) => setForm({ ...form, summary: t })}
                  />
                  <TableCell
                    label="시작기도자"
                    value={form.prayer}
                    smallLabel
                    fontScale={fontScale}
                    onChange={(t: any) => setForm({ ...form, prayer: t })}
                  />
                </View>
                <View style={styles.row}>
                  <TableCell
                    label="참석자 이름"
                    value={form.attendees}
                    multiline
                    fontScale={fontScale}
                    customHeight={80}
                    onChange={(t: any) => setForm({ ...form, attendees: t })}
                  />
                </View>
                <View style={styles.row}>
                  <TableCell
                    label={"결석자 이름\n(사유)"}
                    value={form.absentees}
                    multiline
                    fontScale={fontScale}
                    customHeight={80}
                    onChange={(t: any) => setForm({ ...form, absentees: t })}
                  />
                </View>
                <View style={styles.row}>
                  <TableCell
                    label={"특별사항\n(애경사, 새신자,\n양육과정)"}
                    value={form.special}
                    multiline
                    fontScale={fontScale}
                    customHeight={80}
                    onChange={(t: any) => setForm({ ...form, special: t })}
                  />
                </View>
                <View style={styles.row}>
                  <TableCell
                    label="목장의 기도제목"
                    value={form.prayerTopic}
                    multiline
                    fontScale={fontScale}
                    customHeight={130}
                    onChange={(t: any) => setForm({ ...form, prayerTopic: t })}
                  />
                </View>
              </View>

              <Text style={styles.footerNote}>
                * 이 보고서는 주일 예배후 목장모임을 마치고 제출바랍니다.
                (부목자가 이 보고서를 작성하여 제출하고, 목장모임을 사전에
                공지합니다)
              </Text>
            </View>
          </ViewShot>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.btnReset} onPress={resetForm}>
          <Text style={styles.btnTextReset}>새로쓰기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={onSave}>
          <Text style={styles.btnTextBlack}>저장하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={onShare}>
          <Text style={styles.btnTextWhite}>공유하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- 화면 2: 과거 기록 목록 ---
function HistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<Report[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", async () => {
      const data = await AsyncStorage.getItem("reports");
      if (data) setHistory(JSON.parse(data));
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.historyItem}
            onPress={() => navigation.navigate("작성", { report: item })}
          >
            <View>
              <Text style={styles.historyDate}>{item.date}</Text>
              <Text style={styles.historyTitle}>
                {item.groupName} 목장 - {item.leader} 목자
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>저장된 보고서가 없습니다.</Text>
        }
      />
    </View>
  );
}

// 2. 내비게이션 구성을 별도 컴포넌트로 분리 (Hook 사용을 위함)
function AppNavigator() {
  const insets = useSafeAreaInsets(); // 기기의 안전 영역(하단바 등) 높이 자동 계산

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: any;
          if (route.name === "작성") iconName = "create-outline";
          else if (route.name === "기록목록") iconName = "list-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#4e45e4",
        tabBarInactiveTintColor: "gray",
        tabBarLabelStyle: { fontSize: 14, fontWeight: "bold" },
        // 하단바 높이를 기기별 안전 영역에 맞춰 자동 조절
        tabBarStyle: {
          height: 60 + (insets.bottom > 0 ? insets.bottom : 10),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 5,
          backgroundColor: "#fff",
        },
        headerTitleStyle: { fontWeight: "bold", fontSize: 20 },
      })}
    >
      <Tab.Screen name="작성" component={ReportFormScreen} />
      <Tab.Screen name="기록목록" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

// 3. 최상단 App 컴포넌트에서 SafeAreaProvider로 감싸기
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  headerFontControls: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 10,
  },
  headerFontBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    backgroundColor: "#f0f0f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  fontBtnTextSmall: { fontSize: 18, color: "#4e45e4" },
  fontBtnTextLarge: { fontSize: 26, fontWeight: "bold", color: "#4e45e4" },
  paper: { backgroundColor: "#fff", padding: 15, margin: 5 },
  mainTitle: {
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
  },
  headerInputRow: { flexDirection: "row", marginBottom: 15 },
  headerField: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 5,
  },
  headerLabel: { fontWeight: "bold", marginRight: 5 },
  underlineInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    fontSize: 18,
    textAlign: "center",
    paddingBottom: 2,
  },
  table: { borderWidth: 1.5, borderColor: "#000" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#000" },
  cellContainer: { flexDirection: "row", minHeight: 50 },
  rowLabel: {
    width: 105,
    backgroundColor: "#f2f2f2",
    padding: 5,
    borderRightWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  labelText: {
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 16,
  },
  rowInput: {
    flex: 1,
    padding: 8,
    fontSize: 18,
    backgroundColor: "#fff",
    color: "#000",
  },
  bottomActions: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  btnPrimary: {
    flex: 1.2,
    backgroundColor: "#4e45e4",
    height: 55,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: "#fff",
    height: 55,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4e45e4",
    marginRight: 8,
  },
  btnReset: {
    width: 80,
    backgroundColor: "#eee",
    height: 55,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  btnTextWhite: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  btnTextBlack: { color: "#4e45e4", fontSize: 16, fontWeight: "bold" },
  btnTextReset: { color: "#666", fontSize: 14 },
  historyItem: {
    backgroundColor: "#fff",
    padding: 20,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    borderLeftWidth: 6,
    borderLeftColor: "#4e45e4",
    elevation: 2,
  },
  historyDate: { fontSize: 12, color: "#888", marginBottom: 4 },
  historyTitle: { fontSize: 17, fontWeight: "bold" },
  emptyText: {
    textAlign: "center",
    marginTop: 100,
    fontSize: 16,
    color: "#999",
  },
  footerNote: {
    marginTop: 15,
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
    paddingHorizontal: 5,
  },
});
