import { ScrollView, Text, View } from "react-native";
import { styles } from "../src/ui/appStyles";

export default function SchedulePage() {
  return (
    <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>일정</Text>
        <Text style={styles.sectionSub}>월간 타임라인/동기화 상태를 이 페이지에서 집중 관리할 예정입니다.</Text>
      </View>
    </ScrollView>
  );
}
