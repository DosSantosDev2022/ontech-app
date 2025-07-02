"use client"; // Marca como Client Component

import { getProductsFromHygraph, getCategoriesFromHygraph } from "@/lib/hygraph";
import { ProductCard } from "@/components/global/ProductCard";
import { useInfiniteQuery, useQueryClient, useQuery } from "@tanstack/react-query"; // Importe useQuery
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RocketIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/Header"; // Certifique-se de importar o Header

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

  const queryClient = useQueryClient();

  // Hook para buscar as categorias do Hygraph
  const { data: categoriesData, isLoading: isLoadingCategories, isError: isErrorCategories } = useQuery<string[], Error>({
    queryKey: ["categories"],
    queryFn: getCategoriesFromHygraph,
    staleTime: Infinity, // Categorias raramente mudam, então podem ser cacheadas indefinidamente
    placeholderData: ["Todas"] // Mostra "Todas" enquanto carrega
  });

  // Garante que 'categories' nunca seja undefined
  const categories = categoriesData || ["Todas"];


  const { ref, inView } = useInView({
    threshold: 0,
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["products", selectedCategory, debouncedSearchTerm],
    queryFn: async ({ pageParam = 1 }) => {
      // Chama a nova função do Hygraph que retorna produtos e o total
      const { products, totalProducts } = await getProductsFromHygraph({
        page: pageParam,
        limit: 12,
        category: selectedCategory === "Todas" ? undefined : selectedCategory,
        searchTerm: debouncedSearchTerm || undefined,
      });
      return { products, totalProducts }; // Retorna os produtos e o total filtrado
    },
    // Ajusta o getNextPageParam para usar o totalProducts retornado
    getNextPageParam: (lastPage, allPages) => {
      const fetchedProductsCount = allPages.reduce((acc, page) => acc + page.products.length, 0);
      if (fetchedProductsCount < lastPage.totalProducts) {
        return allPages.length + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 1, // 1 minuto de cache
    // placeholderData para manter dados anteriores enquanto carrega nova query
    // Útil para evitar o "pop" de conteúdo ao mudar filtros
    placeholderData: (previousData) => previousData,
  });

  // Efeito para debounce do termo de busca
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Efeito para o scroll infinito
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Efeito para resetar a paginação (invalidar a query) ao mudar categoria ou termo de busca debounced
  useEffect(() => {
    // Invalida a query 'products' para forçar um refetch da primeira página
    // quando selectedCategory ou debouncedSearchTerm mudam.
    queryClient.invalidateQueries({ queryKey: ["products", selectedCategory, debouncedSearchTerm] });
  }, [selectedCategory, debouncedSearchTerm, queryClient]);


  // Achata o array de páginas em um único array de produtos
  // `data?.pages` é um array de `{ products: Product[], totalProducts: number }`
  const products = data?.pages.flatMap((page) => page.products) || [];
  const totalFilteredProducts = data?.pages[0]?.totalProducts || 0; // O total de produtos filtrados vem da primeira página

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Condições de carregamento e erro combinadas
  if (isLoading || isLoadingCategories) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Spinner size="lg" />
        <p className="ml-2 text-lg">Carregando produtos e categorias...</p>
      </div>
    );
  }

  if (isError || isErrorCategories) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mt-8">
          <RocketIcon className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            {`Não foi possível carregar os produtos ou categorias. Detalhes: ${error?.message || "Erro desconhecido"}`}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-8 text-center text-primary-foreground">Nossos Produtos</h1>

        {/* Seção de Filtros */}
        <div className="mb-8 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Filtrar Produtos</h2>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between w-full gap-4">
            {/* Filtro por Categoria */}
            <div className="flex-grow">
              <p className="text-sm font-medium mb-2">Por Categoria:</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    onClick={() => handleCategoryChange(cat)}
                    className="px-4 py-2 rounded-md"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {/* Filtro por Busca */}
            <div className="md:flex-shrink-0">
              <p className="text-sm font-medium mb-2">Busca Específica:</p>
              <Input
                type="text"
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full md:max-w-md"
              />
            </div>
          </div>
        </div>

        {/* Listagem de Produtos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Marcador para o scroll infinito */}
        {hasNextPage && (
          <div ref={ref} className="flex justify-center py-8">
            {isFetchingNextPage ? (
              <>
                <Spinner size="md" />
                <p className="ml-2 text-gray-600">Carregando mais...</p>
              </>
            ) : (
              <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                Carregar mais produtos
              </Button>
            )}
          </div>
        )}

        {/* Mensagens de estado */}
        {!hasNextPage && products.length > 0 && (
          <p className="text-center text-gray-500 py-8">
            Você viu todos os {totalFilteredProducts} produtos!
          </p>
        )}

        {products.length === 0 && !isLoading && !isError && (
          <p className="text-center text-gray-500 py-8">
            Nenhum produto encontrado com os filtros aplicados.
          </p>
        )}
      </main>
    </div>
  );
}