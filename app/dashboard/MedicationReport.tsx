import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
});

export const createMedicationReport = (data: any) => (
  <Document>
    <Page style={styles.page}>
      <Text>Medication Report</Text>
      <Text>Patient: {data.name}</Text>
      <Text>Adherence: {data.adherence}%</Text>
    </Page>
  </Document>
);