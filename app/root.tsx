import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store/store";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

export function links() {
  return [
    { rel: "stylesheet", href: polarisStyles },
  ];
}

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <ReduxProvider store={store}>
          <Outlet />
        </ReduxProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}