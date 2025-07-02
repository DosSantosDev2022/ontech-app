// lib/hygraph.ts

import { GraphQLClient, gql } from 'graphql-request';

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: string;
  // Novos campos para a página de detalhes
  coverImage?: string; // Imagem de capa, se for diferente da imageUrl
  technicalSpecs?: {
    [key: string]: string; // Objeto para ficha técnica (ex: { "Peso": "2kg", "Dimensões": "10x10x5cm" })
  };
  affiliateLinks?: {
    name: string; // Nome da loja (ex: "Amazon", "Magazine Luiza")
    url: string; // URL do link de afiliado
  }[];
  longDescription?: string; // Uma descrição mais longa para a página de detalhes

}

// Defina sua URL da API Hygraph a partir das variáveis de ambiente
const HYGRAPH_API_URL = process.env.NEXT_PUBLIC_HYGRAPH_API_URL;

// Crie uma instância do cliente GraphQL
const graphQLClient = new GraphQLClient(HYGRAPH_API_URL!, {
  headers: {
    // Se você tem um token de acesso, adicione-o aqui.
    // Para APIs públicas ou conteúdo de leitura, pode não ser necessário.
    // authorization: `Bearer ${process.env.HYGRAPH_ACCESS_TOKEN}`,
  },
});

// --- QUERIES GraphQL ---

// Query para buscar múltiplos produtos (para a lista com scroll infinito)
const GET_PRODUCTS_QUERY = gql`
  query GetProducts(
    $first: Int = 12,
    $skip: Int = 0,
    $category: String,
    $searchTerm: String
  ) {
    products(
      first: $first,
      skip: $skip,
      where: {
        AND: [
          { category_contains: $category } # Filtro por categoria (ajuste conforme seu schema)
          { OR: [ # Filtro por termo de busca (ajuste conforme seu schema)
              { name_contains: $searchTerm },
              { description_contains: $searchTerm },
              { longDescription_contains: $searchTerm }
            ]
          }
        ]
      }
      orderBy: createdAt_DESC # Exemplo de ordenação
    ) {
      id
      name
      price
      imageUrl { # Hygraph geralmente retorna Assets com URLs
        url
      }
      description
      category
      # Campos para a página de detalhes (alguns podem não ser necessários aqui, mas para consistência)
      coverImage {
        url
      }
      technicalSpecs {
        key
        value
      }
      affiliateLinks {
        name
        url
      }
      longDescription
    }
    productsConnection(
        where: {
            AND: [
                { category_contains: $category }
                { OR: [
                    { name_contains: $searchTerm },
                    { description_contains: $searchTerm },
                    { longDescription_contains: $searchTerm }
                ]}
            ]
        }
    ) {
        aggregate {
            count
        }
    }
  }
`;

// Query para buscar um único produto por ID
const GET_PRODUCT_BY_ID_QUERY = gql`
  query GetProductById($id: ID!) {
    product(where: { id: $id }) {
      id
      name
      price
      imageUrl {
        url
      }
      description
      category
      coverImage {
        url
      }
      technicalSpecs {
        key
        value
      }
      affiliateLinks {
        name
        url
      }
      longDescription
    }
  }
`;

// Query para buscar todas as categorias (para os botões de filtro)
// Isso assume que você tem um campo 'category' nos seus produtos ou um modelo 'Category'
const GET_CATEGORIES_QUERY = gql`
  query GetCategories {
    productsConnection {
      edges {
        node {
          category
        }
      }
    }
  }
`;

// --- Funções de Busca ---

interface GetProductsOptions {
  page?: number;
  limit?: number;
  category?: string;
  searchTerm?: string;
}

interface HygraphProduct {
    id: string;
    name: string;
    price: number;
    imageUrl: { url: string };
    description: string;
    category: string;
    coverImage?: { url: string };
    technicalSpecs?: { key: string; value: string }[];
    affiliateLinks?: { name: string; url: string }[];
    longDescription?: string;
}

