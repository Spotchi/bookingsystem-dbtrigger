// Test file for language detection functionality
import {
  detectLanguage,
  getTemplateFromLanguageCode,
} from "../src/language-utils.ts";

// Test cases for language detection
const testCases = [
  { input: null, expected: "en" },
  { input: undefined, expected: "en" },
  { input: "", expected: "en" },
  { input: "en", expected: "en" },
  { input: "en-US", expected: "en" },
  { input: "EN", expected: "en" },
  { input: "fr", expected: "fr" },
  { input: "fr-FR", expected: "fr" },
  { input: "FR-CA", expected: "fr" },
  { input: "nl", expected: "nl" },
  { input: "nl-NL", expected: "nl" },
  { input: "du", expected: "nl" },
  { input: "es", expected: "en" }, // Fallback to English
  { input: "de", expected: "en" }, // Fallback to English
];

// Run tests
console.log("Testing language detection...");
let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach(({ input, expected }, index) => {
  const result = detectLanguage(input);
  const passed = result === expected;

  if (passed) {
    passedTests++;
    console.log(
      `✅ Test ${index + 1}: ${input} → ${result} (Expected: ${expected})`
    );
  } else {
    console.log(
      `❌ Test ${index + 1}: ${input} → ${result} (Expected: ${expected})`
    );
  }
});

console.log(`\nResults: ${passedTests}/${totalTests} tests passed`);

// Test template retrieval
console.log("\nTesting template retrieval...");
const englishTemplate = getTemplateFromLanguageCode("en");
const frenchTemplate = getTemplateFromLanguageCode("fr");
const dutchTemplate = getTemplateFromLanguageCode("nl");

console.log(
  "English subject:",
  englishTemplate.newBooking.subject("Test Booking")
);
console.log(
  "French subject:",
  frenchTemplate.newBooking.subject("Test Booking")
);
console.log("Dutch subject:", dutchTemplate.newBooking.subject("Test Booking"));

console.log("\nLanguage detection tests completed!");
