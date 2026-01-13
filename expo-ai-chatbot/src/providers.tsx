import type React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ColorSchemeProvider } from "@/design-system/color-scheme/provider";
import { Toaster } from "@/components/sonner";
import { AuthProvider } from "@/services/auth/useAuth";
import NativewindThemeProvider from "./ThemeProvider";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ColorSchemeProvider>
        <Toaster />
        <AuthProvider>
          <NativewindThemeProvider>
            <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
          </NativewindThemeProvider>
        </AuthProvider>
      </ColorSchemeProvider>
    </GestureHandlerRootView>
  );
}

export default Providers;
