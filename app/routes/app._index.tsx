import { useEffect } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Box,
  List,
  Link,
  Badge,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchShopData } from "../store/shopSlice";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { shopDomain: session.shop };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node { id price barcode createdAt }
              }
            }
            demoInfo: metafield(namespace: "$app", key: "demo_info") {
              jsonValue
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
          metafields: [
            {
              namespace: "$app",
              key: "demo_info",
              value: "Created by React Router Template",
            },
          ],
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data!.productCreate!.product!;
  const variantId = product.variants.edges[0]!.node!.id!;

  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyReactRouterTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants { id price barcode createdAt }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );
  const variantResponseJson = await variantResponse.json();

  const metaobjectResponse = await admin.graphql(
    `#graphql
    mutation shopifyReactRouterTemplateUpsertMetaobject($handle: MetaobjectHandleInput!, $values: JSON!) {
      metaobjectUpsert(handle: $handle, values: $values) {
        metaobject { id handle values }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        handle: { type: "$app:example", handle: "demo-entry" },
        values: {
          title: "Demo Entry",
          description:
            "This metaobject was created by the Shopify app template to demonstrate the metaobject API.",
        },
      },
    },
  );
  const metaobjectResponseJson = await metaobjectResponse.json();

  return {
    product: responseJson!.data!.productCreate!.product,
    variant:
      variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
    metaobject: metaobjectResponseJson!.data!.metaobjectUpsert!.metaobject,
  };
};

function CodeBlock({ data }: { data: unknown }) {
  return (
    <Box padding="400" borderWidth="025" borderRadius="200" background="bg-surface-secondary">
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </Box>
  );
}

export default function Index() {
  const { shopDomain } = useLoaderData<typeof loader>();
  const dispatch = useAppDispatch();
  const shop = useAppSelector((s) => s.shop.data);
  const shopLoading = useAppSelector((s) => s.shop.loading);

  useEffect(() => {
    dispatch(fetchShopData(shopDomain));
  }, [dispatch, shopDomain]);

  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.data?.product?.id) {
      shopify.toast.show("Product created");
    }
  }, [fetcher.data?.product?.id, shopify]);

  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <Page
      title="Shopify app template"
      primaryAction={{
        content: "Generate a product",
        onAction: generateProduct,
        loading: isLoading,
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h2" variant="headingMd">
                    Store information
                  </Text>
                  {shopLoading && <Badge>Loading…</Badge>}
                </InlineStack>
                {shop && (
                  <BlockStack gap="100">
                    <Text as="p" fontWeight="medium">
                      {shop.name}
                    </Text>
                    <Text as="p" tone="subdued">
                      {shop.shopDomain}
                    </Text>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  New app
                </Text>
                <Text as="p">
                  This embedded app template uses{" "}
                  <Link url="https://shopify.dev/docs/apps/tools/app-bridge" target="_blank">
                    App Bridge
                  </Link>{" "}
                  interface examples like an{" "}
                  <Link url="/app/additional">additional page in the app nav</Link>,
                  as well as an{" "}
                  <Link url="https://shopify.dev/docs/api/admin-graphql" target="_blank">
                    Admin GraphQL
                  </Link>{" "}
                  mutation demo, to provide a starting point for app development.
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Get started with products
                </Text>
                <Text as="p">
                  Generate a product with GraphQL and get the JSON output for
                  that product. Learn more about the{" "}
                  <Link
                    url="https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate"
                    target="_blank"
                  >
                    productCreate
                  </Link>{" "}
                  mutation in our API references.
                </Text>
                <InlineStack gap="200">
                  <Button onClick={generateProduct} loading={isLoading}>
                    Generate a product
                  </Button>
                  {fetcher.data?.product && (
                    <Button
                      variant="tertiary"
                      onClick={() => {
                        shopify.intents.invoke?.("edit:shopify/Product", {
                          value: fetcher.data?.product?.id,
                        });
                      }}
                    >
                      Edit product
                    </Button>
                  )}
                </InlineStack>

                {fetcher.data?.product && (
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingSm">
                      productCreate mutation
                    </Text>
                    <CodeBlock data={fetcher.data.product} />

                    <Text as="h3" variant="headingSm">
                      productVariantsBulkUpdate mutation
                    </Text>
                    <CodeBlock data={fetcher.data.variant} />

                    <Text as="h3" variant="headingSm">
                      metaobjectUpsert mutation
                    </Text>
                    <CodeBlock data={fetcher.data.metaobject} />
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  App template specs
                </Text>
                <Text as="p">
                  Framework:{" "}
                  <Link url="https://reactrouter.com/" target="_blank">
                    React Router
                  </Link>
                </Text>
                <Text as="p">
                  Interface:{" "}
                  <Link
                    url="https://shopify.dev/docs/api/app-home/using-polaris-components"
                    target="_blank"
                  >
                    Polaris React
                  </Link>
                </Text>
                <Text as="p">
                  API:{" "}
                  <Link url="https://shopify.dev/docs/api/admin-graphql" target="_blank">
                    GraphQL
                  </Link>
                </Text>
                <Text as="p">
                  Custom data:{" "}
                  <Link url="https://shopify.dev/docs/apps/build/custom-data" target="_blank">
                    Metafields &amp; metaobjects
                  </Link>
                </Text>
                <Text as="p">Database: MySQL (Sequelize)</Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Next steps
                </Text>
                <List>
                  <List.Item>
                    Build an{" "}
                    <Link
                      url="https://shopify.dev/docs/apps/getting-started/build-app-example"
                      target="_blank"
                    >
                      example app
                    </Link>
                  </List.Item>
                  <List.Item>
                    Explore Shopify&apos;s API with{" "}
                    <Link
                      url="https://shopify.dev/docs/apps/tools/graphiql-admin-api"
                      target="_blank"
                    >
                      GraphiQL
                    </Link>
                  </List.Item>
                </List>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};