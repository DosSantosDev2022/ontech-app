import type { RichTextContent } from '@graphcms/rich-text-types';
import { GraphQLClient, gql } from 'graphql-request';

export interface ProductCategory {
    name: string;
}

export interface Product {
    id: string;
    name: string;
    imageUrl: string;
    description: string; // Manter description na interface, mesmo que não seja usada na busca
    category: ProductCategory;
    coverImage?: string;
    technicalSpecs?: {
        raw: RichTextContent
    };
    affiliateLinks?: {
        name: string;
        url: string;
    }[];
    longDescription?: {
        raw: RichTextContent
    };
}

const HYGRAPH_API_URL = process.env.NEXT_PUBLIC_HYGRAPH_API_URL;

const graphQLClient = new GraphQLClient(HYGRAPH_API_URL!, {
    headers: {
        // authorization: `Bearer ${process.env.HYGRAPH_ACCESS_TOKEN}`,
    },
});

// --- QUERIES GraphQL ---

const GET_PRODUCTS_QUERY = gql`
  query GetProducts(
    $first: Int = 12,
    $skip: Int = 0,
    $where: ProductWhereInput
  ) {
    products(
      first: $first,
      skip: $skip,
      where: $where
      orderBy: createdAt_DESC
    ) {
      id
      name
      imageUrl {
        url
      }
      description
      category {
        name
      }
      coverImage {
        url
      }
      technicalSpecs {
        raw
      }
      affiliateLinks {
        name
        url
      }
      longDescription {
        raw
      }
    }
    productsConnection(
        where: $where
    ) {
        aggregate {
            count
        }
    }
  }
`;

const GET_PRODUCT_BY_ID_QUERY = gql`
  query GetProductById($id: ID!) {
    product(where: { id: $id }) {
      id
      name
      imageUrl {
        url
      }
      description
      category {
        name
      }
      coverImage {
        url
      }
      technicalSpecs {
        raw
      }
      affiliateLinks {
        name
        url
      }
      longDescription {
        raw
      }
    }
  }
`;

const GET_CATEGORIES_QUERY = gql`
  query GetCategories {
    categories {
      name
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
    imageUrl: { url: string };
    description: string;
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

const mapHygraphProductToProduct = (hygraphProduct: HygraphProduct): Product => {
    return {
        id: hygraphProduct.id,
        name: hygraphProduct.name,
        imageUrl: hygraphProduct.imageUrl?.url,
        description: hygraphProduct.description,
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

    // Array para coletar todas as condições de filtro individuais
    const individualFilterConditions: any[] = [];

    // 1. Condição para o termo de busca (AGORA APENAS POR NOME)
    if (searchTerm) {
        individualFilterConditions.push({ name_contains: searchTerm });
    }

    // 2. Condição para o filtro de categoria
    if (category && category !== "Todas") {
        individualFilterConditions.push({ category: { name_contains: category } });
    }

    // Construir o objeto 'where' final para a variável GraphQL
    let finalWhereInput: any = {};

    if (individualFilterConditions.length === 1) {
        // Se houver apenas UMA condição (seja busca por nome ou categoria),
        // ela se torna o valor do 'where' diretamente.
        finalWhereInput = individualFilterConditions[0];
    } else if (individualFilterConditions.length > 1) {
        // Se houver MÚLTIPLAS condições (busca por nome E categoria),
        // combine-as com um 'AND' no nível superior.
        finalWhereInput = { AND: individualFilterConditions };
    }
    // Se individualFilterConditions.length === 0, finalWhereInput permanece como {} (objeto vazio).

    const variables = {
        first: limit,
        skip,
        where: finalWhereInput,
    };

    console.log("Variáveis enviadas para o Hygraph (BUSCA SIMPLIFICADA):", JSON.stringify(variables, null, 2));


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
        const data = await graphQLClient.request<{ categories: { name: string }[] }>(GET_CATEGORIES_QUERY);
        const uniqueCategories = new Set<string>();
        data.categories.forEach(cat => {
            if (cat.name) {
                uniqueCategories.add(cat.name);
            }
        });

        return ["Todas", ...Array.from(uniqueCategories)];
    } catch (error) {
        console.error("Erro ao buscar categorias do Hygraph:", error);
        throw new Error("Não foi possível carregar as categorias do Hygraph.");
    }
}