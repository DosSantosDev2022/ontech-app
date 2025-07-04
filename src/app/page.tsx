'use client' // Marca como Client Component

import {
  getProductsFromHygraph,
  getCategoriesFromHygraph,
} from '@/lib/hygraph'
import { ProductCard } from '@/components/global/ProductCard'
import {
  useInfiniteQuery,
  useQueryClient,
  useQuery,
} from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { useEffect, useState } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RocketIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    useState<string>('')

  const queryClient = useQueryClient()

  // Hook para buscar as categorias do Hygraph
  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
  } = useQuery<string[], Error>({
    queryKey: ['categories'],
    queryFn: getCategoriesFromHygraph,
    staleTime: 1000 * 60 * 60 * 7,
    placeholderData: ['Todas'],
  })

  // Garante que 'categories' nunca seja undefined
  const categories = categoriesData || ['Todas']
  useEffect(() => {
    console.log('Dados de categorias recebidos:', categoriesData)
  }, [categoriesData])

  const { ref, inView } = useInView({
    threshold: 0,
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['products', selectedCategory, debouncedSearchTerm],
    queryFn: async ({ pageParam = 1 }) => {
      const { products, totalProducts } = await getProductsFromHygraph({
        page: pageParam,
        limit: 12,
        category:
          selectedCategory === 'Todas' ? undefined : selectedCategory,
        searchTerm: debouncedSearchTerm || undefined,
      })
      return { products, totalProducts }
    },
    getNextPageParam: (lastPage, allPages) => {
      const fetchedProductsCount = allPages.reduce(
        (acc, page) => acc + page.products.length,
        0,
      )
      if (fetchedProductsCount < lastPage.totalProducts) {
        return allPages.length + 1
      }
      return undefined
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  })

  // Efeito para debounce do termo de busca
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm])

  // Efeito para o scroll infinito
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Efeito para resetar a paginação (invalidar a query) ao mudar categoria ou termo de busca debounced
  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ['products', selectedCategory, debouncedSearchTerm],
    })
  }, [selectedCategory, debouncedSearchTerm, queryClient])

  // Achata o array de páginas em um único array de produtos
  const products = data?.pages.flatMap((page) => page.products) || []
  const totalFilteredProducts = data?.pages[0]?.totalProducts || 0

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
  }

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSearchTerm(event.target.value)
  }

  // Condições de carregamento e erro combinadas
  if (isLoading || isLoadingCategories) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-background text-foreground'>
        <Spinner size='lg' />
        <p className='ml-2 text-lg'>Carregando produtos e categorias...</p>
      </div>
    )
  }

  if (isError || isErrorCategories) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Alert variant='destructive' className='mt-8'>
          <RocketIcon className='h-4 w-4' />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            {`Não foi possível carregar os produtos ou categorias. Detalhes: ${error?.message || 'Erro desconhecido'}`}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className='flex min-h-screen flex-col'>
      <main className='container mx-auto px-4 py-8 flex-grow'>
        <h1 className='text-3xl font-bold mb-8 text-center text-primary-foreground'>
          Produtos recomendados
        </h1>

        {/* Seção de Filtros */}
        <div className='mb-8 p-4 border rounded-lg bg-card text-card-foreground shadow-sm'>
          <h2 className='text-xl font-semibold mb-4'>Filtrar Produtos</h2>
          
           {/* Filtro por Busca */}
            <div className='w-full mb-2'> {/* Ocupa a largura total disponível */}
              <p className='text-sm font-medium mb-2'>Buscar produtos:</p>
              <Input
                type='text'
                placeholder='Buscar por nome ou descrição...'
                value={searchTerm}
                onChange={handleSearchChange}
                className='w-full'
              />
            </div>
          <div className='flex flex-col sm:flex-row w-full gap-4'>
            {/* Filtro por Categoria */}
            <div className='w-full sm:w-auto flex-shrink-0'> {/* Adicionado flex-shrink-0 */}
              <div>
                <p className='text-sm font-medium mb-2'>Por Categoria:</p>
              </div>
              <div className='flex gap-2 overflow-x-auto pb-2 scrollbar-hide'> {/* overflow-x-auto e scrollbar-hide */}
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={
                      selectedCategory === cat ? 'default' : 'outline'
                    }
                    onClick={() => handleCategoryChange(cat)}
                    className='px-4 py-2 rounded-md flex-shrink-0' // flex-shrink-0 para botões não encolherem
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

           
          </div>
        </div>

        {/* Listagem de Produtos */}
        <div className='grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6'>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Marcador para o scroll infinito */}
        {hasNextPage && (
          <div ref={ref} className='flex justify-center py-8'>
            {isFetchingNextPage ? (
              <>
                <Spinner size='md' />
                <p className='ml-2 text-gray-600'>Carregando mais...</p>
              </>
            ) : (
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                Carregar mais produtos
              </Button>
            )}
          </div>
        )}

        {/* Mensagens de estado */}
        {!hasNextPage && products.length > 0 && (
          <p className='text-center text-gray-500 py-8'>
            Você viu todos os {totalFilteredProducts} produtos!
          </p>
        )}

        {products.length === 0 && !isLoading && !isError && (
          <p className='text-center text-gray-500 py-8'>
            Nenhum produto encontrado com os filtros aplicados.
          </p>
        )}
      </main>
    </div>
  )
}