interface HygraphResponse {
  products: HygraphProduct[];
  productsConnection: {
      aggregate: {
          count: number;
      }
  }
}

// Função para mapear o formato do Hygraph para a nossa interface Product
const mapHygraphProductToProduct = (hygraphProduct: HygraphProduct): Product => {
    // Certifique-se de que os campos do Hygraph (como `imageUrl.url`) correspondem ao seu schema
    // Se `technicalSpecs` e `affiliateLinks` forem de um tipo `JSON` ou `Rich Text` no Hygraph,
    // você precisará de uma lógica de parse mais robusta aqui.
    // Assumimos aqui que technicalSpecs é uma lista de objetos {key: string, value: string}
    // e affiliateLinks é uma lista de objetos {name: string, url: string}
    const technicalSpecsMap: { [key: string]: string } = {};
    if (hygraphProduct.technicalSpecs) {
        hygraphProduct.technicalSpecs.forEach(spec => {
            technicalSpecsMap[spec.key] = spec.value;
        });
    }

    return {
        id: hygraphProduct.id,
        name: hygraphProduct.name,
        price: hygraphProduct.price,
        imageUrl: hygraphProduct.imageUrl?.url,
        description: hygraphProduct.description,
        category: hygraphProduct.category,
        coverImage: hygraphProduct.coverImage?.url,
        technicalSpecs: technicalSpecsMap,
        affiliateLinks: hygraphProduct.affiliateLinks,
        longDescription: hygraphProduct.longDescription,
    };
};

export async function getProductsFromHygraph({ page = 1, limit = 12, category, searchTerm }: GetProductsOptions): Promise<{ products: Product[], totalProducts: number }> {
  if (!HYGRAPH_API_URL) {
    throw new Error("HYGRAPH_API_URL não está configurada.");
  }

  const skip = (page - 1) * limit;

  // Variáveis para a query
  const variables = {
    first: limit,
    skip,
    category: category && category !== "Todas" ? category : undefined,
    searchTerm: searchTerm ? searchTerm : undefined,
  };

  try {
    const data = await graphQLClient.request<HygraphResponse>(GET_PRODUCTS_QUERY, variables);

    const products = data.products.map(mapHygraphProductToProduct);
    const totalProducts = data.productsConnection.aggregate.count;

    return { products, totalProducts };
  } catch (error) {
    console.error("Erro ao buscar produtos do Hygraph:", error);
    throw new Error("Não foi possível carregar os produtos do Hygraph.");
  }
}

export async function getProductByIdFromHygraph(id: string): Promise<Product | undefined> {
  if (!HYGRAPH_API_URL) {
    throw new Error("HYGRAPH_API_URL não está configurada.");
  }

  try {
    const data = await graphQLClient.request<{ product: HygraphProduct }>(GET_PRODUCT_BY_ID_QUERY, { id });
    return data.product ? mapHygraphProductToProduct(data.product) : undefined;
  } catch (error) {
    console.error(`Erro ao buscar produto ${id} do Hygraph:`, error);
    throw new Error(`Não foi possível carregar o produto ${id} do Hygraph.`);
  }
}

export async function getCategoriesFromHygraph(): Promise<string[]> {
  if (!HYGRAPH_API_URL) {
    throw new Error("HYGRAPH_API_URL não está configurada.");
  }

  try {
    const data = await graphQLClient.request<{ productsConnection: { edges: { node: { category: string } }[] } }>(GET_CATEGORIES_QUERY);
    const uniqueCategories = new Set<string>();
    data.productsConnection.edges.forEach(edge => {
        if (edge.node.category) {
            uniqueCategories.add(edge.node.category);
        }
    });
    return ["Todas", ...Array.from(uniqueCategories)];
  } catch (error) {
    console.error("Erro ao buscar categorias do Hygraph:", error);
    throw new Error("Não foi possível carregar as categorias do Hygraph.");
  }
}