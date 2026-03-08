import { ScrollView, Text, View } from "react-native";
import { styles } from "../src/ui/appStyles";

export default function SettingsPage() {
  return (
    <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>설정</Text>
        <Text style={styles.sectionSub}>계정, 권한, 앱 환경 옵션을 이 페이지로 정리할 예정입니다.</Text>
      </View>
    </ScrollView>
  );
}
