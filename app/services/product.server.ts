import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

export async function getAllProducts(admin: AdminApiContext) {
  let hasNextPage = true;
  let cursor: string | null = null;
  const allProducts: any[] = [];

  while (hasNextPage) {
    const response: Response = await admin.graphql(
      `
      query getProducts($cursor: String) {
        products(first: 250, after: $cursor) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              title
              tags
              featuredImage {
                url
              }
              variants(first: 1) {
                edges {
                  node {
                    price
                  }
                }
              }
            }
          }
        }
      }
      `,
      {
        variables: {
          cursor,
        },
      }
    );

    const json: any = await response.json();
    const data: any = json.data?.products;

    if (!data) {
      break;
    }

    const products = data.edges.map((e: any) => ({
      id: e.node.id,
      title: e.node.title,
      tags: e.node.tags,
      image: e.node.featuredImage?.url ?? undefined,
      originalPrice: Number(e.node.variants.edges[0]?.node?.price || 0),
    }));

    allProducts.push(...products);

    hasNextPage = data.pageInfo.hasNextPage;
    cursor = data.pageInfo.endCursor;
  }

  return allProducts;
}
