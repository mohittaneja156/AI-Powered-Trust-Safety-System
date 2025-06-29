import RootLayout from "@/components/RootLayout";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Provider } from 'react-redux'
import { persistor, store } from "@/store/store";
import { PersistGate } from 'redux-persist/integration/react';
import { SessionProvider } from "next-auth/react";

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session} refetchInterval={0}>
      <Provider store={store}>
        <PersistGate persistor={persistor} loading={null}>
          <div className="font-bodyFont bg-gray_light">
            <RootLayout>
              <Component {...pageProps} />
            </RootLayout>
          </div>
        </PersistGate>
      </Provider>
    </SessionProvider>
  );
}
