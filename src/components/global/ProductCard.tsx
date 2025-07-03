import Image from 'next/image'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Product } from '@/@types' // Importe a interface do produto
import Link from 'next/link'

interface ProductCardProps {
	product: Product
}

export function ProductCard({ product }: ProductCardProps) {
	return (
		<Card className='flex flex-col py-0 overflow-hidden transition-all duration-300 hover:shadow-lg'>
			<CardHeader className='px-0'>
				<div className='relative w-full h-48  overflow-hidden'>
					<Image
						src={product.imageUrl}
						alt={product.name}
						layout='fill'
						objectFit='cover'
					/>
				</div>
			</CardHeader>
			<CardContent className='flex-grow p-4'>
				<CardTitle className='text-lg font-semibold truncate'>
					{product.name}
				</CardTitle>
				<p className='text-gray-600 text-sm mt-1 line-clamp-2'>
					{product.description}
				</p>
			</CardContent>
			<CardFooter className='p-4 pt-0'>
				<Link href={`/product/${product.id}`} passHref className='w-full'>
					<Button asChild className='w-full'>
						<span>Ver mais</span>
					</Button>
				</Link>
			</CardFooter>
		</Card>
	)
}
