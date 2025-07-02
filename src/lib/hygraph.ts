import type { RichTextContent } from '@graphcms/rich-text-types'

import { GraphQLClient, gql } from 'graphql-request';

// Interface para a Categoria, pois ela agora possui um 'name' no Hygraph
export interface ProductCategory {
  name: string;
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  // O campo 'category' agora é do tipo ProductCategory (ou seja, um objeto com 'name')
  category: ProductCategory;
  // Novos campos para a página de detalhes
  coverImage?: string; // Imagem de capa, se for diferente da imageUrl
  technicalSpecs?: {
    raw: RichTextContent
  };
  affiliateLinks?: {
    name: string; // Nome da loja (ex: "Amazon", "Magazine Luiza")
    url: string; // URL do link de afiliado
  }[];
  longDescription?: {
    raw: RichTextContent
  }; // Uma descrição mais longa para a página de detalhes
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
    # Remove as variáveis aqui, elas serão passadas no objeto 'where'
    $where: ProductWhereInput # Define o tipo do filtro 'where'
  ) {
    products(
      first: $first,
      skip: $skip,
      where: $where # Usa a variável $where diretamente
      orderBy: createdAt_DESC # Exemplo de ordenação
    ) {
      id
      name
      imageUrl {
        url
      }
      description
      category { # Busca o subcampo 'name' da categoria
        name
      }
      coverImage {
        url
      }
      technicalSpecs {
        raw
      }
      affiliateLink {
        name
        url
      }
      longDescription {
        raw
      }
    }
    productsConnection(
        where: $where # Usa a variável $where diretamente para a conexão também
    ) {
        aggregate {
            count
        }
    }
  }
`;

// Query para buscar um único produto por ID (esta não precisa de filtro de categoria dinâmico)
const GET_PRODUCT_BY_ID_QUERY = gql`
  query GetProductById($id: ID!) {
    product(where: { id: $id }) {
      id
      name
      imageUrl {
        url
      }
      description
      category { # Busca o subcampo 'name' da categoria
        name
      }
      coverImage {
        url
      }
      technicalSpecs {
        raw
      }
      affiliateLink {
        name
        url
      }
      longDescription {
        raw
      }
    }
  }
`;

// Query para buscar todas as categorias
const GET_CATEGORIES_QUERY = gql`
  query GetCategories {
    productsConnection {
      edges {
        node {
          category { # Busca o subcampo 'name' da categoria
            name
          }
        }
      }
    }
  }
`;

// --- Funções de Busca ---

interface GetProductsOptions {
  page?: number;
  limit?: number;
  category?: string; // O filtro de categoria ainda é uma string (o nome da categoria)
  searchTerm?: string;
}

interface HygraphProduct {
    id: string;
    name: string;
    imageUrl: { url: string };
    description: string
    category: {
      name: string
    };
    coverImage?: { url: string };
    technicalSpecs?: {
      raw: RichTextContent
    };
    affiliateLinks?: { name: string; url: string }[];
    longDescription?: {
      raw: RichTextContent
    };
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
    return {
        id: hygraphProduct.id,
        name: hygraphProduct.name,
        imageUrl: hygraphProduct.imageUrl?.url,
        description: hygraphProduct.description,
        // Mapeia o objeto de categoria para apenas o nome, como esperado pela interface Product
        category: { name: hygraphProduct.category.name },
        coverImage: hygraphProduct.coverImage?.url,
        technicalSpecs: hygraphProduct.technicalSpecs,
        affiliateLinks: hygraphProduct.affiliateLinks,
        longDescription: hygraphProduct.longDescription,
    };
};

export async function getProductsFromHygraph({ page = 1, limit = 12, category, searchTerm }: GetProductsOptions): Promise<{ products: Product[], totalProducts: number }> {
  if (!HYGRAPH_API_URL) {
    throw new Error("HYGRAPH_API_URL não está configurada.");
  }

  const skip = (page - 1) * limit;

  // Array para armazenar as condições de filtro
  const conditions: any[] = [];

  // 1. Adicionar filtros de termo de busca APENAS SE searchTerm existir
  const searchTermConditions: any[] = [];
  if (searchTerm) {
    searchTermConditions.push({ name_contains: searchTerm });
    searchTermConditions.push({ description_contains: searchTerm });
    searchTermConditions.push({ longDescription_contains: searchTerm });
  }

  // Se houver condições de searchTerm, adicione-as ao array principal como um OR
  if (searchTermConditions.length > 0) {
    conditions.push({ OR: searchTermConditions });
  }

  // 2. Adicionar filtro de categoria APENAS SE category for fornecido e diferente de "Todas"
  if (category && category !== "Todas") {
    conditions.push({ category: { name_contains: category } });
  }

  // Crie o objeto 'where' final
  // Se houver múltiplas condições, elas serão combinadas com AND implicitamente no Hygraph
  // Se não houver condições, o objeto 'where' pode ser vazio ou nulo (que busca tudo)
  const whereConditions = conditions.length > 0 ? { AND: conditions } : {};

  // Se não houver nenhum filtro (nem searchTerm, nem category), o objeto whereConditions será `{}` (vazio),
  // o que fará com que a query retorne todos os produtos. Se `conditions` estiver vazio,
  // e você quiser um `{}` literal para o `where` na query, é só passar `whereConditions` como está.


  // Variáveis para a query
  const variables = {
    first: limit,
    skip,
    where: whereConditions // Passamos o objeto 'where' construído dinamicamente
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
    const data = await graphQLClient.request<{ productsConnection: { edges: { node: { category: { name: string } } }[] } }>(GET_CATEGORIES_QUERY);
    const uniqueCategories = new Set<string>();
    data.productsConnection.edges.forEach(edge => {
        if (edge.node.category && edge.node.category.name) {
            uniqueCategories.add(edge.node.category.name);
        }
    });
    return ["Todas", ...Array.from(uniqueCategories)];
  } catch (error) {
    console.error("Erro ao buscar categorias do Hygraph:", error);
    throw new Error("Não foi possível carregar as categorias do Hygraph.");
  }
}