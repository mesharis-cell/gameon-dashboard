"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Proposal } from "@/lib/types/proposals";

// Register fonts (optional - using default fonts for now)
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf',
// });

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#E63946",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#333333",
    marginBottom: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E63946",
    marginBottom: 10,
    borderBottom: "2 solid #E63946",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    color: "#666666",
  },
  value: {
    fontSize: 11,
    color: "#333333",
    fontWeight: "bold",
  },
  totalValueContainer: {
    backgroundColor: "#FEF2F2",
    padding: 20,
    borderRadius: 8,
    marginVertical: 20,
    textAlign: "center",
  },
  totalValueLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#E63946",
  },
  brandsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  brandBadge: {
    backgroundColor: "#F3F4F6",
    padding: "6 12",
    borderRadius: 4,
    fontSize: 10,
    color: "#333333",
  },
  activationItem: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  activationName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  activationDetails: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 2,
  },
  breakdownTable: {
    marginTop: 10,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottom: "1 solid #E5E7EB",
  },
  breakdownLabel: {
    fontSize: 11,
    color: "#666666",
  },
  breakdownValue: {
    fontSize: 11,
    color: "#333333",
    fontWeight: "bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#999999",
  },
  tierBadge: {
    backgroundColor: "#FEF3C7",
    padding: "4 8",
    borderRadius: 4,
    fontSize: 10,
    color: "#92400E",
    marginLeft: 8,
  },
});

interface PdfDocumentProps {
  proposal: Proposal;
  level?: "simple" | "standard" | "detailed";
}

export const ProposalPdfDocument: React.FC<PdfDocumentProps> = ({
  proposal,
  level = "standard",
}) => {
  const formatCurrency = (value: string | number) => {
    return `AED ${parseFloat(value?.toString() || "0").toLocaleString("en-AE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const calculatedActivationValue = (proposal.activations || []).reduce(
    (sum, pa) => sum + parseFloat(pa.calculatedValue || "0"),
    0
  );

  const calculatedTotalValue =
    calculatedActivationValue +
    parseFloat(proposal.tradeDealValue || "0") +
    parseFloat(proposal.focValue || "0") +
    parseFloat(proposal.creditNoteValue || "0") +
    parseFloat(proposal.boosterValue || "0");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>GAME ON</Text>
          <Text style={styles.subtitle}>Partnership Proposal</Text>
          <Text style={{ fontSize: 12, color: "#666666", marginTop: 8 }}>
            {proposal.name}
          </Text>
        </View>

        {/* Venue Information */}
        {proposal.venue && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Venue Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Venue Name:</Text>
              <Text style={styles.value}>{proposal.venue.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tier:</Text>
              <Text style={styles.value}>{proposal.venue.tier.toUpperCase()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Customer Code:</Text>
              <Text style={styles.value}>{proposal.venue.customerCode}</Text>
            </View>
          </View>
        )}

        {/* Total Value - Prominent */}
        <View style={styles.totalValueContainer}>
          <Text style={styles.totalValueLabel}>Total Partnership Value</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(calculatedTotalValue)}
          </Text>
        </View>

        {/* Value Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Value Breakdown</Text>
          <View style={styles.breakdownTable}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Activation Value</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(calculatedActivationValue)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Trade Deals</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(proposal.tradeDealValue || "0")}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Additional FOC</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(proposal.focValue || "0")}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Credit Notes</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(proposal.creditNoteValue || "0")}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Booster Value</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(proposal.boosterValue || "0")}
              </Text>
            </View>
          </View>
        </View>

        {/* Selected Brands */}
        {proposal.brands && proposal.brands.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Brands</Text>
            <View style={styles.brandsList}>
              {proposal.brands.map((brand) => (
                <View key={brand.id} style={styles.brandBadge}>
                  <Text>
                    {brand.name}
                    {brand.premium ? " ⭐" : ""}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Selected Activations */}
        {proposal.activations && proposal.activations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Selected Activations ({proposal.activations.length})
            </Text>
            {proposal.activations.slice(0, 5).map((pa) => (
              <View key={pa.id} style={styles.activationItem}>
                <Text style={styles.activationName}>
                  {pa.activation?.name || "Unknown Activation"}
                </Text>
                <Text style={styles.activationDetails}>
                  Type: {pa.activation?.activationType || "N/A"} | Months:{" "}
                  {pa.selectedMonths.join(", ")}
                </Text>
                <Text style={styles.activationDetails}>
                  Value: {formatCurrency(pa.calculatedValue || "0")}
                </Text>
              </View>
            ))}
            {proposal.activations.length > 5 && (
              <Text style={{ fontSize: 10, color: "#666666", marginTop: 8 }}>
                ... and {proposal.activations.length - 5} more activations
              </Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated by GAME ON Sales Platform</Text>
          <Text>{new Date().toLocaleDateString("en-AE")}</Text>
        </View>
      </Page>
    </Document>
  );
};