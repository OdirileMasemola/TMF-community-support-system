import { act, fireEvent, render, renderHook, screen } from "@testing-library/react-native";
import { AppButton, LoadingState } from "@/components/ui";
import { usePendingAction } from "@/hooks/usePendingAction";
import { useProofViewer } from "@/hooks/useProofViewer";
import { openDonationProof } from "@/lib/proofs";
import { ThemeProvider } from "@/theme/ThemeProvider";

jest.mock("lucide-react-native", () => new Proxy({}, { get: () => () => null }));
jest.mock("@/lib/proofs", () => ({ openDonationProof: jest.fn() }));

const mockedOpenProof = openDonationProof as jest.Mock;

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("loading indicators", () => {
  it("shows a spinner next to the label and blocks presses while a button is loading", () => {
    const onPress = jest.fn();
    render(
      <ThemeProvider>
        <AppButton label="Save changes" onPress={onPress} loading />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button");
    expect(screen.getByText("Save changes")).toBeTruthy();
    expect(screen.getByLabelText("Save changes in progress")).toBeTruthy();
    expect(button.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true, busy: true }));
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders the loading message with a busy progress role", () => {
    render(
      <ThemeProvider>
        <LoadingState label="Loading your donations…" />
      </ThemeProvider>,
    );

    expect(screen.getByText("Loading your donations…")).toBeTruthy();
    expect(screen.getByRole("progressbar").props.accessibilityState).toEqual({ busy: true });
  });

  it("reports pending while an action runs and ignores repeat presses", async () => {
    const gate = deferred();
    const action = jest.fn(() => gate.promise);
    const { result } = renderHook(() => usePendingAction(action));

    let first!: Promise<void>;
    act(() => {
      first = result.current[0]();
    });
    expect(result.current[1]).toBe(true);

    await act(async () => {
      await result.current[0]();
    });
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      gate.resolve();
      await first;
    });
    expect(result.current[1]).toBe(false);
  });

  it("marks only the proof being opened as loading, and clears it once the link is ready", async () => {
    const gate = deferred();
    let urlReady: (() => void) | undefined;
    mockedOpenProof.mockImplementation((_proof, options: { onUrlReady?: () => void }) => {
      urlReady = options.onUrlReady;
      return gate.promise;
    });

    const { result } = renderHook(() => useProofViewer());
    let opening!: Promise<void>;
    act(() => {
      opening = result.current.open({ id: "proof-1", file_path: "user/pop.pdf", signed_url: null });
    });
    expect(result.current.openingId).toBe("proof-1");

    act(() => urlReady?.());
    expect(result.current.openingId).toBeNull();

    await act(async () => {
      gate.resolve();
      await opening;
    });
    expect(result.current.openingId).toBeNull();
  });
});
