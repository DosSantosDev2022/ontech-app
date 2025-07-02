// lib/api-mock.ts

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

const categories = ["Eletrônicos", "Roupas", "Livros", "Casa", "Brinquedos", "Esportes"];

const allProducts: Product[] = Array.from({ length: 100 }, (_, i) => ({
  id: `prod-${i + 1}`,
  name: `Produto ${i + 1}`,
  price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
  imageUrl: `https://picsum.photos/seed/${i + 1}/300/200`, // Imagem para o card
  description: `Descrição breve do Produto ${i + 1}. Ideal para o dia a dia!`,
  category: categories[Math.floor(Math.random() * categories.length)],
  // Dados simulados para a página de detalhes
  coverImage: `https://picsum.photos/seed/${i + 1}-detail/800/600`, // Imagem maior para a capa
  longDescription: `Esta é uma descrição muito mais detalhada do Produto ${i + 1}. Ele oferece funcionalidades incríveis, durabilidade excepcional e um design moderno. Perfeito para quem busca qualidade e inovação. Não perca esta oportunidade!`,
  technicalSpecs: {
    "Peso": `${(Math.random() * 5 + 0.1).toFixed(2)} kg`,
    "Dimensões": `${(Math.random() * 30 + 10).toFixed(0)}x${(Math.random() * 30 + 10).toFixed(0)}x${(Math.random() * 15 + 5).toFixed(0)} cm`,
    "Cor": ["Preto", "Branco", "Azul", "Vermelho"][Math.floor(Math.random() * 4)],
    "Material": ["Plástico", "Metal", "Madeira", "Tecido"][Math.floor(Math.random() * 4)],
  },
  affiliateLinks: [
    { name: "Loja A", url: `https://loja-a.com/produto-${i + 1}` },
    { name: "Loja B", url: `https://loja-b.com/produto-${i + 1}` },
    { name: "Loja C", url: `https://loja-c.com/produto-${i + 1}` },
  ],
}));

interface GetProductsOptions {
  page?: number;
  limit?: number;
  category?: string;
  searchTerm?: string;
}

export async function getProducts({ page = 1, limit = 12, category, searchTerm }: GetProductsOptions): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let filteredProducts = allProducts;

  if (category && category !== "Todas") {
    filteredProducts = filteredProducts.filter(product => product.category === category);
  }

  if (searchTerm) {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    filteredProducts = filteredProducts.filter(product =>
      product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      product.description.toLowerCase().includes(lowerCaseSearchTerm) ||
      product.longDescription?.toLowerCase().includes(lowerCaseSearchTerm) // Busca também na descrição longa
    );
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  return filteredProducts.slice(startIndex, endIndex);
}

// Nova função para buscar um produto por ID
export async function getProductById(id: string): Promise<Product | undefined> {
    await new Promise((resolve) => setTimeout(resolve, 300)); // Simula atraso
    return allProducts.find(product => product.id === id);
}

export const TOTAL_PRODUCTS = allProducts.length;

export function getCategories(): string[] {
    return ["Todas", ...categories];
}