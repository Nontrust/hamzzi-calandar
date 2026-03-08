import { ScrollView, Text, View } from "react-native";
import { styles } from "../src/ui/appStyles";

export default function AnniversariesPage() {
  return (
    <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>기념일 관리</Text>
        <Text style={styles.sectionSub}>기념일 추가/수정/삭제 기능을 이 페이지로 점진 분리할 예정입니다.</Text>
      </View>
    </ScrollView>
  );
}
