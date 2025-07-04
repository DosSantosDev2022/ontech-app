'use client' // Marca como Client Component

import { getProductByIdFromHygraph } from '@/lib/hygraph' // Importa a nova função do Hygraph
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RocketIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { Product } from '@/@types'
import { RichText } from '@/components/global/richText'
import { defaultRenders } from '@/components/global/richTextRenders'

export default function ProductDetailPage() {
	const params = useParams()
	const productId = params.id as string

	const {
		data: product,
		isLoading,
		isError,
		error,
	} = useQuery<Product | undefined, Error>({
		queryKey: ['product', productId],
		queryFn: () => getProductByIdFromHygraph(productId),
		enabled: !!productId, // A query só roda se o productId existir
		staleTime: 1000 * 60 * 5, // Cache por 5 minutos
	})

	if (isLoading) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-background text-foreground'>
				<Spinner size='lg' />
				<p className='ml-2 text-lg'>Carregando detalhes do produto...</p>
			</div>
		)
	}

	if (isError) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<Alert variant='destructive' className='mt-8'>
					<RocketIcon className='h-4 w-4' />
					<AlertTitle>Erro ao carregar produto</AlertTitle>
					<AlertDescription>
						{`Não foi possível carregar os detalhes do produto. Detalhes: ${error?.message || 'Erro desconhecido'}`}
					</AlertDescription>
				</Alert>
			</div>
		)
	}

	if (!product) {
		return (
			<div className='container mx-auto px-4 py-8 text-center'>
				<Alert variant='default' className='mt-8'>
					<AlertTitle>Produto não encontrado</AlertTitle>
					<AlertDescription>
						O produto com o ID "{productId}" não foi encontrado.
					</AlertDescription>
				</Alert>
				<Button asChild className='mt-4'>
					<Link href='/'>Voltar para a Home</Link>
				</Button>
			</div>
		)
	}

	return (
		<div className='flex min-h-screen flex-col'>
			<main className='container mx-auto px-4 py-8 flex-grow'>
				<Button asChild variant='outline' className='mb-6'>
					<Link href='/'>← Voltar para os Produtos</Link>
				</Button>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12'>
					{/* Coluna da Esquerda: Imagem de Capa e Ficha Técnica */}
					<div className='flex flex-col gap-8'>
						{/* Imagem de Capa do Produto */}
						<div className='relative w-full aspect-square md:aspect-video rounded-lg overflow-hidden shadow-lg flex items-center justify-center'>
							<Image
								src={product.coverImage || product.imageUrl}
								alt={product.name}
								layout='fill'
								objectFit='cover' // Use "contain" para garantir que a imagem inteira seja visível
								className='object-center'
							/>
						</div>

						{/* Ficha Técnica */}
						<div>
							<h2 className='font-bold text-lg md:text-2xl'>
								Ficha Técnica{' '}
							</h2>
							{product.technicalSpecs && (
								<RichText
									content={product.technicalSpecs.raw}
									renderers={defaultRenders}
								/>
							)}
						</div>
					</div>

					{/* Coluna da Direita: Detalhes do Produto e Links de Afiliados */}
					<div className='flex flex-col gap-6'>
						<h1 className='text-4xl font-extrabold text-primary-foreground mb-2'>
							{product.name}
						</h1>
						<p className='text-base text-muted-foreground leading-relaxed'>
							{product.description}
						</p>

						<Separator className='my-2' />

						{/* Links de Afiliados */}
						{product.affiliateLinks &&
							product.affiliateLinks.length > 0 && (
								<div>
									<h2 className='text-2xl font-semibold mb-3'>
										Onde Comprar
									</h2>
									<div className='flex flex-col gap-3'>
										{product.affiliateLinks.map((link) => (
											<>
											<Button
												key={link.name}
												asChild
												size='lg'
												className='w-full'
											>
												<a
													href={link.url}
													target='_blank'
													rel='noopener noreferrer'
													className='flex items-center justify-center gap-2' 
												>
													Comprar no {link.name}
													{link.icon?.url && ( 
														<Image 
															width={24}
															height={24} 
															alt={link.name} 
															src={link.icon.url} 
														/>
													)}
													
												</a>
											</Button>
										</>
										))}
									</div>
								</div>
							)}
					</div>
				</div>
			</main>
		</div>
	)
}
