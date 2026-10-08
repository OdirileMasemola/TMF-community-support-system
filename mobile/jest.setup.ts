/* Native modules that have no JavaScript implementation under Jest. */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("react-native-safe-area-context", () => require("react-native-safe-area-context/jest/mock").default);
