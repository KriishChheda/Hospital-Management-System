"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// ── Types ──
export interface PatientPDFData {
  id: string;
  patientCode?: string;
  name: string;
  age: number;
  gender: string;
  dateOfBirth: string;
  bloodGroup?: string;
  maritalStatus?: string;
  nationality?: string;
  critical?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  aadhaarNumber?: string;
  allergies?: string;
  existingConditions?: string[];
  currentMedications?: string;
  pastSurgeries?: string;
  disabilityInfo?: string;
  createdAt?: string;
}

// ── Styles ──
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  header: {
    backgroundColor: "#0f2a44",
    padding: 20,
    marginBottom: 20,
    marginTop: -40,
    marginLeft: -40,
    marginRight: -40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  headerSub: {
    color: "#00b4d8",
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerLabel: {
    color: "#00b4d8",
    fontSize: 8,
    letterSpacing: 1,
  },
  headerValue: {
    color: "#ffffff",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0f2a44",
    borderBottomWidth: 1,
    borderBottomColor: "#e6f4f8",
    paddingBottom: 4,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  fieldGroup: {
    width: "33.33%",
    paddingRight: 10,
  },
  fieldGroupHalf: {
    width: "50%",
    paddingRight: 10,
  },
  fieldLabel: {
    fontSize: 8,
    color: "#64748b",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 10,
    color: "#1e293b",
    fontFamily: "Helvetica-Bold",
  },
  conditionBadge: {
    backgroundColor: "#e6f4f8",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  conditionText: {
    fontSize: 9,
    color: "#0f2a44",
  },
  conditionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  textBlock: {
    fontSize: 10,
    color: "#1e293b",
    lineHeight: 1.4,
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e6f4f8",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#64748b",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e6f4f8",
    marginVertical: 12,
  },
});

// ── Helpers ──
function FieldItem({ label, value, width = "33.33%" }: { label: string; value?: string | null; width?: string }) {
  return (
    <View style={{ width, paddingRight: 10, marginBottom: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || "—"}</Text>
    </View>
  );
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatAadhaar(num?: string) {
  if (!num) return "—";
  return num.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3");
}

// ── PDF Document Component ──
export default function PatientRegistrationPDF({ patient }: { patient: PatientPDFData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Patient Registration</Text>
            <Text style={styles.headerSub}>HOSPITAL MANAGEMENT SYSTEM</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>PATIENT ID</Text>
            <Text style={styles.headerValue}>{patient.patientCode || patient.id}</Text>
            <Text style={{ ...styles.headerLabel, marginTop: 6 }}>REGISTERED ON</Text>
            <Text style={{ ...styles.headerValue, fontSize: 9 }}>
              {patient.createdAt ? formatDate(patient.createdAt) : new Date().toLocaleDateString("en-IN")}
            </Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.row}>
            <FieldItem label="FULL NAME" value={patient.name} />
            <FieldItem label="AGE" value={patient.age ? `${patient.age} years` : undefined} />
            <FieldItem label="GENDER" value={patient.gender} />
          </View>
          <View style={styles.row}>
            <FieldItem label="DATE OF BIRTH" value={formatDate(patient.dateOfBirth)} />
            <FieldItem label="BLOOD GROUP" value={patient.bloodGroup} />
            <FieldItem label="MARITAL STATUS" value={patient.maritalStatus} />
          </View>
          <View style={styles.row}>
            <FieldItem label="NATIONALITY" value={patient.nationality} />
            <FieldItem label="CRITICAL LEVEL" value={patient.critical ? patient.critical.toUpperCase() : "LOW"} />
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.row}>
            <FieldItem label="MOBILE NUMBER" value={patient.phone} />
            <FieldItem label="ALTERNATE NUMBER" value={patient.alternatePhone} />
            <FieldItem label="EMAIL" value={patient.email} />
          </View>
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <View style={styles.row}>
            <FieldItem label="ADDRESS LINE 1" value={patient.addressLine1} width="50%" />
            <FieldItem label="ADDRESS LINE 2" value={patient.addressLine2} width="50%" />
          </View>
          <View style={styles.row}>
            <FieldItem label="CITY" value={patient.city} />
            <FieldItem label="STATE" value={patient.state} />
            <FieldItem label="PINCODE" value={patient.pincode} />
          </View>
          <View style={styles.row}>
            <FieldItem label="COUNTRY" value={patient.country} />
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <View style={styles.row}>
            <FieldItem label="CONTACT NAME" value={patient.emergencyContactName} />
            <FieldItem label="RELATIONSHIP" value={patient.emergencyContactRelationship} />
            <FieldItem label="CONTACT NUMBER" value={patient.emergencyContactPhone} />
          </View>
        </View>

        {/* Identification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identification</Text>
          <View style={styles.row}>
            <FieldItem label="AADHAAR NUMBER" value={formatAadhaar(patient.aadhaarNumber)} />
          </View>
        </View>

        {/* Medical History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical History</Text>

          {patient.allergies && (
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.fieldLabel}>ALLERGIES</Text>
              <Text style={styles.textBlock}>{patient.allergies}</Text>
            </View>
          )}

          {patient.existingConditions && patient.existingConditions.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.fieldLabel}>EXISTING CONDITIONS</Text>
              <View style={styles.conditionsRow}>
                {patient.existingConditions.map((c, i) => (
                  <View key={i} style={styles.conditionBadge}>
                    <Text style={styles.conditionText}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.row}>
            <FieldItem label="CURRENT MEDICATIONS" value={patient.currentMedications} width="50%" />
            <FieldItem label="PAST SURGERIES" value={patient.pastSurgeries} width="50%" />
          </View>

          {patient.disabilityInfo && (
            <View>
              <Text style={styles.fieldLabel}>DISABILITY INFORMATION</Text>
              <Text style={styles.textBlock}>{patient.disabilityInfo}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on {new Date().toLocaleDateString("en-IN")} at {new Date().toLocaleTimeString("en-IN")}
          </Text>
          <Text style={styles.footerText}>Hospital Management System — Confidential</Text>
        </View>
      </Page>
    </Document>
  );
}
